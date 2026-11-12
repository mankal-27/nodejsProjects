import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import { createChatServer } from '../src/server.js';
import { connect, rawConnect, clientFrame, json, closeCode } from './helpers.js';

let server, port;
const clients = [];
async function start(opts) {
  server = createChatServer(opts);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  port = server.address().port;
}
const client = (room, user) => { const c = connect(port, room, user); clients.push(c); return c; };

beforeEach(() => start({ heartbeatMs: 60_000 }));
afterEach(async () => {
  for (const c of clients.splice(0)) try { c.close(); } catch {}
  server.closeAllConnections?.();
  await new Promise((r) => server.close(r));
});

describe('M1: handshake and messages', () => {
  it('M1: computes the correct Sec-WebSocket-Accept (RFC example key)', async () => {
    const raw = await rawConnect(port);
    assert.match(raw.handshake, /^HTTP\/1\.1 101/);
    assert.match(raw.handshake, /sec-websocket-accept: s3pPLMBiTxaQ9kYGzzhZRbK\+xOo=/i);
    raw.socket.destroy();
  });

  it('M1: built-in WebSocket client connects and gets a welcome', async () => {
    const a = client('lobby', 'ada');
    await a.opened;
    const w = await a.next((m) => m.type === 'welcome');
    assert.deepEqual(w, { type: 'welcome', room: 'lobby', user: 'ada', users: ['ada'] });
  });

  it('M1: messages echo back to the sender with user and ts', async () => {
    const a = client('lobby', 'ada');
    await a.opened;
    await a.next((m) => m.type === 'welcome');
    a.send(JSON.stringify({ type: 'message', text: 'hello' }));
    const m = await a.next((m) => m.type === 'message');
    assert.equal(m.user, 'ada');
    assert.equal(m.text, 'hello');
    assert.ok(Math.abs(Date.now() - m.ts) < 5000);
  });

  for (const [name, path, hdr] of [
    ['missing room', '/ws?user=x', ''],
    ['missing user', '/ws?room=x', ''],
    ['wrong path', '/nope?room=x&user=y', ''],
  ]) {
    it(`M1: rejects ${name} with 400`, async () => {
      const raw = await rawConnect(port, path, hdr);
      assert.match(raw.handshake, /^HTTP\/1\.1 400/);
      assert.equal(await raw.ended(), true);
    });
  }
});

describe('M2: rooms', () => {
  it('M2: join is broadcast to others and welcome lists users', async () => {
    const a = client('r1', 'ada');
    await a.next((m) => m.type === 'welcome');
    const b = client('r1', 'bob');
    const w = await b.next((m) => m.type === 'welcome');
    assert.deepEqual([...w.users].sort(), ['ada', 'bob']);
    assert.deepEqual(await a.next((m) => m.type === 'join'), { type: 'join', user: 'bob' });
  });

  it('M2: messages stay inside their room', async () => {
    const a = client('r1', 'ada');
    const b = client('r1', 'bob');
    const c = client('r2', 'cy');
    await Promise.all([a, b, c].map((x) => x.next((m) => m.type === 'welcome')));
    a.send(JSON.stringify({ type: 'message', text: 'secret' }));
    assert.equal((await b.next((m) => m.type === 'message')).text, 'secret');
    await assert.rejects(c.next((m) => m.type === 'message', 300), /timed out/);
  });

  it('M2: leave is broadcast when a client disconnects', async () => {
    const a = client('r1', 'ada');
    await a.next((m) => m.type === 'welcome');
    const b = client('r1', 'bob');
    await b.next((m) => m.type === 'welcome');
    b.close();
    assert.deepEqual(await a.next((m) => m.type === 'leave'), { type: 'leave', user: 'bob' });
  });

  it('M2: invalid input yields an error message but keeps the connection', async () => {
    const a = client('r1', 'ada');
    await a.next((m) => m.type === 'welcome');
    for (const bad of ['not json', JSON.stringify({ type: 'dance' }), JSON.stringify({ type: 'message', text: '' })]) {
      a.send(bad);
      const e = await a.next((m) => m.type === 'error');
      assert.equal(typeof e.message, 'string');
    }
    a.send(JSON.stringify({ type: 'message', text: 'still here' }));
    assert.equal((await a.next((m) => m.type === 'message')).text, 'still here');
  });

  it('M2: GET /rooms lists occupied rooms', async () => {
    const a = client('r1', 'ada');
    const b = client('r2', 'bob');
    await Promise.all([a, b].map((x) => x.next((m) => m.type === 'welcome')));
    const { rooms } = await (await fetch(`http://127.0.0.1:${port}/rooms`)).json();
    const byName = Object.fromEntries(rooms.map((r) => [r.name, r.users]));
    assert.deepEqual(byName, { r1: ['ada'], r2: ['bob'] });
    b.close();
    await b.closed;
    await sleep(50);
    const after = await (await fetch(`http://127.0.0.1:${port}/rooms`)).json();
    assert.deepEqual(after.rooms.map((r) => r.name), ['r1']);
  });
});

describe('M3: lengths, limits, close', () => {
  it('M3: handles 16-bit payload lengths (126..65535)', async () => {
    const a = client('big', 'ada');
    await a.next((m) => m.type === 'welcome');
    const text = 'x'.repeat(5000);
    a.send(JSON.stringify({ type: 'message', text }));
    assert.equal((await a.next((m) => m.type === 'message')).text.length, 5000);
  });

  it('M3: messages above maxMessageBytes close with 1009', async () => {
    const a = client('big', 'ada');
    await a.next((m) => m.type === 'welcome');
    a.send(JSON.stringify({ type: 'message', text: 'x'.repeat(70_000) }));
    const ev = await a.closed;
    assert.equal(ev.code, 1009);
  });

  it('M3: 64-bit length frames under the limit work', async () => {
    await new Promise((r) => server.close(r));
    await start({ maxMessageBytes: 200_000, heartbeatMs: 60_000 });
    const a = client('big', 'ada');
    await a.next((m) => m.type === 'welcome');
    a.send(JSON.stringify({ type: 'message', text: 'y'.repeat(100_000) }));
    assert.equal((await a.next((m) => m.type === 'message', 3000)).text.length, 100_000);
  });

  it('M3: clean close handshake echoes the code', async () => {
    const a = client('c', 'ada');
    await a.next((m) => m.type === 'welcome');
    a.close(1000, 'bye');
    const ev = await a.closed;
    assert.equal(ev.code, 1000);
    assert.equal(ev.wasClean, true);
  });
});

describe('M4: raw protocol', () => {
  it('M4: server frames are unmasked; welcome arrives as a text frame', async () => {
    const raw = await rawConnect(port);
    const f = await raw.nextFrame((f) => f.opcode === 0x1);
    assert.equal(f.masked, false);
    assert.equal(json(f).type, 'welcome');
    raw.socket.destroy();
  });

  it('M4: reassembles fragmented messages', async () => {
    const raw = await rawConnect(port);
    await raw.nextFrame((f) => f.opcode === 0x1 && json(f).type === 'welcome');
    const msg = JSON.stringify({ type: 'message', text: 'fragmented!' });
    raw.send(clientFrame(0x1, msg.slice(0, 10), { fin: false }));
    raw.send(clientFrame(0x0, msg.slice(10, 20), { fin: false }));
    raw.send(clientFrame(0x0, msg.slice(20), { fin: true }));
    const f = await raw.nextFrame((f) => f.opcode === 0x1 && json(f).type === 'message');
    assert.equal(json(f).text, 'fragmented!');
    raw.socket.destroy();
  });

  it('M4: handles a frame split byte-by-byte and several frames in one chunk', async () => {
    const raw = await rawConnect(port);
    await raw.nextFrame((f) => f.opcode === 0x1 && json(f).type === 'welcome');
    const one = clientFrame(0x1, JSON.stringify({ type: 'message', text: 'slow' }));
    for (const byte of one) { raw.send(Buffer.from([byte])); await sleep(1); }
    assert.equal(json(await raw.nextFrame((f) => f.opcode === 0x1 && json(f).type === 'message')).text, 'slow');
    raw.send(Buffer.concat([
      clientFrame(0x1, JSON.stringify({ type: 'message', text: 'a' })),
      clientFrame(0x1, JSON.stringify({ type: 'message', text: 'b' })),
    ]));
    const t1 = json(await raw.nextFrame((f) => f.opcode === 0x1 && json(f).type === 'message')).text;
    const t2 = json(await raw.nextFrame((f) => f.opcode === 0x1 && json(f).type === 'message')).text;
    assert.deepEqual([t1, t2], ['a', 'b']);
    raw.socket.destroy();
  });

  it('M4: replies to ping with pong carrying the same payload', async () => {
    const raw = await rawConnect(port);
    raw.send(clientFrame(0x9, 'are-you-there'));
    const f = await raw.nextFrame((f) => f.opcode === 0xa);
    assert.equal(f.payload.toString(), 'are-you-there');
    raw.socket.destroy();
  });

  it('M4: unmasked client frame -> close 1002', async () => {
    const raw = await rawConnect(port);
    raw.send(clientFrame(0x1, JSON.stringify({ type: 'message', text: 'x' }), { mask: false }));
    const f = await raw.nextFrame((f) => f.opcode === 0x8);
    assert.equal(closeCode(f), 1002);
    raw.socket.destroy();
  });

  it('M4: heartbeat pings clients and drops ones that never pong', async () => {
    await new Promise((r) => server.close(r));
    await start({ heartbeatMs: 100 });
    const alive = client('hb', 'alive'); // built-in client auto-replies to pings
    await alive.next((m) => m.type === 'welcome');
    const dead = await rawConnect(port, '/ws?room=hb&user=dead');
    const ping = await dead.nextFrame((f) => f.opcode === 0x9, 1000);
    assert.ok(ping, 'server should send pings');
    assert.equal(await dead.ended(1500), true, 'unresponsive client should be dropped');
    assert.deepEqual(await alive.next((m) => m.type === 'leave', 1500), { type: 'leave', user: 'dead' });
    await sleep(300);
    assert.equal(alive.readyState, WebSocket.OPEN, 'responsive client must stay connected');
  });
});
