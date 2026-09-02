import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/middleware'

// GET: Sare departments lo
export async function GET(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const departments = await prisma.department.findMany()
    return NextResponse.json(departments)
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST: Naya department banao
export async function POST(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name } = await request.json()
    const department = await prisma.department.create({ data: { name } })
    return NextResponse.json(department, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}