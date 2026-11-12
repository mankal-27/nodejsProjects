# 05: WebSocket Chat Server (RFC 6455 from scratch)

Implement the WebSocket protocol yourself on top of `node:http`'s `upgrade` event: handshake,
frame parsing, masking, fragmentation, ping/pong, and close. Then build a multi-room chat on it.
Node ships a WebSocket **client** (global `WebSocket`) but no server, so the tests use the
real client against your server.

```bash
node src/main.js   # :3002
# In a browser console:
const ws = new WebSocket('ws://localhost:3002/ws?room=lobby&user=ada');
ws.onmessage = (e) => console.log(JSON.parse(e.data));
ws.send(JSON.stringify({ type: 'message', text: 'hi' }));
```

## You'll learn
- HTTP `Upgrade`, `server.on('upgrade', (req, socket, head) => ...)`
- `Sec-WebSocket-Accept` = base64(SHA-1(key + GUID))
- **Binary protocol parsing**: bit fields, 7/16/64-bit payload lengths, XOR masking
- Handling TCP's reality: a frame can arrive in pieces, or several frames in one chunk
- Fragmented messages (FIN bit + continuation frames)
- Heartbeats: detecting dead peers with ping/pong
- Close handshake and status codes (1000, 1002, 1009)
- Fan-out / broadcast and managing connection state (rooms)

## Read first
- https://datatracker.ietf.org/doc/html/rfc6455#section-5.2 (the frame diagram; print it)
- https://nodejs.org/api/http.html#event-upgrade
- https://nodejs.org/api/net.html#class-netsocket
- https://nodejs.org/api/buffer.html (`readUInt16BE`, `readBigUInt64BE`)

## Spec: `createChatServer({ heartbeatMs = 30000, maxMessageBytes = 65536 } = {})` → `http.Server`

### Handshake
- `GET /ws?room=<name>&user=<name>` with valid upgrade headers → `101 Switching Protocols`.
- Missing/empty `room` or `user`, wrong path, or `Sec-WebSocket-Version` ≠ `13` → write
  `HTTP/1.1 400 Bad Request\r\n\r\n` to the socket and destroy it.

### Frames
- Client frames **must** be masked. An unmasked one → close with code **1002**.
- Support payload lengths: ≤125, 126 (16-bit), 127 (64-bit).
- Reassemble fragmented messages (opcode 0x1 with FIN=0, then 0x0 continuations).
- Message larger than `maxMessageBytes` → close with code **1009**.
- Ping (0x9) → reply Pong (0xA) with the same payload.
- Close (0x8) → reply with a Close frame echoing the code, then end the socket.
- Server frames are never masked.

### Chat protocol (JSON text messages)
| Direction | Message |
|---|---|
| server → new client | `{"type":"welcome","room","user","users":[...names in room, including self]}` |
| server → others in room | `{"type":"join","user"}` |
| client → server | `{"type":"message","text":"..."}` |
| server → everyone in room (including sender) | `{"type":"message","user","text","ts":<ms epoch>}` |
| server → others when a client disconnects | `{"type":"leave","user"}` |
| server → client on invalid JSON / unknown type / empty text | `{"type":"error","message":"..."}` (connection stays open) |

### HTTP
- `GET /rooms` → `{"rooms":[{"name","users":[...]}]}` (only rooms with ≥1 user)

### Heartbeat
Every `heartbeatMs`, ping every client. A client that hasn't ponged since the previous ping
gets its socket destroyed (and `leave` is broadcast).

## Milestones
- **M1**: handshake + receive/send single small text frames (welcome/message).
- **M2**: rooms, join/leave, errors, `/rooms`.
- **M3**: 16/64-bit lengths, `maxMessageBytes`, close handshake.
- **M4**: raw protocol: fragmentation, unmasked frames, frames split across TCP chunks, ping/pong, heartbeat.

## Stretch goals
- Message history: last 50 messages per room in `node:sqlite`, sent with `welcome`
- Backpressure: if `socket.write()` returns false for a slow client, buffer up to N KB then drop them
- Horizontal scaling: two server processes sharing rooms over a TCP/UDP side-channel (preview of pub/sub)
- A tiny `public/index.html` chat UI served by your project 02 static server
- `permessage-deflate` extension (hard)

<details><summary>Hints</summary>

- Keep a per-connection `Buffer` accumulator. Loop: "do I have a full header? a full payload?" Only then consume.
- Byte 0: `fin = b & 0x80`, `opcode = b & 0x0f`. Byte 1: `masked = b & 0x80`, `len = b & 0x7f`.
- Unmask: `payload[i] ^= mask[i % 4]`.
- Writing: for len < 126 header is 2 bytes; < 65536 → 4 bytes (`126` + uint16); else 10 bytes (`127` + uint64).
- Don't forget the `head` buffer argument of the `upgrade` event: it may already contain frame bytes.
</details>
