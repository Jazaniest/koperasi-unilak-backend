const { randomBytes } = require('crypto')

/**
 * Generate ID unik dengan prefix.
 * Contoh: generateId('la') -> 'la-1718000000000-x7k2p'
 */
function generateId(prefix) {
  const ts = Date.now()
  const rand = randomBytes(3).toString('hex') // 6 karakter hex
  return `${prefix}-${ts}-${rand}`
}

module.exports = { generateId }
