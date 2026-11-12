// @ts-check
// TODO: import { scrypt, randomBytes, createHmac, timingSafeEqual } from 'node:crypto';

/** @param {string} password @returns {Promise<string>} */
export async function hashPassword(password) {
  throw new Error('TODO M1');
}

/** @param {string} password @param {string} stored @returns {Promise<boolean>} */
export async function verifyPassword(password, stored) {
  throw new Error('TODO M1');
}

/**
 * @param {Record<string, unknown>} payload
 * @param {string} secret
 * @param {{ expiresInSec?: number, now?: number }} [opts]
 * @returns {string}
 */
export function signToken(payload, secret, { expiresInSec = 3600, now = Date.now() } = {}) {
  throw new Error('TODO M2');
}

/**
 * @param {string} token
 * @param {string} secret
 * @param {{ now?: number }} [opts]
 * @returns {Record<string, unknown>}
 */
export function verifyToken(token, secret, { now = Date.now() } = {}) {
  throw new Error('TODO M2');
}
