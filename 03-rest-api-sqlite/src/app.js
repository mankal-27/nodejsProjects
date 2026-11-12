// @ts-check
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';

/**
 * @param {{ dbPath?: string }} [options]
 * @returns {http.Server}
 */
export function createApp({ dbPath = ':memory:' } = {}) {
  const db = new DatabaseSync(dbPath);
  // TODO M1: create tables (CREATE TABLE IF NOT EXISTS ...)
  // TODO M1: define routes, e.g. [{ pattern: new URLPattern({ pathname: '/bookmarks/:id' }), handlers: { GET, PATCH, DELETE } }]

  const server = http.createServer(async (req, res) => {
    // TODO M1: match route -> 404 / 405 / handler
    // TODO M2: readJson(req) with 1 MiB limit + content-type check
    sendError(res, 501, 'INTERNAL', 'not implemented');
  });
  server.on('close', () => db.close());
  return server;
}

/** Helper you can keep or replace. */
export function sendJson(res, status, body, headers = {}) {
  const data = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': Buffer.byteLength(data), ...headers });
  res.end(data);
}

export function sendError(res, status, code, message, details) {
  sendJson(res, status, { error: { code, message, ...(details ? { details } : {}) } });
}
