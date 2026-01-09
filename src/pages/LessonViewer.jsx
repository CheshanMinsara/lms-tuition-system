import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import ReactPlayer from 'react-player'
import { Document, Page, pdfjs } from 'react-pdf'
import ReactMarkdown from 'react-markdown'
import '../styles/pdf-viewer.css'

// Set up PDF.js worker - using CDN for better compatibility
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
}
import { CheckCircle, ChevronLeft, ChevronRight, Download, Bookmark } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function LessonViewer() {
  const { lessonId } = useParams()
  const [lesson, setLesson] = useState(null)
  const [course, setCourse] = useState(null)
  const [completed, setCompleted] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfNumPages, setPdfNumPages] = useState(null)
  const [pdfPage, setPdfPage] = useState(1)
  const navigate = useNavigate()

  useEffect(() => {
    fetchLesson()
  }, [lessonId])

  const fetchLesson = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Fetch lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select('*, courses(*)')
        .eq('id', lessonId)
        .single()

      if (lessonError) throw lessonError

      setLesson(lessonData)
      setCourse(lessonData.courses)

      // Get file URL if it's a file type
      if (lessonData.content_type === 'pdf' && lessonData.content_url) {
        const { data } = await supabase.storage
          .from('lesson-files')
          .createSignedUrl(lessonData.content_url, 3600)
        if (data) setPdfUrl(data.signedUrl)
      }

      if (user) {
        // Check completion
        const { data: progress } = await supabase
          .from('progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .single()

        if (progress?.completed) {
          setCompleted(true)
        }

        // Check bookmark
        const { data: bookmark } = await supabase
          .from('bookmarks')
          .select('*')
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)
          .single()

        setBookmarked(!!bookmark)
      }
    } catch (error) {
      console.error('Error fetching lesson:', error)
      toast.error('Failed to load lesson')
    } finally {
      setLoading(false)
    }
  }

  const markAsComplete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase.from('progress').upsert([
        {
          user_id: user.id,
          lesson_id: lessonId,
          course_id: lesson.course_id,
          completed: true,
          completed_at: new Date().toISOString(),
        },
      ])

      if (error) throw error
      setCompleted(true)
      toast.success('Lesson marked as complete!')
    } catch (error) {
      console.error('Error marking complete:', error)
      toast.error('Failed to mark lesson as complete')
    }
  }

  const toggleBookmark = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (bookmarked) {
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('lesson_id', lessonId)

        if (error) throw error
        setBookmarked(false)
        toast.success('Bookmark removed')
      } else {
        const { error } = await supabase.from('bookmarks').insert([
          {
            user_id: user.id,
            lesson_id: lessonId,
          },
        ])

        if (error) throw error
        setBookmarked(true)
        toast.success('Bookmarked!')
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
      toast.error('Failed to update bookmark')
    }
  }

  const renderContent = () => {
    if (!lesson) return null

    switch (lesson.content_type) {
      case 'video':
        if (lesson.content_url?.includes('youtube.com') || lesson.content_url?.includes('youtu.be')) {
          return (
            <div className="w-full aspect-video">
              <ReactPlayer
                url={lesson.content_url}
                width="100%"
                height="100%"
                controls
                onEnded={markAsComplete}
              />
            </div>
          )
        } else {
          // Direct video upload
          return (
            <div className="w-full aspect-video">
              <video
                src={lesson.content_url}
                controls
                className="w-full h-full"
                onEnded={markAsComplete}
              />
            </div>
          )
        }

      case 'pdf':
        return (
          <div className="w-full">
            {pdfUrl ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => setPdfPage((p) => Math.max(1, p - 1))}
                      disabled={pdfPage === 1}
                      className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-sm">
                      Page {pdfPage} of {pdfNumPages}
                    </span>
                    <button
                      onClick={() => setPdfPage((p) => Math.min(pdfNumPages, p + 1))}
                      disabled={pdfPage === pdfNumPages}
                      className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                  <a
                    href={pdfUrl}
                    download
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </a>
                </div>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                  <Document
                    file={pdfUrl}
                    onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                    loading={<div className="p-8 text-center">Loading PDF...</div>}
                    error={<div className="p-8 text-center text-red-600">Failed to load PDF</div>}
                  >
                    <Page
                      pageNumber={pdfPage}
                      width={typeof window !== 'undefined' ? (window.innerWidth > 768 ? 800 : window.innerWidth - 64) : 800}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                  </Document>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">Loading PDF...</div>
            )}
          </div>
        )

      case 'image':
        return (
          <div className="w-full">
            <img
              src={lesson.content_url}
              alt={lesson.title}
              className="w-full rounded-lg"
            />
          </div>
        )

      case 'text':
      case 'markdown':
        return (
          <div className="prose dark:prose-invert max-w-none">
            <ReactMarkdown>{lesson.content_text || ''}</ReactMarkdown>
          </div>
        )

      default:
        return (
          <div className="text-center py-12 text-gray-600 dark:text-gray-400">
            Content type not supported
          </div>
        )
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading lesson...</div>
  }

  if (!lesson) {
    return <div>Lesson not found</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Link
              to={`/courses/${lesson.course_id}`}
              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm mb-2 inline-block"
            >
              ← Back to Course
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {lesson.title}
            </h1>
            {lesson.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {lesson.description}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={toggleBookmark}
              className={`p-2 rounded-lg ${
                bookmarked
                  ? 'bg-primary-100 text-primary-600 dark:bg-primary-900'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <Bookmark className={`w-5 h-5 ${bookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            {completed && (
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Completed</span>
              </div>
            )}
          </div>
          {!completed && (
            <button
              onClick={markAsComplete}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Mark as Complete</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        {renderContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Previous</span>
        </button>
        <button
          onClick={() => navigate(1)}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <span>Next</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

