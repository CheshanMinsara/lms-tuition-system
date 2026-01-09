import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import { Clock, CheckCircle, Circle, FileText, Upload, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function AssessmentDetail() {
  const { assessmentId } = useParams()
  const navigate = useNavigate()
  const [assessment, setAssessment] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [submission, setSubmission] = useState(null)
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [started, setStarted] = useState(false)
  const [startTime, setStartTime] = useState(null)

  useEffect(() => {
    fetchAssessment()
  }, [assessmentId])

  useEffect(() => {
    if (started && assessment?.time_limit && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60)
        const remaining = assessment.time_limit - elapsed
        setTimeRemaining(Math.max(0, remaining))

        if (remaining <= 0) {
          handleSubmit(true)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [started, assessment, startTime])

  const fetchAssessment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch assessment
      const { data: assessmentData, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single()

      if (error) throw error

      // Fetch questions
      const { data: questionsData } = await supabase
        .from('questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('order_index', { ascending: true })

      // Fetch existing submission
      const { data: submissionData } = await supabase
        .from('submissions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('student_id', user.id)
        .single()

      if (submissionData) {
        setSubmission(submissionData)
        setAnswers(submissionData.answers || {})
        setStarted(true)
      }

      setAssessment(assessmentData)
      setQuestions(questionsData || [])
    } catch (error) {
      console.error('Error fetching assessment:', error)
      toast.error('Failed to load assessment')
    } finally {
      setLoading(false)
    }
  }

  const startAssessment = () => {
    setStarted(true)
    setStartTime(Date.now())
    if (assessment.time_limit) {
      setTimeRemaining(assessment.time_limit)
    }
  }

  const handleAnswerChange = (questionId, value) => {
    setAnswers({
      ...answers,
      [questionId]: value,
    })
  }

  const handleFileChange = (e) => {
    setFile(e.target.files[0])
  }

  const handleSubmit = async (autoSubmit = false) => {
    if (submission && !autoSubmit) {
      toast.error('Assessment already submitted')
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let fileUrl = null
      if (file && assessment.type === 'assignment') {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${assessmentId}/${Date.now()}.${fileExt}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('submissions')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: urlData } = await supabase.storage
          .from('submissions')
          .createSignedUrl(fileName, 31536000) // 1 year

        fileUrl = urlData?.signedUrl
      }

      // Calculate grade for quiz
      let grade = null
      if (assessment.type === 'quiz') {
        let correct = 0
        questions.forEach((question) => {
          const answer = answers[question.id]
          if (question.correct_answer && answer === question.correct_answer) {
            correct++
          }
        })
        grade = Math.round((correct / questions.length) * 100)
      }

      const { error: submitError } = await supabase.from('submissions').insert([
        {
          student_id: user.id,
          assessment_id: assessmentId,
          answers: answers,
          file_url: fileUrl,
          grade: grade,
          submitted_at: new Date().toISOString(),
          time_taken: startTime ? Math.floor((Date.now() - startTime) / 1000 / 60) : null,
        },
      ])

      if (submitError) throw submitError

      toast.success('Assessment submitted successfully!')
      navigate('/assessments')
    } catch (error) {
      console.error('Error submitting assessment:', error)
      toast.error('Failed to submit assessment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading assessment...</div>
  }

  if (!assessment) {
    return <div>Assessment not found</div>
  }

  if (submission && assessment.type === 'quiz') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {assessment.title}
            </h1>
            <button
              onClick={() => navigate('/assessments')}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Assessment Completed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Your score: {submission.grade !== null ? `${submission.grade}%` : 'Pending'}
            </p>
            <p className="text-sm text-gray-500">
              Submitted on {format(new Date(submission.submitted_at), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>

          <div className="mt-8 space-y-6">
            {questions.map((question, index) => {
              const userAnswer = answers[question.id]
              const isCorrect = question.correct_answer && userAnswer === question.correct_answer

              return (
                <div
                  key={question.id}
                  className={`p-6 border-2 rounded-lg ${
                    isCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      Question {index + 1}: {question.question_text}
                    </h3>
                    {isCorrect ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="space-y-2">
                    {question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-lg ${
                              option === question.correct_answer
                                ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                                : option === userAnswer && !isCorrect
                                ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                                : 'bg-gray-100 dark:bg-gray-700'
                            }`}
                          >
                            {option}
                            {option === question.correct_answer && (
                              <span className="ml-2 text-green-700 dark:text-green-400 font-medium">
                                (Correct Answer)
                              </span>
                            )}
                            {option === userAnswer && (
                              <span className="ml-2 text-blue-700 dark:text-blue-400 font-medium">
                                (Your Answer)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {question.type === 'essay' && (
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Your answer:
                        </p>
                        <p className="text-gray-900 dark:text-white">{userAnswer || 'No answer'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {assessment.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{assessment.description}</p>

          <div className="space-y-4 mb-8">
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <Clock className="w-5 h-5 mr-2" />
              {assessment.time_limit
                ? `Time limit: ${assessment.time_limit} minutes`
                : 'No time limit'}
            </div>
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <FileText className="w-5 h-5 mr-2" />
              {questions.length} questions
            </div>
          </div>

          <button
            onClick={startAssessment}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition"
          >
            Start Assessment
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {assessment.title}
          </h1>
          {timeRemaining !== null && (
            <div className="flex items-center space-x-2 text-lg font-semibold">
              <Clock className="w-5 h-5" />
              <span className={timeRemaining < 5 ? 'text-red-600' : ''}>
                {Math.floor(timeRemaining)}:{(timeRemaining % 1 * 60).toFixed(0).padStart(2, '0')}
              </span>
            </div>
          )}
        </div>

        {assessment.type === 'quiz' ? (
          <div className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.id} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Question {index + 1}: {question.question_text}
                </h3>

                {question.type === 'multiple_choice' && question.options && (
                  <div className="space-y-2">
                    {question.options.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-gray-900 dark:text-white">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'true_false' && (
                  <div className="space-y-2">
                    {['True', 'False'].map((option) => (
                      <label
                        key={option}
                        className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={option}
                          checked={answers[question.id] === option}
                          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                          className="mr-3"
                        />
                        <span className="text-gray-900 dark:text-white">{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {question.type === 'essay' && (
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    rows={6}
                    placeholder="Type your answer here..."
                  />
                )}

                {question.type === 'short_answer' && (
                  <input
                    type="text"
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Type your answer here..."
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Instructions
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{assessment.instructions}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Upload File
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Upload className="w-5 h-5" />
                  <span>Choose File</span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                </label>
                {file && (
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {file.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end space-x-4">
          <button
            onClick={() => navigate('/assessments')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => handleSubmit()}
            disabled={submitting}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Assessment'}
          </button>
        </div>
      </div>
    </div>
  )
}

