import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Seeding database...')

  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@hospital.com' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@hospital.com',
      password: hashedPassword,
      role: 'ADMIN'
    }
  })
  console.log('✅ Admin user created: admin@hospital.com / admin123')

  const depts = ['General', 'Pediatrics', 'Gynecology', 'Orthopedics', 'Ophthalmology']
  const createdDepts = []

  for (const name of depts) {
    const dept = await prisma.department.upsert({
      where: { name },
      update: {},
      create: { name }
    })
    createdDepts.push(dept)
  }
  console.log('✅ Departments created:', depts.join(', '))

  const doctors = [
    { name: 'Ahmed Ali', deptIndex: 0 },
    { name: 'Fatima Hassan', deptIndex: 1 },
    { name: 'Omar Sheikh', deptIndex: 2 },
    { name: 'Amina Warsame', deptIndex: 3 },
  ]

  for (const doc of doctors) {
    const created = await prisma.doctor.create({
      data: {
        name: doc.name,
        departmentId: createdDepts[doc.deptIndex].id,
        available: true
      }
    })

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Sunday']
    const times = [
      { start: '09:00', end: '09:30' },
      { start: '09:30', end: '10:00' },
      { start: '10:00', end: '10:30' },
      { start: '10:30', end: '11:00' },
      { start: '11:00', end: '11:30' },
    ]

    for (let i = 0; i < days.length; i++) {
      await prisma.timeSlot.create({
        data: {
          doctorId: created.id,
          day: days[i],
          startTime: times[i].start,
          endTime: times[i].end,
          isBooked: false
        }
      })
    }
    console.log(`✅ Dr. ${doc.name} + slots created`)
  }

  const faqs = [
    { question: 'Where is the hospital?', answer: 'Mogadishu, Somalia — Main Road', keyword: 'address' },
    { question: 'What are the working hours?', answer: 'Monday to Friday: 8am - 8pm, Saturday: 9am - 5pm', keyword: 'hours' },
    { question: 'What are the consultation fees?', answer: 'Consultation: $10, Follow-up: $5', keyword: 'fees' },
  ]

  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq }).catch(() => {})
  }

  console.log('✅ FAQs created')
  console.log('\n🎉 Seed complete!')
  console.log('Login: admin@hospital.com | Password: admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())