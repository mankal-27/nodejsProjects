import net from 'node:net';
import { randomBytes } from 'node:crypto';

/** Connect with Node's built-in WebSocket client and collect parsed JSON messages. */
export function connect(port, room, user) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws?room=${encodeURIComponent(room)}&user=${encodeURIComponent(user)}`);
  const inbox = [];
  const waiters = [];
  ws.addEventListener('message', (e) => {
    const msg = JSON.parse(e.data);
    const i = waiters.findIndex((w) => w.pred(msg));
    if (i >= 0) waiters.splice(i, 1)[0].resolve(msg);
    else inbox.push(msg);
  });
  /** Resolve with the next message matching pred (or already received). */
  ws.next = (pred = () => true, timeout = 2000) => {
    const i = inbox.findIndex(pred);
    if (i >= 0) return Promise.resolve(inbox.splice(i, 1)[0]);
    return new Promise((resolve, reject) => {
      const w = { pred, resolve: (m) => { clearTimeout(t); resolve(m); } };
      const t = setTimeout(() => { waiters.splice(waiters.indexOf(w), 1); reject(new Error('timed out waiting for message')); }, timeout);
      waiters.push(w);
    });
  };
  ws.opened = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error('connection failed')), { once: true });
  });
  ws.closed = new Promise((resolve) => ws.addEventListener('close', resolve, { once: true }));
  return ws;
}

/** Build a client -> server frame. */
export function clientFrame(opcode, payload, { fin = true, mask = true } = {}) {
  payload = Buffer.from(payload);
  const len = payload.length;
  const header = [];
  header.push((fin ? 0x80 : 0) | opcode);
  const m = mask ? 0x80 : 0;
  if (len < 126) header.push(m | len);
  else if (len < 65536) header.push(m | 126, len >> 8, len & 0xff);
  else throw new Error('helper supports < 64KiB');
  const parts = [Buffer.from(header)];
  if (mask) {
    const key = randomBytes(4);
    const masked = Buffer.from(payload);
    for (let i = 0; i < masked.length; i++) masked[i] ^= key[i % 4];
    parts.push(key, masked);
  } else parts.push(payload);
  return Buffer.concat(parts);
}

/** Raw TCP client that performs the handshake and parses (unmasked) server frames. */
export async function rawConnect(port, path = '/ws?room=raw&user=raw', extraHeaders = '') {
  const socket = net.connect(port, '127.0.0.1');
  await new Promise((r, j) => { socket.once('connect', r); socket.once('error', j); });
  socket.write(
    `GET ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n` +
      `Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\nSec-WebSocket-Version: 13\r\n${extraHeaders}\r\n`,
  );
  let buf = Buffer.alloc(0);
  let response = null;
  const frames = [];
  const waiters = [];
  let ended = false;
  const endWaiters = [];
  const flush = () => {
    while (waiters.length && frames.length) {
      const i = frames.findIndex(waiters[0].pred);
      if (i < 0) break;
      waiters.shift().resolve(frames.splice(i, 1)[0]);
    }
  };
  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    if (!response) {
      const idx = buf.indexOf('\r\n\r\n');
      if (idx < 0) return;
      response = buf.subarray(0, idx).toString();
      buf = buf.subarray(idx + 4);
      socket.emit('handshake', response);
    }
    for (;;) {
      if (buf.length < 2) break;
      const opcode = buf[0] & 0x0f;
      let len = buf[1] & 0x7f;
      let off = 2;
      if (len === 126) { if (buf.length < 4) break; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { if (buf.length < 10) break; len = Number(buf.readBigUInt64BE(2)); off = 10; }
      if (buf.length < off + len) break;
      frames.push({ opcode, fin: !!(buf[0] & 0x80), masked: !!(buf[1] & 0x80), payload: buf.subarray(off, off + len) });
      buf = buf.subarray(off + len);
    }
    flush();
  });
  const onEnd = () => { ended = true; endWaiters.splice(0).forEach((r) => r()); };
  socket.on('close', onEnd);
  socket.on('end', onEnd);
  socket.on('error', () => {});
  const handshake = await new Promise((resolve, reject) => {
    if (response) return resolve(response);
    socket.once('handshake', resolve);
    socket.once('close', () => resolve(response ?? buf.toString()));
    setTimeout(() => reject(new Error('handshake timeout')), 2000);
  });
  return {
    socket,
    handshake,
    send: (b) => socket.write(b),
    nextFrame(pred = () => true, timeout = 2000) {
      return new Promise((resolve, reject) => {
        const w = { pred, resolve: (f) => { clearTimeout(t); resolve(f); } };
        const t = setTimeout(() => { waiters.splice(waiters.indexOf(w), 1); reject(new Error('timed out waiting for frame')); }, timeout);
        waiters.push(w);
        flush();
      });
    },
    ended(timeout = 2000) {
      if (ended) return Promise.resolve(true);
      return new Promise((resolve) => { endWaiters.push(() => resolve(true)); setTimeout(() => resolve(false), timeout); });
    },
  };
}

export const json = (f) => JSON.parse(f.payload.toString());
export const closeCode = (f) => (f.payload.length >= 2 ? f.payload.readUInt16BE(0) : null);
