import { NavLink } from 'react-router-dom'
import { LayoutDashboard, PlusCircle, ClipboardList, CheckSquare, Truck, Boxes, BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const staffNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-request', icon: PlusCircle, label: 'Buat Request' },
  { to: '/my-requests', icon: ClipboardList, label: 'Request Saya' },
  { to: '/reports', icon: BarChart3, label: 'Laporan' },
]

const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-request', icon: PlusCircle, label: 'Buat Request' },
  { to: '/approval', icon: CheckSquare, label: 'Approval' },
  { to: '/distribution', icon: Truck, label: 'Distribusi' },
  { to: '/stock', icon: Boxes, label: 'Stok' },
  { to: '/reports', icon: BarChart3, label: 'Laporan' },
]

const picOpsNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/new-request', icon: PlusCircle, label: 'Buat Request' },
  { to: '/distribution', icon: Truck, label: 'Distribusi' },
  { to: '/reports', icon: BarChart3, label: 'Laporan' },
]

const roleLabels = { admin: '⚙ Admin', pic_ops: '🚚 PIC Ops', staff: 'Staff' }

export default function Sidebar() {
  const { user } = useAuth()
  const navItems = user?.role === 'admin' ? adminNav : user?.role === 'pic_ops' ? picOpsNav : staffNav

  return (
    <aside className="w-60 bg-slate-900 flex flex-col shrink-0">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
          <Boxes size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">Inventory</p>
          <p className="text-slate-400 text-xs">CJDIY Apps</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-700">
        <p className="text-slate-500 text-xs px-3 capitalize">{roleLabels[user?.role] || 'Staff'}</p>
      </div>
    </aside>
  )
}
