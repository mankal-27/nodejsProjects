// @ts-check
import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { hashPassword, verifyPassword, signToken, verifyToken } from './crypto.js';

/**
 * @param {{ secret: string, dbPath?: string, now?: () => number }} options
 * @returns {http.Server}
 */
export function createAuthServer({ secret, dbPath = ':memory:', now = () => Date.now() }) {
  const db = new DatabaseSync(dbPath);
  // TODO M3: CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL)
  // TODO M4: rate limiter state

  const server = http.createServer(async (req, res) => {
    // TODO M3: route /signup, /login, /me
    res.writeHead(501).end();
  });
  server.on('close', () => db.close());
  return server;
}
