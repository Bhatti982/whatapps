import axios from 'axios'

const INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID
const TOKEN = process.env.ULTRAMSG_TOKEN

export async function sendWhatsApp(phone, message) {
  try {
    const cleanPhone = phone.replace('+', '').replace('@c.us', '')

    const res = await axios.post(
      `https://api.ultramsg.com/${INSTANCE_ID}/messages/chat`,
      {
        token: TOKEN,
        to: cleanPhone,
        body: message
      }
    )

    console.log(`✅ Message sent to ${cleanPhone}`, res.data)
    return res.data
  } catch (error) {
    console.error('❌ WhatsApp send error:', error.message)
  }
}