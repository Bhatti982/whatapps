/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_HOSPITAL_WHATSAPP_NUMBER: process.env.HOSPITAL_WHATSAPP_NUMBER,
  }
}

export default nextConfig