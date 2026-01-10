import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { TrendingUp, BookOpen, Award, Clock, BarChart3, CheckCircle } from 'lucide-react'

export default function Progress({ user }) {
  const [stats, setStats] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalLessons: 0,
    completedLessons: 0,
    averageGrade: 0,
    totalTimeSpent: 0,
  })
  const [courseProgress, setCourseProgress] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgressData()
  }, [user])

  const fetchProgressData = async () => {
    try {
      // Fetch enrollments and progress
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', user.id)

      // Fetch all progress records
      const { data: progressRecords } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true)

      // Fetch submissions for grades
      const { data: submissions } = await supabase
        .from('submissions')
        .select('grade')
        .eq('student_id', user.id)
        .not('grade', 'is', null)

      // Calculate stats
      const completedCourses = enrollments?.filter((e) => e.progress >= 100).length || 0
      const completedLessons = progressRecords?.length || 0
      const averageGrade =
        submissions && submissions.length > 0
          ? submissions.reduce((sum, s) => sum + (s.grade || 0), 0) / submissions.length
          : 0

      setStats({
        totalCourses: enrollments?.length || 0,
        completedCourses,
        totalLessons: progressRecords?.length || 0,
        completedLessons,
        averageGrade: Math.round(averageGrade),
        totalTimeSpent: 0, // Would need time tracking
      })

      // Course progress
      const coursesWithProgress = enrollments?.map((enrollment) => ({
        ...enrollment.courses,
        progress: enrollment.progress || 0,
      })) || []
      setCourseProgress(coursesWithProgress)

      // Recent activity (completed lessons)
      const recent = progressRecords
        ?.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
        .slice(0, 10) || []
      setRecentActivity(recent)
    } catch (error) {
      console.error('Error fetching progress data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Progress 📊</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Track your learning journey</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Courses</p>
              <p className="text-4xl font-bold mt-2">
                {stats.totalCourses}
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg transform-gpu transition-transform group-hover:bounce-in">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-success-500 to-success-700 rounded-xl shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-success-100 text-sm font-medium">Completed</p>
              <p className="text-4xl font-bold mt-2">
                {stats.completedCourses}
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg transform-gpu transition-transform group-hover:bounce-in">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-secondary-500 to-secondary-700 rounded-xl shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-secondary-100 text-sm font-medium">Average Grade</p>
              <p className="text-4xl font-bold mt-2">
                {stats.averageGrade}%
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg transform-gpu transition-transform group-hover:bounce-in">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-accent-500 to-accent-700 rounded-xl shadow-lg p-6 text-white card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-accent-100 text-sm font-medium">Lessons Completed</p>
              <p className="text-4xl font-bold mt-2">
                {stats.completedLessons}
              </p>
            </div>
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg transform-gpu transition-transform group-hover:bounce-in">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Course Progress
          </h2>
          <div className="space-y-4">
            {courseProgress.length > 0 ? (
              courseProgress.map((course) => (
                <Link
                  key={course.id}
                  to={`/courses/${course.id}`}
                  className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {course.title}
                    </h3>
                    <span className="text-sm font-medium text-primary-600">
                      {Math.round(course.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${course.progress}%` }}
                    ></div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No courses enrolled yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Activity
          </h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div
                  key={activity.id || index}
                  className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Completed lesson
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.completed_at
                        ? new Date(activity.completed_at).toLocaleDateString()
                        : ''}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
