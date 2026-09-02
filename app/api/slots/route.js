import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/middleware'

// GET: Doctor ke slots lo
export async function GET(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')

    const slots = await prisma.timeSlot.findMany({
      where: { doctorId: parseInt(doctorId) },
      orderBy: { day: 'asc' }
    })

    return NextResponse.json(slots)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: Naya slot banao
export async function POST(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { doctorId, day, startTime, endTime } = await request.json()

    const slot = await prisma.timeSlot.create({
      data: {
        doctorId: parseInt(doctorId),
        day,
        startTime,
        endTime
      }
    })

    return NextResponse.json(slot, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// DELETE: Slot hatao
export async function DELETE(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    await prisma.timeSlot.delete({ where: { id: parseInt(id) } })
    return NextResponse.json({ message: 'Slot hata diya gaya' })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}