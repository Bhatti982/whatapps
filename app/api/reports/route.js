import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/middleware'

export async function GET(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'daily' // daily ya weekly

    const now = new Date()
    let startDate, endDate

    if (type === 'daily') {
      startDate = new Date(now)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
    } else {
      // Weekly - last 7 days
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 7)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(now)
      endDate.setHours(23, 59, 59, 999)
    }

    // Sari appointments is period ki
    const appointments = await prisma.appointment.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: {
        patient: true,
        doctor: { include: { department: true } }
      },
      orderBy: { date: 'asc' }
    })

    // Status counts
    const total = appointments.length
    const confirmed = appointments.filter(a => a.status === 'CONFIRMED').length
    const completed = appointments.filter(a => a.status === 'COMPLETED').length
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length
    const pending = appointments.filter(a => a.status === 'PENDING').length

    // Department wise count
    const deptMap = {}
    appointments.forEach(apt => {
      const deptName = apt.doctor?.department?.name || 'Unknown'
      deptMap[deptName] = (deptMap[deptName] || 0) + 1
    })
    const byDepartment = Object.entries(deptMap).map(([name, count]) => ({ name, count }))

    // Doctor wise count
    const docMap = {}
    appointments.forEach(apt => {
      const docName = `Dr. ${apt.doctor?.name}` || 'Unknown'
      docMap[docName] = (docMap[docName] || 0) + 1
    })
    const byDoctor = Object.entries(docMap).map(([name, count]) => ({ name, count }))

    // Daily breakdown (weekly mein)
    const dailyMap = {}
    appointments.forEach(apt => {
      const day = new Date(apt.date).toLocaleDateString('en-PK', { weekday: 'short', month: 'short', day: 'numeric' })
      dailyMap[day] = (dailyMap[day] || 0) + 1
    })
    const dailyBreakdown = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      period: type,
      startDate,
      endDate,
      summary: { total, confirmed, completed, cancelled, pending },
      byDepartment,
      byDoctor,
      dailyBreakdown,
      appointments
    })

  } catch (error) {
    console.error('Reports error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}