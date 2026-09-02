import { NextResponse } from 'next/server'
import { startReminders } from '@/lib/reminder'

let started = false

export async function GET() {
  if (!started) {
    startReminders()
    started = true
    return NextResponse.json({ message: 'Reminders shuru ho gaye!' })
  }
  return NextResponse.json({ message: 'Reminders pehle se chal rahe hain' })
}