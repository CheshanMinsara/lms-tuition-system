import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BookOpen, Clock, Users, CheckCircle, Circle, FileText, Video, Image, Download } from 'lucide-react'

export default function CourseDetail() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [progress, setProgress] = useState(0)
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCourseData()
  }, [courseId])

  const fetchCourseData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })

      if (lessonsError) throw lessonsError

      // Check enrollment
      if (user) {
        const { data: enrollment } = await supabase
          .from('enrollments')
          .select('*')
          .eq('student_id', user.id)
          .eq('course_id', courseId)
          .single()

        if (enrollment) {
          setEnrolled(true)
          setProgress(enrollment.progress || 0)
        }

        // Fetch completed lessons
        const { data: completed } = await supabase
          .from('progress')
          .select('lesson_id')
          .eq('user_id', user.id)
          .eq('completed', true)

        const completedIds = new Set(completed?.map((p) => p.lesson_id) || [])
        const lessonsWithStatus = lessonsData.map((lesson) => ({
          ...lesson,
          completed: completedIds.has(lesson.id),
        }))
        setLessons(lessonsWithStatus)
      } else {
        setLessons(lessonsData)
      }

      setCourse(courseData)
    } catch (error) {
      console.error('Error fetching course:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('enrollments').insert([
        {
          student_id: user.id,
          course_id: courseId,
          progress: 0,
        },
      ])

      if (error) throw error
      setEnrolled(true)
    } catch (error) {
      console.error('Error enrolling:', error)
    }
  }

  const getLessonIcon = (lessonType) => {
    switch (lessonType) {
      case 'video':
        return Video
      case 'pdf':
      case 'document':
        return FileText
      case 'image':
        return Image
      default:
        return BookOpen
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading course...</div>
  }

  if (!course) {
    return <div>Course not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        {course.thumbnail_url && (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-64 object-cover rounded-lg mb-6"
          />
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {course.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {course.description}
            </p>
            <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {course.duration || 'N/A'}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {course.student_count || 0} students
              </div>
            </div>
          </div>
          {!enrolled && (
            <button
              onClick={handleEnroll}
              className="ml-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Enroll Now
            </button>
          )}
        </div>

        {enrolled && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Course Progress
              </span>
              <span className="text-sm font-medium text-primary-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-primary-600 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Lessons List */}
      {enrolled && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Course Lessons
          </h2>
          <div className="space-y-3">
            {lessons.length > 0 ? (
              lessons.map((lesson, index) => {
                const Icon = getLessonIcon(lesson.content_type)
                return (
                  <Link
                    key={lesson.id}
                    to={`/lessons/${lesson.id}`}
                    className="flex items-center space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <div className="flex-shrink-0">
                      {lesson.completed ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          Lesson {index + 1}: {lesson.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lesson.description}
                      </p>
                    </div>
                    {lesson.duration && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {lesson.duration}
                      </div>
                    )}
                  </Link>
                )
              })
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No lessons available yet
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

