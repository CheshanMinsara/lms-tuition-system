import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'

// Pages
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Courses from './pages/Courses'
import CourseDetail from './pages/CourseDetail'
import LessonViewer from './pages/LessonViewer'
import Assessments from './pages/Assessments'
import AssessmentDetail from './pages/AssessmentDetail'
import Calendar from './pages/Calendar'
import Messages from './pages/Messages'
import Profile from './pages/Profile'
import Progress from './pages/Progress'
import Certificates from './pages/Certificates'
import Announcements from './pages/Announcements'

// Layout
import Layout from './components/Layout'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for changes on auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route
          path="/*"
          element={
            user ? (
              <Layout user={user}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard user={user} />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/courses/:courseId" element={<CourseDetail />} />
                  <Route path="/lessons/:lessonId" element={<LessonViewer />} />
                  <Route path="/assessments" element={<Assessments />} />
                  <Route path="/assessments/:assessmentId" element={<AssessmentDetail />} />
                  <Route path="/calendar" element={<Calendar user={user} />} />
                  <Route path="/messages" element={<Messages user={user} />} />
                  <Route path="/profile" element={<Profile user={user} />} />
                  <Route path="/progress" element={<Progress user={user} />} />
                  <Route path="/certificates" element={<Certificates user={user} />} />
                  <Route path="/announcements" element={<Announcements />} />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  )
}

export default App

