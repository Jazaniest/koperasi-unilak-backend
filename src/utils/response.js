/**
 * Kirim response sukses
 */
function ok(res, data = null, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  })
}

/**
 * Kirim response error
 */
function fail(res, message = 'Terjadi kesalahan', statusCode = 400, errors = null) {
  const body = { success: false, message }
  if (errors) body.errors = errors
  return res.status(statusCode).json(body)
}

module.exports = { ok, fail }
