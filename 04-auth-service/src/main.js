import { createAuthServer } from './server.js';
const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) {
  console.error('Set JWT_SECRET to at least 32 chars, e.g. JWT_SECRET=$(openssl rand -hex 32)');
  process.exit(1);
}
const port = Number(process.env.PORT ?? 3001);
createAuthServer({ secret, dbPath: process.env.DB_PATH ?? 'auth.db' }).listen(port, () => console.log(`auth on :${port}`));
