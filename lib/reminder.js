import cron from 'node-cron'
import prisma from '@/lib/db'
import { sendWhatsApp } from '@/lib/whatsapp'

export function startReminders() {

  // Har ghante check karo
  cron.schedule('0 * * * *', async () => {
    console.log('⏰ Checking reminders...')

    const now = new Date()

    // 24 hour reminders
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const from24 = new Date(in24h.getTime() - 30 * 60 * 1000)
    const to24 = new Date(in24h.getTime() + 30 * 60 * 1000)

    const appointments24 = await prisma.appointment.findMany({
      where: {
        date: { gte: from24, lte: to24 },
        status: 'CONFIRMED',
        reminder24Sent: false
      },
      include: {
        patient: true,
        doctor: { include: { department: true } }
      }
    })

    for (const apt of appointments24) {
      await sendWhatsApp(
        apt.patient.phone,
        `⏰ *Appointment Reminder!*

Your appointment is tomorrow:

👤 Name: ${apt.patient.name}
👨‍⚕️ Doctor: Dr. ${apt.doctor.name}
🏨 Department: ${apt.doctor.department.name}
📅 Date: ${new Date(apt.date).toLocaleDateString()}
⏰ Time: ${new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

Please be on time! 🏥 Gargaar Hospital`
      )

      await prisma.appointment.update({
        where: { id: apt.id },
        data: { reminder24Sent: true }
      })

      console.log(`✅ 24hr reminder sent: ${apt.patient.phone}`)
    }

    // 2 hour reminders
    const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const from2 = new Date(in2h.getTime() - 30 * 60 * 1000)
    const to2 = new Date(in2h.getTime() + 30 * 60 * 1000)

    const appointments2 = await prisma.appointment.findMany({
      where: {
        date: { gte: from2, lte: to2 },
        status: 'CONFIRMED',
        reminder2Sent: false
      },
      include: {
        patient: true,
        doctor: { include: { department: true } }
      }
    })

    for (const apt of appointments2) {
      await sendWhatsApp(
        apt.patient.phone,
        `🔔 *Appointment in 2 Hours!*

Your appointment is in 2 hours:

👤 Name: ${apt.patient.name}
👨‍⚕️ Doctor: Dr. ${apt.doctor.name}
⏰ Time: ${new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}

Please get ready! 🏥 Gargaar Hospital`
      )

      await prisma.appointment.update({
        where: { id: apt.id },
        data: { reminder2Sent: true }
      })

      console.log(`✅ 2hr reminder sent: ${apt.patient.phone}`)
    }
  })

  console.log('✅ Reminder service started!')
}