import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Calendar,
  MessageSquare,
  User,
  BarChart3,
  Award,
  Bell,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  Search,
  GraduationCap,
} from 'lucide-react'

export default function Layout({ children, user }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') !== null
      ? localStorage.getItem('darkMode') === 'true'
      : true // Default to dark mode
  )
  const [notifications, setNotifications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Initialize dark mode on mount
  useEffect(() => {
    // Ensure dark mode is applied on initial load if no preference is saved
    if (!localStorage.getItem('darkMode')) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  useEffect(() => {
    // Fetch notifications
    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev])
          toast.success(payload.new.message)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user.id])

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10)

    if (data) setNotifications(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/courses', icon: BookOpen, label: 'Courses' },
    { path: '/assessments', icon: FileText, label: 'Assessments' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/messages', icon: MessageSquare, label: 'Messages' },
    { path: '/announcements', icon: Bell, label: 'Announcements' },
    { path: '/progress', icon: BarChart3, label: 'Progress' },
    { path: '/certificates', icon: Award, label: 'Certificates' },
    { path: '/profile', icon: User, label: 'Profile' },
  ]

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/courses?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-110 active:scale-95 text-gray-600 dark:text-white"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-tr from-primary-600 to-secondary-500 rounded-lg text-white shadow-lg">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400">
              Nexus
            </h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-110 active:scale-95 text-gray-600 dark:text-white"
            >
              {darkMode ? <Sun className="w-5 h-5 transition-transform hover:rotate-180" /> : <Moon className="w-5 h-5 transition-transform hover:rotate-12" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg lg:shadow-none transition-transform duration-300 ease-in-out border-r border-gray-200 dark:border-gray-700`}
        >
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 hidden lg:block">
              <div className="flex items-center gap-3 mb-1">
                <div className="p-2 bg-gradient-to-tr from-primary-600 to-secondary-500 rounded-xl text-white shadow-lg transform transition-transform hover:scale-105 duration-300">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-400 dark:to-secondary-400 tracking-tight">
                    Nexus
                  </h1>
                </div>
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1 font-mono">
                Tuition System
              </p>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item, index) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                        ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-md scale-105'
                        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 hover:scale-105'
                      }`}
                  >
                    <Icon className="w-5 h-5 transition-transform group-hover:scale-110" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {/* Top Header */}
          <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20 hidden lg:block border-b border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 flex items-center justify-between">
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-500 w-5 h-5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search courses, lessons..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:text-white shadow-sm transition-all"
                  />
                </div>
              </form>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all hover:scale-110 active:scale-95 text-gray-600 dark:text-white"
                >
                  {darkMode ? <Sun className="w-5 h-5 transition-transform hover:rotate-180" /> : <Moon className="w-5 h-5 transition-transform hover:rotate-12" />}
                </button>

                <div className="relative">
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 relative text-gray-600 dark:text-white">
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>
                </div>

                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                </Link>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  )
}
