// @ts-check
import http from 'node:http';
// TODO: import from 'node:fs', 'node:fs/promises', 'node:path', 'node:stream/promises', 'node:zlib'

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  // TODO M1: add the rest from the README
};

/**
 * @param {{ root: string }} options
 * @returns {http.Server}
 */
export function createStaticServer({ root }) {
  // TODO M1: resolve root to an absolute path once
  return http.createServer(async (req, res) => {
    // TODO M1: method check -> 405
    // TODO M2: parse + decode the path safely -> 400 / 403
    // TODO M1: stat the file, handle directories -> index.html
    // TODO M3: ETag / Last-Modified / 304
    // TODO M4: Range
    // TODO M5: gzip
    res.writeHead(501).end('TODO');
  });
}
