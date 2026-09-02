import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/middleware'

export async function GET(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)

    const [total, todayCount, pending, completed] = await Promise.all([
      prisma.appointment.count(),
      prisma.appointment.count({
        where: { date: { gte: today, lte: todayEnd } }
      }),
      prisma.appointment.count({ where: { status: 'PENDING' } }),
      prisma.appointment.count({ where: { status: 'COMPLETED' } })
    ])

    return NextResponse.json({ total, today: todayCount, pending, completed })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}