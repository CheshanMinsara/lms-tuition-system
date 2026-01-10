import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BookOpen, Clock, Award, TrendingUp, Calendar, Bell } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard({ user }) {
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedCourses: 0,
    totalProgress: 0,
    upcomingDeadlines: 0,
  })
  const [recentCourses, setRecentCourses] = useState([])
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState('')

  // Initialize userName from user metadata immediately (before async fetch)
  useEffect(() => {
    if (user) {
      if (user.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name)
      } else if (user.email) {
        const emailName = user.email.split('@')[0]
        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1))
      } else {
        setUserName('Student')
      }
    }
  }, [user])

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      // Fetch user profile for name (update if different from initial)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      // Update userName if profile has a full_name (prioritize profile over metadata)
      if (profile?.full_name) {
        setUserName(profile.full_name)
      }

      // Fetch enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', user.id)

      // Fetch progress
      const { data: progressData } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)

      // Fetch upcoming events
      const { data: events } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start_date', new Date().toISOString())
        .order('start_date', { ascending: true })
        .limit(5)

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      if (enrollments) {
        setRecentCourses(enrollments.slice(0, 4))
        setStats({
          enrolledCourses: enrollments.length,
          completedCourses: enrollments.filter((e) => e.progress >= 100).length,
          totalProgress:
            enrollments.reduce((acc, e) => acc + (e.progress || 0), 0) /
            enrollments.length || 0,
          upcomingDeadlines: 0,
        })
      }

      if (events) setUpcomingEvents(events)
      if (announcementsData) setAnnouncements(announcementsData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white min-h-[3rem] flex items-center flex-wrap">
          <span className="typing-animation">
            Welcome, {userName ? (userName.split(' ')[0] || userName) : 'Student'}!
          </span>
          <span className="animate-wave ml-2 text-4xl">
            👋
          </span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
          Let's get started.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          className="rounded-xl shadow-lg p-6 text-white card-hover"
          style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Enrolled Courses</p>
              <p className="text-4xl font-bold mt-2">
                {stats.enrolledCourses}
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl shadow-lg p-6 text-white card-hover"
          style={{ background: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed</p>
              <p className="text-4xl font-bold mt-2">
                {stats.completedCourses}
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl shadow-lg p-6 text-white card-hover"
          style={{ background: 'linear-gradient(135deg, #d946ef 0%, #a21caf 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Overall Progress</p>
              <p className="text-4xl font-bold mt-2">
                {Math.round(stats.totalProgress)}%
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl shadow-lg p-6 text-white card-hover"
          style={{ background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Upcoming Events</p>
              <p className="text-4xl font-bold mt-2">
                {upcomingEvents.length}
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Courses */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-primary-200/50 dark:border-primary-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              My Courses
            </h2>
            <Link
              to="/courses"
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentCourses.length > 0 ? (
              recentCourses.map((enrollment, idx) => (
                <Link
                  key={enrollment.id}
                  to={`/courses/${enrollment.courses.id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-[1.02] hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {enrollment.courses.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {enrollment.courses.description?.substring(0, 60)}...
                      </p>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {enrollment.progress || 0}% complete
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400">
                  No courses enrolled yet
                </p>
                <Link
                  to="/courses"
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 mt-2 inline-block"
                >
                  Browse courses
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events & Announcements */}
        <div className="space-y-6">
          {/* Upcoming Events */}
          <div className="bg-gradient-to-br from-white/90 via-green-50/30 to-emerald-50/30 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-success-200/50 dark:border-success-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Upcoming
              </h2>
              <Link
                to="/calendar"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
              >
                View calendar
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, idx) => (
                  <div
                    key={event.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:scale-[1.02] hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {event.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(event.start_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No upcoming events
                </p>
              )}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-gradient-to-br from-white/90 via-orange-50/30 to-amber-50/30 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-accent-200/50 dark:border-accent-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Announcements
              </h2>
              <Link
                to="/announcements"
                className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm"
              >
                View all
              </Link>
            </div>
            <div className="space-y-3">
              {announcements.length > 0 ? (
                announcements.map((announcement, idx) => (
                  <div
                    key={announcement.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg transition-all hover:scale-[1.02] hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {announcement.title}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {announcement.content?.substring(0, 60)}...
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      {format(new Date(announcement.created_at), 'MMM dd')}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No announcements
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
