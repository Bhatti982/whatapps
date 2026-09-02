import jwt from 'jsonwebtoken'

export function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) return null

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return decoded

  } catch (error) {
    return null
  }
}