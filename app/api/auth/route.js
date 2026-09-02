import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// LOGIN
export async function POST(request) {
  try {
    const { email, password } = await request.json()

    // User dhundo
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Email ya password galat hai' }, { status: 401 })
    }

    // Password check karo
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Email ya password galat hai' }, { status: 401 })
    }

    // Token banao
    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return NextResponse.json({ token, user: { id: user.id, name: user.name, role: user.role } })

  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// REGISTER (sirf admin use kare)
export async function PUT(request) {
  try {
    const { name, email, password, role } = await request.json()

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role: role || 'RECEPTION' }
    })

    return NextResponse.json({ message: 'User ban gaya!', user: { id: user.id, name: user.name } })

  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}