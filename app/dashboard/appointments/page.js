'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    patientName: '',
    phone: '',
    doctorId: '',
    date: '',
    notes: ''
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const loadData = async () => {
      try {
        const url = filter === 'ALL'
          ? '/api/appointments'
          : `/api/appointments?status=${filter}`

        const [aptRes, docRes] = await Promise.all([
          fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/doctors', { headers: { Authorization: `Bearer ${token}` } })
        ])

        const [aptData, docData] = await Promise.all([
          aptRes.json(),
          docRes.json()
        ])

        setAppointments(aptData)
        setDoctors(docData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router, filter])

  async function handleAddAppointment() {
    const token = localStorage.getItem('token')
    setSaving(true)
    setError('')

    if (!form.patientName || !form.phone || !form.doctorId || !form.date) {
      setError('Please fill all required fields.')
      setSaving(false)
      return
    }

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })

      const newApt = await res.json()

      if (!res.ok) {
        setError(newApt.error || 'Something went wrong.')
        return
      }

      setAppointments(prev => [...prev, newApt])
      setForm({ patientName: '', phone: '', doctorId: '', date: '', notes: '' })
      setShowForm(false)
    } catch (err) {
      setError('Something went wrong.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleCancel(id) {
    const token = localStorage.getItem('token')
    const confirmed = window.confirm('Are you sure you want to cancel this appointment?')
    if (!confirmed) return

    try {
      await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, status: 'CANCELLED' })
      })

      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a)
      )
    } catch (err) {
      console.error(err)
    }
  }

  async function handleComplete(id) {
    const token = localStorage.getItem('token')
    try {
      await fetch('/api/appointments', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, status: 'COMPLETED' })
      })

      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'COMPLETED' } : a)
      )
    } catch (err) {
      console.error(err)
    }
  }

  const statusColor = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">📋 Appointments</h1>
        <Link href="/dashboard" className="text-sm underline text-white">← Dashboard</Link>
      </nav>

      <div className="p-6">

        {/* Add Appointment Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            ➕ Add Appointment
          </button>
        </div>

        {/* Add Appointment Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow mb-6">
            <h2 className="font-bold text-lg mb-4 text-gray-800">New Appointment</h2>

            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm mb-4">
                ❌ {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Patient Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.patientName}
                  onChange={e => setForm({ ...form, patientName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="+252XXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Doctor <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.doctorId}
                  onChange={e => setForm({ ...form, doctorId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Doctor</option>
                  {doctors.filter(d => d.available).map(d => (
                    <option key={d.id} value={d.id} className="text-gray-900">
                      Dr. {d.name} — {d.department?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Any additional notes..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddAppointment}
                disabled={saving}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : '✅ Save Appointment'}
              </button>
              <button
                onClick={() => { setShowForm(false); setError('') }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['ALL', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === s
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 border'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No appointments found</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700">#</th>
                  <th className="px-4 py-3 text-left text-gray-700">Patient</th>
                  <th className="px-4 py-3 text-left text-gray-700">Phone</th>
                  <th className="px-4 py-3 text-left text-gray-700">Doctor</th>
                  <th className="px-4 py-3 text-left text-gray-700">Department</th>
                  <th className="px-4 py-3 text-left text-gray-700">Date</th>
                  <th className="px-4 py-3 text-left text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt, i) => (
                  <tr key={apt.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{apt.patient?.name}</td>
                    <td className="px-4 py-3 text-gray-800">{apt.patient?.phone}</td>
                    <td className="px-4 py-3 text-gray-800">Dr. {apt.doctor?.name}</td>
                    <td className="px-4 py-3 text-gray-800">{apt.doctor?.department?.name}</td>
                    <td className="px-4 py-3 text-gray-800">
                      {new Date(apt.date).toLocaleDateString()} {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[apt.status]}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {apt.status !== 'COMPLETED' && apt.status !== 'CANCELLED' && (
                          <>
                            <button
                              onClick={() => handleComplete(apt.id)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                            >
                              ✅ Complete
                            </button>
                            <button
                              onClick={() => handleCancel(apt.id)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                              ❌ Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}