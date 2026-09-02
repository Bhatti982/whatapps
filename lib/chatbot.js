import prisma from '@/lib/db'

export async function handleChatbot(phone, message) {
  const msg = message?.trim().toLowerCase()

  // Get or create session
  let session = await prisma.chatSession.upsert({
    where: { phone },
    update: { updatedAt: new Date() },
    create: { phone, step: 'WELCOME' }
  })

  // Human handover check
  if (session.isHuman) {
    return '✋ Your message has been forwarded to reception.\n\nType *#back* to return to the chatbot.'
  }

  // #back command
  if (msg === '#back') {
    await prisma.chatSession.update({
      where: { phone },
      data: { isHuman: false, step: 'WELCOME' }
    })
    return '🤖 You are back on the chatbot!\n\nType anything to get started.'
  }

  // 0 = back to main menu
  if (msg === '0') {
    await updateSession(phone, 'WELCOME', {})
    return getWelcomeMessage()
  }

  switch (session.step) {

    case 'WELCOME': {
      await updateSession(phone, 'MAIN_MENU', {})
      return getWelcomeMessage()
    }

    case 'MAIN_MENU': {
      if (msg === '1') {
        const departments = await prisma.department.findMany()

        if (departments.length === 0) {
          return '❌ No departments available at the moment.\nPlease try again later or contact reception.'
        }

        const deptList = departments
          .map((d, i) => `${i + 1}️⃣ ${d.name}`)
          .join('\n')

        await updateSession(phone, 'SELECT_DEPARTMENT', {
          departments: departments.map(d => d.id)
        })

        return `🏨 *Select a Department:*\n\n${deptList}\n\n_Type 0 to go back_`
      }

      if (msg === '2') {
        return await checkAppointment(phone)
      }

      if (msg === '3') {
        await updateSession(phone, 'MAIN_MENU', {})
        return getFAQ()
      }

      if (msg === '4') {
        await prisma.chatSession.update({
          where: { phone },
          data: { isHuman: true }
        })
        return '📞 *Connecting you to reception...*\n\nSomeone will reply shortly.\n\nType *#back* to return to chatbot.'
      }

      return `❌ Please type only *1, 2, 3, or 4*\n\n${getWelcomeMessage()}`
    }

    case 'SELECT_DEPARTMENT': {
      const deptIds = session.data?.departments || []
      const deptIndex = parseInt(msg) - 1

      if (isNaN(deptIndex) || deptIndex < 0 || deptIndex >= deptIds.length) {
        return '❌ Please enter a valid number.\n\n_Type 0 to go back_'
      }

      const selectedDeptId = deptIds[deptIndex]
      const doctors = await prisma.doctor.findMany({
        where: { departmentId: selectedDeptId, available: true }
      })

      if (doctors.length === 0) {
        await updateSession(phone, 'MAIN_MENU', {})
        return '❌ No doctors available in this department.\n\nPlease try another department.\n\nType 0 to go back.'
      }

      const docList = doctors
        .map((d, i) => `${i + 1}️⃣ Dr. ${d.name}`)
        .join('\n')

      await updateSession(phone, 'SELECT_DOCTOR', {
        departmentId: selectedDeptId,
        doctors: doctors.map(d => d.id)
      })

      return `👨‍⚕️ *Select a Doctor:*\n\n${docList}\n\n_Type 0 to go back_`
    }

    case 'SELECT_DOCTOR': {
      const docIds = session.data?.doctors || []
      const docIndex = parseInt(msg) - 1

      if (isNaN(docIndex) || docIndex < 0 || docIndex >= docIds.length) {
        return '❌ Please enter a valid number.\n\n_Type 0 to go back_'
      }

      const selectedDocId = docIds[docIndex]
      const slots = await prisma.timeSlot.findMany({
        where: { doctorId: selectedDocId, isBooked: false }
      })

      if (slots.length === 0) {
        await updateSession(phone, 'MAIN_MENU', {})
        return '❌ No available slots for this doctor.\n\nPlease choose another doctor.\n\nType 0 to go back.'
      }

      const slotList = slots
        .map((s, i) => `${i + 1}️⃣ ${s.day} — ${s.startTime} to ${s.endTime}`)
        .join('\n')

      await updateSession(phone, 'SELECT_SLOT', {
        ...session.data,
        doctorId: selectedDocId,
        slots: slots.map(s => s.id)
      })

      return `🕐 *Select a Time Slot:*\n\n${slotList}\n\n_Type 0 to go back_`
    }

    case 'SELECT_SLOT': {
      const slotIds = session.data?.slots || []
      const slotIndex = parseInt(msg) - 1

      if (isNaN(slotIndex) || slotIndex < 0 || slotIndex >= slotIds.length) {
        return '❌ Please enter a valid number.\n\n_Type 0 to go back_'
      }

      const selectedSlotId = slotIds[slotIndex]
      const slot = await prisma.timeSlot.findUnique({
        where: { id: selectedSlotId }
      })

      await updateSession(phone, 'GET_NAME', {
        ...session.data,
        slotId: selectedSlotId,
        day: slot.day,
        time: slot.startTime
      })

      return '👤 Please enter your *full name*:'
    }

    case 'GET_NAME': {
      if (!message || message.trim().length < 2) {
        return '❌ Please enter a valid full name:'
      }

      await updateSession(phone, 'CONFIRM', {
        ...session.data,
        name: message.trim()
      })

      const d = session.data

      return `✅ *Please Confirm Your Booking:*

👤 Name: ${message.trim()}
📅 Day: ${d.day}
⏰ Time: ${d.time}

Type *1* to confirm
Type *2* to cancel`
    }

    case 'CONFIRM': {
      if (msg === '1') {
        try {
          await bookAppointment(phone, session.data)
          await updateSession(phone, 'WELCOME', {})

          return `🎉 *Appointment Booked Successfully!*

👤 Name: ${session.data.name}
📅 Day: ${session.data.day}
⏰ Time: ${session.data.time}

You will receive reminders:
⏰ 24 hours before
⏰ 2 hours before

Thank you! 🏥 *Gargaar Hospital*`

        } catch (err) {
          console.error('Booking error:', err)
          await updateSession(phone, 'WELCOME', {})
          return '❌ Booking failed. Please try again or contact reception.'
        }
      }

      if (msg === '2') {
        await updateSession(phone, 'WELCOME', {})
        return '❌ Booking cancelled.\n\nType anything to start again.'
      }

      return 'Please type *1* to confirm or *2* to cancel.'
    }

    default: {
      await updateSession(phone, 'WELCOME', {})
      return getWelcomeMessage()
    }
  }
}

// ── Helper Functions ──────────────────────────────

function getWelcomeMessage() {
  return `🏥 *Welcome to Gargaar Hospital!*

How can I help you today?

1️⃣ Book an appointment
2️⃣ Check your appointment
3️⃣ FAQs
4️⃣ Talk to reception

_Type a number (1, 2, 3, or 4)_`
}

async function updateSession(phone, step, data) {
  await prisma.chatSession.update({
    where: { phone },
    data: { step, data }
  })
}

async function bookAppointment(phone, data) {
  let patient = await prisma.patient.findUnique({ where: { phone } })

  if (!patient) {
    patient = await prisma.patient.create({
      data: { name: data.name, phone }
    })
  } else {
    await prisma.patient.update({
      where: { phone },
      data: { name: data.name }
    })
  }

  await prisma.timeSlot.update({
    where: { id: data.slotId },
    data: { isBooked: true }
  })

  const slotDate = getSlotDate(data.day, data.time)

  await prisma.appointment.create({
    data: {
      patientId: patient.id,
      doctorId: data.doctorId,
      date: slotDate,
      status: 'CONFIRMED'
    }
  })
}

async function checkAppointment(phone) {
  const patient = await prisma.patient.findUnique({
    where: { phone },
    include: {
      appointments: {
        include: {
          doctor: { include: { department: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      }
    }
  })

  if (!patient || patient.appointments.length === 0) {
    return '❌ No appointments found.\n\nType 1 to book a new appointment.'
  }

  const list = patient.appointments
    .map((apt, i) =>
      `*${i + 1}.* Dr. ${apt.doctor.name}\n` +
      `    🏨 ${apt.doctor.department.name}\n` +
      `    📅 ${new Date(apt.date).toLocaleDateString()}\n` +
      `    ⏰ ${new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n` +
      `    ✅ ${apt.status}`
    )
    .join('\n\n')

  return `📋 *Your Appointments:*\n\n${list}\n\n_Type 0 to go back_`
}

function getFAQ() {
  return `❓ *Frequently Asked Questions:*

📍 *Address:*
Mogadishu, Somalia — Main Road

⏰ *Working Hours:*
Monday to Friday: 8am — 8pm
Saturday: 9am — 5pm
Sunday: Closed

💊 *Services:*
General, Pediatrics, Gynecology, Orthopedics, Ophthalmology

💰 *Fees:*
Consultation: $10
Follow-up: $5

📞 *Contact:*
+252 XX XXX XXXX

_Type 0 to go back_`
}

function getSlotDate(day, time) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const today = new Date()
  const todayDay = today.getDay()
  const targetDay = days.indexOf(day)

  let daysUntil = targetDay - todayDay
  if (daysUntil <= 0) daysUntil += 7

  const date = new Date(today)
  date.setDate(today.getDate() + daysUntil)

  const [hours, minutes] = time.split(':')
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0)

  return date
}