// @ts-check
import http from 'node:http';
// TODO: import { createHash } from 'node:crypto';

export const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
export const OP = { CONT: 0x0, TEXT: 0x1, BINARY: 0x2, CLOSE: 0x8, PING: 0x9, PONG: 0xa };

/**
 * Encode a server -> client frame (never masked).
 * @param {number} opcode
 * @param {Buffer} payload
 * @returns {Buffer}
 */
export function encodeFrame(opcode, payload) {
  // TODO M1 (small lengths), M3 (126 / 127 lengths)
  throw new Error('TODO');
}

/**
 * @param {{ heartbeatMs?: number, maxMessageBytes?: number }} [options]
 * @returns {http.Server}
 */
export function createChatServer({ heartbeatMs = 30_000, maxMessageBytes = 65_536 } = {}) {
  /** @type {Map<string, Set<any>>} room name -> connections */
  const rooms = new Map();

  const server = http.createServer((req, res) => {
    // TODO M2: GET /rooms
    res.writeHead(404).end();
  });

  server.on('upgrade', (req, socket, head) => {
    // TODO M1: validate request, compute Sec-WebSocket-Accept, write the 101 response
    // TODO M1: socket.on('data') -> accumulate -> parse frames
    socket.end('HTTP/1.1 501 Not Implemented\r\n\r\n');
  });

  // TODO M4: heartbeat interval; clear it on server 'close'
  return server;
}
