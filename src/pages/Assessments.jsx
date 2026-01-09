import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { FileText, Clock, CheckCircle, Circle, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function Assessments() {
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, completed

  useEffect(() => {
    fetchAssessments()
  }, [])

  const fetchAssessments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch assessments from enrolled courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)

      const courseIds = enrollments?.map((e) => e.course_id) || []

      if (courseIds.length === 0) {
        setAssessments([])
        setLoading(false)
        return
      }

      const { data: assessmentsData } = await supabase
        .from('assessments')
        .select('*, courses(*)')
        .in('course_id', courseIds)
        .order('due_date', { ascending: true })

      // Fetch submissions to check status
      const { data: submissions } = await supabase
        .from('submissions')
        .select('assessment_id, grade, submitted_at')
        .eq('student_id', user.id)

      const submissionsMap = new Map(
        submissions?.map((s) => [s.assessment_id, s]) || []
      )

      const assessmentsWithStatus = assessmentsData.map((assessment) => {
        const submission = submissionsMap.get(assessment.id)
        const now = new Date()
        const dueDate = new Date(assessment.due_date)
        const isOverdue = dueDate < now && !submission
        const isCompleted = !!submission

        return {
          ...assessment,
          submission,
          isOverdue,
          isCompleted,
          status: isCompleted ? 'completed' : isOverdue ? 'overdue' : 'pending',
        }
      })

      setAssessments(assessmentsWithStatus)
    } catch (error) {
      console.error('Error fetching assessments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredAssessments =
    filter === 'all'
      ? assessments
      : assessments.filter((a) => a.status === filter)

  if (loading) {
    return <div className="animate-pulse">Loading assessments...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assessments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and complete your assignments and quizzes
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-orange-50/80 via-amber-50/80 to-yellow-50/80 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl shadow-lg p-4 border-2 border-orange-200/50 dark:border-orange-700">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-gradient-to-r from-warning-500 to-accent-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'completed'
                ? 'bg-gradient-to-r from-success-500 to-success-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Assessments List */}
      <div className="space-y-4">
        {filteredAssessments.length > 0 ? (
          filteredAssessments.map((assessment, index) => (
            <div
              key={assessment.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="bg-gradient-to-br from-white to-orange-50/50 dark:from-gray-800 dark:to-orange-900/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-orange-100 dark:border-orange-900 hover:scale-[1.01] slide-up"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <FileText className="w-5 h-5 text-primary-600" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {assessment.title}
                    </h3>
                    {assessment.isCompleted && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full flex items-center">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Completed
                      </span>
                    )}
                    {assessment.isOverdue && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs rounded-full">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {assessment.description}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Due: {format(new Date(assessment.due_date), 'MMM dd, yyyy')}
                    </div>
                    {assessment.time_limit && (
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {assessment.time_limit} minutes
                      </div>
                    )}
                    <div>
                      Type: {assessment.type === 'quiz' ? 'Quiz' : 'Assignment'}
                    </div>
                    {assessment.submission && (
                      <div>
                        Grade: {assessment.submission.grade !== null
                          ? `${assessment.submission.grade}%`
                          : 'Pending'}
                      </div>
                    )}
                  </div>
                </div>
                <div className="ml-4">
                  <Link
                    to={`/assessments/${assessment.id}`}
                    className="px-6 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
                  >
                    {assessment.isCompleted ? 'View' : 'Start'}
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-white/90 via-orange-50/50 to-amber-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 rounded-xl shadow-lg border-2 border-orange-200/50 dark:border-orange-700">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all'
                ? 'No assessments available'
                : `No ${filter} assessments`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

