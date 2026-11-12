// @ts-check
/**
 * @typedef {{ id: string, text: string, tags: string[], createdAt: string }} Note
 * @typedef {{
 *   add(text: string, opts?: { tags?: string[] }): Promise<Note>,
 *   list(opts?: { tag?: string }): Promise<Note[]>,
 *   get(id: string): Promise<Note | null>,
 *   remove(id: string): Promise<boolean>,
 *   search(query: string): Promise<Note[]>,
 * }} Store
 */

// TODO: import what you need from 'node:fs/promises', 'node:crypto', 'node:path'

/**
 * Open (or lazily create) a JSON-file-backed note store.
 * @param {string} filePath
 * @returns {Promise<Store>}
 */
export async function openStore(filePath) {
  // TODO M1: load notes from filePath (missing file => [])
  // TODO M3: invalid JSON => throw an Error with code 'E_CORRUPT'
  throw new Error('TODO: implement openStore');
}
