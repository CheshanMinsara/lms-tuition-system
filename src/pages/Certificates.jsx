import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Award, Download, Printer } from 'lucide-react'
import { format } from 'date-fns'

export default function Certificates({ user }) {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCertificates()
  }, [user])

  const fetchCertificates = async () => {
    try {
      // Fetch completed courses
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*, courses(*)')
        .eq('student_id', user.id)
        .gte('progress', 100)

      // Fetch profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      const certs = enrollments?.map((enrollment) => ({
        id: enrollment.id,
        courseTitle: enrollment.courses.title,
        courseId: enrollment.courses.id,
        completedAt: enrollment.completed_at || new Date().toISOString(),
        studentName: profile?.full_name || user.email,
      })) || []

      setCertificates(certs)
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateCertificate = (certificate) => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Certificate - ${certificate.courseTitle}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              margin: 0;
              padding: 40px;
              text-align: center;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .certificate {
              background: white;
              padding: 60px;
              border: 10px solid #d4af37;
              box-shadow: 0 0 20px rgba(0,0,0,0.3);
              max-width: 800px;
            }
            h1 {
              font-size: 48px;
              color: #333;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 4px;
            }
            .subtitle {
              font-size: 24px;
              color: #666;
              margin-bottom: 40px;
            }
            .name {
              font-size: 36px;
              color: #667eea;
              font-weight: bold;
              margin: 40px 0;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              display: inline-block;
            }
            .course {
              font-size: 28px;
              color: #333;
              margin: 30px 0;
            }
            .date {
              font-size: 18px;
              color: #666;
              margin-top: 40px;
            }
            .seal {
              margin-top: 40px;
              font-size: 14px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <h1>Certificate of Completion</h1>
            <p class="subtitle">This is to certify that</p>
            <div class="name">${certificate.studentName}</div>
            <p class="course">has successfully completed the course</p>
            <div class="name" style="font-size: 32px; border: none;">${certificate.courseTitle}</div>
            <p class="date">Date: ${format(new Date(certificate.completedAt), 'MMMM dd, yyyy')}</p>
            <div class="seal">
              <p>LMS Learning Management System</p>
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading certificates...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Certificates</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          View and download your course completion certificates
        </p>
      </div>

      {certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="bg-gradient-to-br from-white/90 via-amber-50/50 to-yellow-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden border-2 border-amber-200/50 dark:border-amber-700 hover:border-amber-300 dark:hover:border-amber-600"
            >
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-20 h-20 gradient-warm rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Award className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Certificate of Completion
                  </h3>
                  <p className="text-primary-600 font-medium">{certificate.courseTitle}</p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Student:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {certificate.studentName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Completed:</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {format(new Date(certificate.completedAt), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex space-x-2">
                  <button
                    onClick={() => generateCertificate(certificate)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print</span>
                  </button>
                  <button
                    onClick={() => generateCertificate(certificate)}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gradient-to-br from-white/90 via-amber-50/50 to-yellow-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 rounded-xl shadow-lg border-2 border-amber-200/50 dark:border-amber-700">
          <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            No certificates available yet
          </p>
          <p className="text-sm text-gray-500">
            Complete courses to earn certificates
          </p>
        </div>
      )}
    </div>
  )
}

