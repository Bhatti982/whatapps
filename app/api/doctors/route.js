import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/middleware'

// ── GET: Sare doctors lo ───────────────────────────
export async function GET(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const doctors = await prisma.doctor.findMany({
      include: { department: true, slots: true },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(doctors)
  } catch (error) {
    console.error('GET doctors error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── POST: Naya doctor banao ────────────────────────
export async function POST(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, departmentId } = await request.json()

    const doctor = await prisma.doctor.create({
      data: {
        name,
        departmentId: parseInt(departmentId)
      },
      include: { department: true }
    })

    return NextResponse.json(doctor, { status: 201 })
  } catch (error) {
    console.error('POST doctor error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PATCH: Doctor update karo ──────────────────────
export async function PATCH(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, name, available } = await request.json()

    const doctor = await prisma.doctor.update({
      where: { id: parseInt(id) },
      data: { name, available },
      include: { department: true }
    })

    return NextResponse.json(doctor)
  } catch (error) {
    console.error('PATCH doctor error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── DELETE: Doctor hatao ───────────────────────────
export async function DELETE(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()

    await prisma.doctor.delete({ where: { id: parseInt(id) } })

    return NextResponse.json({ message: 'Doctor hata diya gaya' })
  } catch (error) {
    console.error('DELETE doctor error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}