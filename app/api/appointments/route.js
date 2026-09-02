import { NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { verifyToken } from '@/lib/middleware'
import { sendWhatsApp } from '@/lib/whatsapp'

// ── GET: Sari appointments lo ──────────────────────
export async function GET(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    const where = {}
    if (status) where.status = status
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        doctor: {
          include: { department: true }
        }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('GET appointments error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── POST: Manual appointment banao (reception) ─────
export async function POST(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { patientName, phone, doctorId, date, notes } = await request.json()

    // Patient dhundo ya banao
    let patient = await prisma.patient.findUnique({ where: { phone } })
    if (!patient) {
      patient = await prisma.patient.create({
        data: { name: patientName, phone }
      })
    }

    // Appointment banao
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: parseInt(doctorId),
        date: new Date(date),
        status: 'CONFIRMED',
        notes
      },
      include: {
        doctor: {
          include: { department: true }
        },
        patient: true
      }
    })

    // WhatsApp confirmation bhejo
    await sendWhatsApp(
      phone,
      `✅ *Appointment Confirm Ho Gayi!*

👤 Naam: ${patientName}
👨‍⚕️ Doctor: Dr. ${appointment.doctor.name}
🏨 Department: ${appointment.doctor.department.name}
📅 Date: ${new Date(date).toLocaleDateString('ur-PK')}
⏰ Waqt: ${new Date(date).toLocaleTimeString('ur-PK', { hour: '2-digit', minute: '2-digit' })}

Shukriya! 🏥 Gargaar Hospital`
    )

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('POST appointment error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// ── PATCH: Appointment update karo ─────────────────
export async function PATCH(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id, status } = await request.json()

    const appointment = await prisma.appointment.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        patient: true,
        doctor: true
      }
    })

    // Cancel hone par WhatsApp message bhejo
    if (status === 'CANCELLED') {
      await sendWhatsApp(
        appointment.patient.phone,
        `❌ *Appointment Cancel Ho Gayi*

Aapki appointment cancel kar di gayi hai.
Dobara book karne ke liye WhatsApp karein.

🏥 Gargaar Hospital`
      )
    }

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('PATCH appointment error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}