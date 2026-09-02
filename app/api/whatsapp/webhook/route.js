import { NextResponse } from 'next/server'
import { handleChatbot } from '@/lib/chatbot'
import { sendWhatsApp } from '@/lib/whatsapp'

export async function GET() {
  return NextResponse.json({ status: '✅ WhatsApp webhook active' })
}

export async function POST(request) {
  try {
    const body = await request.json()
    console.log('📩 Incoming message:', JSON.stringify(body))

    const data = body.data
    if (!data) return NextResponse.json({ status: 'no data' })

    // Sirf text messages
    if (data.type !== 'chat') return NextResponse.json({ status: 'ignored' })

    // Apne messages ignore karo
    if (data.fromMe) return NextResponse.json({ status: 'own message ignored' })

    const phone = data.from.replace('@c.us', '')
    const message = data.body

    console.log(`📱 From: ${phone} | Message: ${message}`)

    const reply = await handleChatbot(phone, message)
    await sendWhatsApp(phone, reply)

    return NextResponse.json({ status: 'ok' })

  } catch (error) {
    console.error('❌ Webhook error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}