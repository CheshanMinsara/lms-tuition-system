// Demo Data Templates for LMS
// This file contains sample data that can be inserted into the database

import { supabase } from './supabase'

export const demoCourses = [
  {
    title: 'Introduction to Mathematics',
    description: 'Learn the fundamentals of mathematics including algebra, geometry, and basic calculus. Perfect for beginners.',
    subject: 'Mathematics',
    duration: '12 weeks',
    thumbnail_url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
  },
  {
    title: 'Advanced Physics',
    description: 'Dive deep into mechanics, thermodynamics, electromagnetism, and quantum physics concepts.',
    subject: 'Physics',
    duration: '16 weeks',
    thumbnail_url: 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800',
  },
  {
    title: 'English Literature',
    description: 'Explore classic and contemporary literature, poetry, and literary analysis techniques.',
    subject: 'English',
    duration: '10 weeks',
    thumbnail_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
  },
  {
    title: 'Computer Science Fundamentals',
    description: 'Master programming basics, data structures, algorithms, and software development principles.',
    subject: 'Computer Science',
    duration: '14 weeks',
    thumbnail_url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800',
  },
  {
    title: 'Chemistry Basics',
    description: 'Understand atomic structure, chemical reactions, organic chemistry, and laboratory techniques.',
    subject: 'Chemistry',
    duration: '12 weeks',
    thumbnail_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800',
  },
  {
    title: 'World History',
    description: 'Journey through major historical events, civilizations, and their impact on modern society.',
    subject: 'History',
    duration: '15 weeks',
    thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
  },
]

export const demoLessons = (courseId) => [
  {
    course_id: courseId,
    title: 'Getting Started',
    description: 'Introduction and course overview',
    content_type: 'video',
    content_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    order_index: 1,
    duration: '15 min',
  },
  {
    course_id: courseId,
    title: 'Fundamental Concepts',
    description: 'Learn the core concepts and principles',
    content_type: 'text',
    content_text: '# Fundamental Concepts\n\nThis lesson covers the basic concepts you need to understand...',
    order_index: 2,
    duration: '20 min',
  },
  {
    course_id: courseId,
    title: 'Practice Exercises',
    description: 'Hands-on practice with examples',
    content_type: 'pdf',
    content_url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    order_index: 3,
    duration: '30 min',
  },
]

export const demoAssessments = (courseId) => [
  {
    course_id: courseId,
    title: 'Quiz 1: Basics',
    description: 'Test your understanding of fundamental concepts',
    type: 'quiz',
    instructions: 'Answer all questions carefully. You have 30 minutes.',
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    time_limit: 30,
    max_attempts: 3,
  },
  {
    course_id: courseId,
    title: 'Assignment 1: Problem Solving',
    description: 'Complete the following problems and submit your solutions',
    type: 'assignment',
    instructions: 'Solve all problems showing your work. Submit as PDF.',
    due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
    time_limit: null,
    max_attempts: 1,
  },
]

export const demoQuestions = (assessmentId) => [
  {
    assessment_id: assessmentId,
    question_text: 'What is the fundamental concept we discussed?',
    type: 'multiple_choice',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correct_answer: 'Option A',
    points: 10,
    order_index: 1,
  },
  {
    assessment_id: assessmentId,
    question_text: 'True or False: This statement is correct.',
    type: 'true_false',
    options: ['True', 'False'],
    correct_answer: 'True',
    points: 5,
    order_index: 2,
  },
  {
    assessment_id: assessmentId,
    question_text: 'Explain in your own words...',
    type: 'essay',
    correct_answer: null,
    points: 20,
    order_index: 3,
  },
]

export const demoEvents = (userId) => [
  {
    user_id: userId,
    title: 'Weekly Class Session',
    description: 'Regular weekly class meeting',
    type: 'class',
    start_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
  },
  {
    user_id: userId,
    title: 'Assignment Due',
    description: 'Submit your assignment before the deadline',
    type: 'assignment',
    start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    user_id: userId,
    title: 'Midterm Exam',
    description: 'Important exam covering first half of course',
    type: 'exam',
    start_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  },
]

export const demoAnnouncements = () => [
  {
    title: 'Welcome to the Course!',
    content: 'Welcome to our learning platform. We are excited to have you here. Please review the course materials and complete the first assignment.',
    created_by: null,
  },
  {
    title: 'New Lesson Available',
    content: 'A new lesson has been added to the course. Make sure to check it out and complete the associated exercises.',
    created_by: null,
  },
  {
    title: 'Office Hours Update',
    content: 'Office hours have been updated. Check the calendar for the new schedule. Feel free to reach out with any questions.',
    created_by: null,
  },
]

// Function to populate demo data
export const populateDemoData = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const results = {
      courses: [],
      lessons: [],
      assessments: [],
      questions: [],
      events: [],
      announcements: [],
      errors: [],
    }

    console.log('Starting demo data population for user:', userId)

    // Check if courses already exist
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('title')
      .eq('instructor_id', userId)

    const existingTitles = new Set(existingCourses?.map(c => c.title) || [])

    // Create courses
    for (const course of demoCourses) {
      // Skip if course already exists
      if (existingTitles.has(course.title)) {
        console.log(`Course "${course.title}" already exists, skipping...`)
        continue
      }

      const { data, error } = await supabase
        .from('courses')
        .insert([{ ...course, instructor_id: userId }])
        .select()
        .single()

      if (error) {
        console.error(`Error creating course "${course.title}":`, error)
        results.errors.push({ type: 'course', title: course.title, error: error.message })
        continue
      }

      console.log(`Created course: ${data.title} (${data.id})`)
      results.courses.push(data)

      // Create lessons for this course
      const lessons = demoLessons(data.id)
      for (const lesson of lessons) {
        const { data: lessonData, error: lessonError } = await supabase
          .from('lessons')
          .insert([lesson])
          .select()
          .single()

        if (lessonError) {
          console.error(`Error creating lesson "${lesson.title}":`, lessonError)
          results.errors.push({ type: 'lesson', title: lesson.title, error: lessonError.message })
        } else {
          results.lessons.push(lessonData)
        }
      }

      // Create assessments for this course
      const assessments = demoAssessments(data.id)
      for (const assessment of assessments) {
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .insert([assessment])
          .select()
          .single()

        if (assessmentError) {
          console.error(`Error creating assessment "${assessment.title}":`, assessmentError)
          results.errors.push({ type: 'assessment', title: assessment.title, error: assessmentError.message })
        } else {
          results.assessments.push(assessmentData)

          // Create questions for quiz assessments
          if (assessment.type === 'quiz') {
            const questions = demoQuestions(assessmentData.id)
            for (const question of questions) {
              const { data: questionData, error: questionError } = await supabase
                .from('questions')
                .insert([question])
                .select()
                .single()

              if (questionError) {
                console.error(`Error creating question:`, questionError)
                results.errors.push({ type: 'question', error: questionError.message })
              } else {
                results.questions.push(questionData)
              }
            }
          }
        }
      }
    }

    console.log(`Created ${results.courses.length} courses, ${results.lessons.length} lessons, ${results.assessments.length} assessments`)

    // Create events
    const events = demoEvents(userId)
    for (const event of events) {
      const { data, error } = await supabase
        .from('calendar_events')
        .insert([event])
        .select()
        .single()

      if (error) {
        console.error(`Error creating event "${event.title}":`, error)
        results.errors.push({ type: 'event', title: event.title, error: error.message })
      } else {
        results.events.push(data)
      }
    }

    // Create announcements
    const announcements = demoAnnouncements()
    for (const announcement of announcements) {
      const { data, error } = await supabase
        .from('announcements')
        .insert([announcement])
        .select()
        .single()

      if (error) {
        console.error(`Error creating announcement "${announcement.title}":`, error)
        results.errors.push({ type: 'announcement', title: announcement.title, error: error.message })
      } else {
        results.announcements.push(data)
      }
    }

    if (results.errors.length > 0) {
      console.warn('Some items failed to create:', results.errors)
    }

    return results
  } catch (error) {
    console.error('Error populating demo data:', error)
    throw error
  }
}

