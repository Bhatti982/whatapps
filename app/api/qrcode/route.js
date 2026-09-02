import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { verifyToken } from '@/lib/middleware'

export async function GET(request) {
  const user = verifyToken(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone') || process.env.HOSPITAL_WHATSAPP_NUMBER
    const message = searchParams.get('message') || 'Assalam o Alaikum! Appointment book karni hai.'

    // WhatsApp deep link banao
    const whatsappLink = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`

    // QR code banao (base64 image)
    const qrCodeDataURL = await QRCode.toDataURL(whatsappLink, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff'
      }
    })

    return NextResponse.json({
      qrCode: qrCodeDataURL,
      whatsappLink,
      phone
    })

  } catch (error) {
    console.error('QR Code error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}