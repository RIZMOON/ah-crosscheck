import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Settings, FileCheck } from 'lucide-react'

const navLinks = [
  { path: '/', label: '首页' },
  { path: '/dashboard', label: '审计工作台' },
  { path: '/report', label: '报告中心' },
  { path: '/settings', label: '模型配置' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <header className="sticky top-0 z-50 bg-deloitte-charcoal border-b border-deloitte-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-deloitte-green rounded-sm flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm tracking-wide">CrossCheck</span>
              <span className="text-deloitte-gray-400 text-[10px]">A/H股财报审计</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors duration-150 ${
                    isActive
                      ? 'text-deloitte-green bg-deloitte-gray-700/50'
                      : 'text-deloitte-gray-300 hover:text-white hover:bg-deloitte-gray-700/30'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 bg-deloitte-green text-white text-sm font-medium rounded-sm hover:bg-[#6fa01e] transition-colors"
            >
              开始审计
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-deloitte-charcoal border-t border-deloitte-gray-700">
          <nav className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-2.5 text-sm text-deloitte-gray-300 hover:text-white hover:bg-deloitte-gray-700/30 rounded-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
