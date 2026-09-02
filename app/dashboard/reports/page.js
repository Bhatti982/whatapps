'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function ReportsPage() {
  const router = useRouter()
  const [report, setReport] = useState(null)
  const [type, setType] = useState('daily')
  const [loading, setLoading] = useState(true)
  const [qrCode, setQrCode] = useState(null)
  const [whatsappLink, setWhatsappLink] = useState('')
  const [qrLoading, setQrLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const loadReport = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/reports?type=${type}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setReport(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [router, type])

  async function generateQR() {
    const token = localStorage.getItem('token')
    setQrLoading(true)
    try {
      const res = await fetch('/api/qrcode', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setQrCode(data.qrCode)
      setWhatsappLink(data.whatsappLink)
    } catch (err) {
      console.error(err)
    } finally {
      setQrLoading(false)
    }
  }

  function downloadQR() {
    const link = document.createElement('a')
    link.href = qrCode
    link.download = 'hospital-whatsapp-qr.png'
    link.click()
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📊 Reports & QR Code</h1>
        <Link href="/dashboard" className="text-sm underline">← Dashboard</Link>
      </nav>

      <div className="p-6">

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setType('daily')}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
              type === 'daily'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border'
            }`}
          >
            📅 Daily Report
          </button>
          <button
            onClick={() => setType('weekly')}
            className={`px-6 py-2 rounded-lg font-medium text-sm transition ${
              type === 'weekly'
                ? 'bg-green-600 text-white'
                : 'bg-white text-gray-600 border'
            }`}
          >
            📆 Weekly Report
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : report && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <SummaryCard label="Total" value={report.summary.total} color="blue" />
              <SummaryCard label="Confirmed" value={report.summary.confirmed} color="green" />
              <SummaryCard label="Completed" value={report.summary.completed} color="purple" />
              <SummaryCard label="Pending" value={report.summary.pending} color="yellow" />
              <SummaryCard label="Cancelled" value={report.summary.cancelled} color="red" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

              {/* Department Wise */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-bold text-lg mb-4">🏨 By Department</h2>
                {report.byDepartment.length === 0 ? (
                  <p className="text-gray-500 text-sm">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {report.byDepartment.map((dept, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{dept.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-green-500 h-2 rounded-full"
                              style={{
                                width: `${(dept.count / report.summary.total) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-green-600 w-6">
                            {dept.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Doctor Wise */}
              <div className="bg-white rounded-xl shadow p-6">
                <h2 className="font-bold text-lg mb-4">👨‍⚕️ By Doctor</h2>
                {report.byDoctor.length === 0 ? (
                  <p className="text-gray-500 text-sm">No data available</p>
                ) : (
                  <div className="space-y-3">
                    {report.byDoctor.map((doc, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">{doc.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{
                                width: `${(doc.count / report.summary.total) * 100}%`
                              }}
                            />
                          </div>
                          <span className="text-sm font-bold text-blue-600 w-6">
                            {doc.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Weekly Daily Breakdown */}
            {type === 'weekly' && report.dailyBreakdown.length > 0 && (
              <div className="bg-white rounded-xl shadow p-6 mb-6">
                <h2 className="font-bold text-lg mb-4">📈 Daily Breakdown</h2>
                <div className="space-y-3">
                  {report.dailyBreakdown.map((day, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-sm text-gray-700 w-32">{day.date}</span>
                      <div className="flex items-center gap-2 flex-1 ml-4">
                        <div className="flex-1 bg-gray-100 rounded-full h-3">
                          <div
                            className="bg-green-500 h-3 rounded-full"
                            style={{
                              width: `${(day.count / report.summary.total) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-green-600 w-6">
                          {day.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* QR Code Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-bold text-lg mb-2">📱 WhatsApp QR Code</h2>
          <p className="text-gray-500 text-sm mb-4">
            Place this QR code on hospital posters, banners, and receipts.
            Scanning it will open WhatsApp directly.
          </p>

          {!qrCode ? (
            <button
              onClick={generateQR}
              disabled={qrLoading}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {qrLoading ? 'Generating...' : '🔳 Generate QR Code'}
            </button>
          ) : (
            <div className="flex flex-col md:flex-row gap-6 items-start">

              {/* QR Image */}
              <div className="border-4 border-green-500 rounded-xl p-3">
                <Image src={qrCode} alt="WhatsApp QR Code" width={192} height={192} />
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-2">WhatsApp Link:</p>
                <div className="bg-gray-50 border rounded-lg px-3 py-2 text-sm text-blue-600 break-all mb-4">
                  {whatsappLink}
                </div>

                <div className="flex gap-3 flex-wrap">
                  <button
                    onClick={downloadQR}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
                  >
                    ⬇️ Download PNG
                  </button>
                  <button
                    onClick={() => navigator.clipboard.writeText(whatsappLink)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                  >
                    📋 Copy Link
                  </button>
                  <button
                    onClick={() => { setQrCode(null); setWhatsappLink('') }}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
                  >
                    🔄 Reset
                  </button>
                </div>

                {/* Facebook Ad Info */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-bold text-blue-700 text-sm mb-2">
                    📘 For Facebook Ads:
                  </h3>
                  <p className="text-blue-600 text-xs">
                    Create a &quot;Click to WhatsApp&quot; campaign in Facebook Ads Manager
                    and use this number:
                  </p>
                  <p className="font-bold text-blue-800 text-sm mt-1">
                    +{process.env.NEXT_PUBLIC_HOSPITAL_WHATSAPP_NUMBER || '252XXXXXXXXX'}
                  </p>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function SummaryCard({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  }

  return (
    <div className={`border rounded-xl p-4 text-center ${colors[color]}`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-xs mt-1">{label}</div>
    </div>
  )
}