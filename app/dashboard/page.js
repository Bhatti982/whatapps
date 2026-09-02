'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const router = useRouter()

  const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null
  const user = userData ? JSON.parse(userData) : null

  const [stats, setStats] = useState({
    total: 0, today: 0, pending: 0, completed: 0
  })

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) {
      router.push('/login')
      return
    }

    const loadStats = async () => {
      try {
        const res = await fetch('/api/appointments/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setStats(data)
      } catch (err) {
        console.error(err)
      }
    }

    loadStats()
  }, [router])

  function handleLogout() {
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">

      {/* Navbar */}
      <nav className="bg-green-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🏥 Hospital Admin</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">👤 {user?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-white text-green-600 px-3 py-1 rounded-lg text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="p-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard title="Total Appointments" value={stats.total} color="blue" icon="📋" />
          <StatCard title="Today" value={stats.today} color="green" icon="📅" />
          <StatCard title="Pending" value={stats.pending} color="yellow" icon="⏳" />
          <StatCard title="Completed" value={stats.completed} color="purple" icon="✅" />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickLink href="/dashboard/appointments" icon="📋" title="Appointments" desc="View, edit, and cancel appointments" />
          <QuickLink href="/dashboard/doctors" icon="👨‍⚕️" title="Doctors" desc="Manage doctors and schedules" />
          <QuickLink href="/dashboard/reports" icon="📊" title="Reports" desc="Daily and weekly reports" />
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, color, icon }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
  }

  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm mt-1">{title}</div>
    </div>
  )
}

function QuickLink({ href, icon, title, desc }) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-xl p-6 shadow hover:shadow-md transition cursor-pointer border border-gray-100">
        <div className="text-3xl mb-3">{icon}</div>
        <h3 className="font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 text-sm mt-1">{desc}</p>
      </div>
    </Link>
  )
}