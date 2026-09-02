'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DoctorsPage() {
  const router = useRouter()
  const [doctors, setDoctors] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [showDeptForm, setShowDeptForm] = useState(false)
  const [form, setForm] = useState({ name: '', departmentId: '' })
  const [deptForm, setDeptForm] = useState({ name: '' })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const loadData = async () => {
      try {
        const [docRes, deptRes] = await Promise.all([
          fetch('/api/doctors', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/departments', { headers: { Authorization: `Bearer ${token}` } })
        ])
        const [docData, deptData] = await Promise.all([
          docRes.json(),
          deptRes.json()
        ])
        setDoctors(docData)
        setDepartments(deptData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  async function handleAddDoctor() {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(form)
      })
      const newDoc = await res.json()
      setDoctors(prev => [newDoc, ...prev])
      setForm({ name: '', departmentId: '' })
      setShowForm(false)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAddDept() {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/departments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(deptForm)
      })
      const newDept = await res.json()
      setDepartments(prev => [...prev, newDept])
      setDeptForm({ name: '' })
      setShowDeptForm(false)
    } catch (err) {
      console.error(err)
    }
  }

  async function toggleAvailable(doctor) {
    const token = localStorage.getItem('token')
    try {
      const res = await fetch('/api/doctors', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id: doctor.id, available: !doctor.available })
      })
      const updated = await res.json()
      setDoctors(prev => prev.map(d => d.id === updated.id ? updated : d))
    } catch (err) {
      console.error(err)
    }
  }

  async function handleDelete(id) {
    const token = localStorage.getItem('token')
    const confirmed = window.confirm('Are you sure you want to delete this doctor?')
    if (!confirmed) return
    try {
      await fetch('/api/doctors', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      })
      setDoctors(prev => prev.filter(d => d.id !== id))
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">👨‍⚕️ Doctors</h1>
        <Link href="/dashboard" className="text-sm underline text-white">← Dashboard</Link>
      </nav>

      <div className="p-6">

        {/* Action Buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            ➕ Add Doctor
          </button>
          <button
            onClick={() => setShowDeptForm(!showDeptForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            🏨 Add Department
          </button>
        </div>

        {/* Add Doctor Form */}
        {showForm && (
          <div className="bg-white rounded-xl p-6 shadow mb-6">
            <h2 className="font-bold text-lg mb-4 text-gray-800">Add New Doctor</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Dr. Ahmed Ali"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={form.departmentId}
                  onChange={e => setForm({ ...form, departmentId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id} className="text-gray-900">{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddDoctor}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700"
              >
                ✅ Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Add Department Form */}
        {showDeptForm && (
          <div className="bg-white rounded-xl p-6 shadow mb-6">
            <h2 className="font-bold text-lg mb-4 text-gray-800">Add New Department</h2>
            <div className="flex gap-4">
              <input
                value={deptForm.name}
                onChange={e => setDeptForm({ name: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. General, Pediatrics, Gynecology..."
              />
              <button
                onClick={handleAddDept}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                ✅ Save
              </button>
              <button
                onClick={() => setShowDeptForm(false)}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Doctors Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No doctors found</div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-700">#</th>
                  <th className="px-4 py-3 text-left text-gray-700">Name</th>
                  <th className="px-4 py-3 text-left text-gray-700">Department</th>
                  <th className="px-4 py-3 text-left text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc, i) => (
                  <tr key={doc.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-800">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">Dr. {doc.name}</td>
                    <td className="px-4 py-3 text-gray-800">{doc.department?.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        doc.available
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {doc.available ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleAvailable(doc)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
                        >
                          🔄 Toggle
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          🗑️ Delete
                        </button>
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