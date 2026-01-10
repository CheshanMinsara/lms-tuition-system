import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { BookOpen, Search, Clock, Users, Star } from 'lucide-react'
import DemoDataButton from '../components/DemoDataButton'

export default function Courses() {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchCourses()
    const search = searchParams.get('search')
    if (search) {
      setSearchQuery(search)
    }
  }, [searchParams])

  // Listen for custom event to refresh courses (for demo data)
  useEffect(() => {
    const handleRefresh = () => {
      fetchCourses()
    }
    window.addEventListener('demoDataLoaded', handleRefresh)
    return () => window.removeEventListener('demoDataLoaded', handleRefresh)
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const filtered = courses.filter(
        (course) =>
          course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          course.subject?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredCourses(filtered)
    } else {
      setFilteredCourses(courses)
    }
  }, [searchQuery, courses])

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Check enrollment status
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', user.id)

        const enrolledIds = new Set(enrollments?.map((e) => e.course_id) || [])
        const coursesWithStatus = data.map((course) => ({
          ...course,
          enrolled: enrolledIds.has(course.id),
        }))
        setCourses(coursesWithStatus)
        setFilteredCourses(coursesWithStatus)
      } else {
        setCourses(data)
        setFilteredCourses(data)
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async (courseId) => {
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

      // Update local state
      setCourses(
        courses.map((course) =>
          course.id === courseId ? { ...course, enrolled: true } : course
        )
      )
      setFilteredCourses(
        filteredCourses.map((course) =>
          course.id === courseId ? { ...course, enrolled: true } : course
        )
      )
    } catch (error) {
      console.error('Error enrolling:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading courses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white">
            Course Catalog 📚
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
            Browse and enroll in courses
          </p>
        </div>
        <DemoDataButton />
      </div>

      {/* Search */}
      <div className="bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80 dark:from-gray-800/80 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm rounded-xl shadow-lg p-4 border-2 border-primary-200/50 dark:border-primary-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary-600 dark:text-primary-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by title, description, or subject..."
            className="w-full pl-10 pr-4 py-3 bg-gradient-to-r from-white to-blue-50/50 dark:from-gray-700 dark:to-gray-600 backdrop-blur-sm border-2 border-primary-300 dark:border-primary-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:from-primary-100 focus:to-purple-100 dark:focus:from-primary-800 dark:focus:to-purple-800 dark:text-white shadow-md transition-all"
          />
        </div>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <div
              key={course.id}
              style={{ animationDelay: `${index * 50}ms` }}
              className="bg-gradient-to-br from-white via-blue-50/60 to-purple-50/60 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden card-hover border-2 border-primary-200/50 dark:border-primary-700 hover:border-primary-400 dark:hover:border-primary-600 slide-up"
            >
              {course.thumbnail_url && (
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-6">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {course.title}
                  </h3>
                  {course.enrolled && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs rounded-full">
                      Enrolled
                    </span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>

                <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.duration || 'N/A'}
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {course.student_count || 0} students
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  {course.enrolled ? (
                    <Link
                      to={`/courses/${course.id}`}
                      className="flex-1 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white text-center font-semibold py-2.5 px-4 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      Continue Learning
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      className="flex-1 bg-gradient-to-r from-success-500 to-success-600 hover:from-success-600 hover:to-success-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow-md hover:shadow-lg"
                    >
                      Enroll Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 rounded-xl shadow-lg border-2 border-primary-200/50 dark:border-primary-700">
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery ? 'No courses found matching your search' : 'No courses available'}
          </p>
        </div>
      )}
    </div>
  )
}

