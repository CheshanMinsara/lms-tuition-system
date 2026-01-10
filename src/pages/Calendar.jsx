import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Calendar as CalendarIcon, Clock, BookOpen, FileText } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, startOfWeek, endOfWeek, addDays } from 'date-fns'

export default function Calendar({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedEvents, setSelectedEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [calendarKey, setCalendarKey] = useState(0)

  useEffect(() => {
    fetchEvents()
  }, [currentDate, user])

  useEffect(() => {
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
    const dayEvents = events.filter((event) => {
      if (!event.start_date) return false
      const eventDate = new Date(event.start_date)
      const eventStr = format(eventDate, 'yyyy-MM-dd')
      return eventStr === selectedDateStr
    })
    setSelectedEvents(dayEvents)
  }, [selectedDate, events])

  const fetchEvents = async () => {
    setLoading(true)
    try {
      if (!user?.id) {
        console.log('No user ID available')
        setEvents([])
        setLoading(false)
        return
      }

      // Get the date range for the calendar view (including previous/next month overflow)
      const calendarStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 })
      const calendarEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 })

      // Format dates for query (YYYY-MM-DD)
      const startDateStr = format(calendarStart, 'yyyy-MM-dd')
      const endDateStr = format(calendarEnd, 'yyyy-MM-dd')

      console.log('Fetching events for date range:', startDateStr, 'to', endDateStr, 'for user:', user.id)

      // Fetch ALL events for the user (past, present, and future)
      // We'll filter client-side to show events in the visible calendar range
      const { data: allEvents, error: allEventsError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: true })

      if (allEventsError) {
        console.error('Error fetching calendar events:', allEventsError)
        setEvents([])
        return
      }

      console.log(`Fetched ${allEvents?.length || 0} total events for user ${user.id}`)

      // Filter events that fall within the visible calendar range
      // This includes overflow days from previous/next month
      const filteredEvents = (allEvents || []).filter(event => {
        if (!event.start_date) {
          console.warn('Event missing start_date:', event)
          return false
        }

        try {
          // Parse the event date - handle ISO strings, date strings, etc.
          let eventDate = new Date(event.start_date)

          // If date parsing fails, try to parse as string
          if (isNaN(eventDate.getTime())) {
            // Try parsing as YYYY-MM-DD format
            const parts = event.start_date.split('T')[0].split('-')
            if (parts.length === 3) {
              eventDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
            } else {
              console.warn('Invalid date format for event:', event.start_date, event)
              return false
            }
          }

          // Check if date is valid after parsing
          if (isNaN(eventDate.getTime())) {
            console.warn('Invalid date for event:', event.start_date, event)
            return false
          }

          // Format to YYYY-MM-DD for comparison (ignore time)
          const eventDateStr = format(eventDate, 'yyyy-MM-dd')

          // Check if event is within the visible calendar range
          // calendarStart and calendarEnd include overflow days from adjacent months
          const isInRange = eventDateStr >= startDateStr && eventDateStr <= endDateStr

          if (!isInRange) {
            console.log(`Event "${event.title}" (${eventDateStr}) is outside visible range (${startDateStr} to ${endDateStr})`)
          }

          return isInRange
        } catch (err) {
          console.error('Error processing event date:', event, err)
          return false
        }
      })

      console.log(`Showing ${filteredEvents.length} events in calendar view (range: ${startDateStr} to ${endDateStr})`)
      console.log('Events in view:', filteredEvents.map(e => ({
        title: e.title,
        date: e.start_date,
        formatted: format(new Date(e.start_date), 'yyyy-MM-dd')
      })))

      setEvents(filteredEvents)

      // Also fetch events from assessments (assignments and exams)
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (currentUser) {
        // Get enrolled courses
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('course_id')
          .eq('student_id', currentUser.id)

        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id)

          // Get assessments from enrolled courses  
          const { data: assessments } = await supabase
            .from('assessments')
            .select('id, title, description, due_date, type, course_id')
            .in('course_id', courseIds)
            .gte('due_date', startDateStr)
            .lte('due_date', endDateStr)

          if (assessments && assessments.length > 0) {
            // Convert assessments to calendar events
            const assessmentEvents = assessments
              .filter(assessment => {
                if (!assessment.due_date) return false
                try {
                  const dueDate = new Date(assessment.due_date)
                  const dueDateStr = format(dueDate, 'yyyy-MM-dd')
                  return dueDateStr >= startDateStr && dueDateStr <= endDateStr
                } catch {
                  return false
                }
              })
              .map(assessment => ({
                id: `assessment-${assessment.id}`,
                user_id: currentUser.id,
                course_id: assessment.course_id,
                title: assessment.title,
                description: assessment.description,
                type: assessment.type === 'quiz' ? 'exam' : 'assignment',
                start_date: assessment.due_date,
                end_date: assessment.due_date,
              }))

            if (assessmentEvents.length > 0) {
              console.log(`Adding ${assessmentEvents.length} assessment events`)
              setEvents(prev => [...(prev || []), ...assessmentEvents])
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }) // Sunday = 0
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
  const daysInMonth = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'class':
        return BookOpen
      case 'assignment':
        return FileText
      default:
        return CalendarIcon
    }
  }

  const previousMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    setCalendarKey(prev => prev + 1)
    setCurrentDate(newDate)
    console.log('Navigated to previous month:', format(newDate, 'MMMM yyyy'))
  }

  const nextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    setCalendarKey(prev => prev + 1)
    setCurrentDate(newDate)
    console.log('Navigated to next month:', format(newDate, 'MMMM yyyy'))
  }

  const goToToday = () => {
    setCalendarKey(prev => prev + 1)
    setCurrentDate(new Date())
    console.log('Navigated to current month')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Calendar 📅</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">View your classes and deadlines</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-primary-200/50 dark:border-primary-700 fade-in">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-110 active:scale-95"
              title="Previous month"
            >
              ←
            </button>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white transition-all">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              <button
                onClick={goToToday}
                className="px-3 py-1 text-sm bg-primary-100 hover:bg-primary-200 dark:bg-primary-900 dark:hover:bg-primary-800 text-primary-700 dark:text-primary-300 rounded-lg transition-all hover:scale-105 active:scale-95"
                title="Go to current month"
              >
                Today
              </button>
            </div>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all hover:scale-110 active:scale-95"
              title="Next month"
            >
              →
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div
                key={day}
                className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div key={calendarKey} className="grid grid-cols-7 gap-2 fade-in">
              {daysInMonth.map((day, index) => {
                // Format day to YYYY-MM-DD for comparison
                const dayStr = format(day, 'yyyy-MM-dd')

                const dayEvents = events.filter((event) => {
                  if (!event.start_date) return false
                  const eventDate = new Date(event.start_date)
                  const eventStr = format(eventDate, 'yyyy-MM-dd')
                  return eventStr === dayStr
                })

                const isSelected = isSameDay(day, selectedDate)
                const isCurrentMonth = isSameMonth(day, currentDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day)
                      console.log('Selected date:', format(day, 'yyyy-MM-dd'), 'Events:', dayEvents)
                    }}
                    style={{ animationDelay: `${index * 10}ms` }}
                    className={`p-2 rounded-lg text-center min-h-[60px] transition-all duration-200 relative fade-in hover:scale-105 active:scale-95 ${isSelected
                      ? 'bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-lg ring-2 ring-primary-300'
                      : isToday
                        ? 'bg-blue-100 dark:bg-blue-900/30 border-2 border-primary-500 font-semibold hover:border-primary-600'
                        : isCurrentMonth
                          ? 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white hover:shadow-md'
                          : 'text-gray-400 dark:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                  >
                    <div className={`text-sm ${isSelected ? 'font-bold' : 'font-medium'}`}>
                      {format(day, 'd')}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="flex justify-center mt-1 space-x-1">
                        {dayEvents.slice(0, 3).map((event, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all hover:scale-150 ${isSelected ? 'bg-white' :
                              event.type === 'exam' ? 'bg-red-500' :
                                event.type === 'assignment' ? 'bg-orange-500' :
                                  isCurrentMonth ? 'bg-primary-600' : 'bg-gray-400'
                              }`}
                            title={event.title}
                          ></div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className={`text-xs animate-pulse ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Events List */}
        <div className="bg-gradient-to-br from-white/90 via-purple-50/50 to-pink-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm rounded-xl shadow-lg p-6 border-2 border-primary-200/50 dark:border-primary-700 slide-in-right">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {format(selectedDate, 'EEEE, MMMM d')}
          </h2>

          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-hide">
            {selectedEvents.length > 0 ? (
              selectedEvents.map((event, idx) => {
                const Icon = getEventTypeIcon(event.type)
                const eventColor = event.type === 'exam'
                  ? 'from-red-500 to-red-600'
                  : event.type === 'assignment'
                    ? 'from-orange-500 to-orange-600'
                    : 'from-primary-500 to-primary-600'

                return (
                  <div
                    key={event.id}
                    style={{ animationDelay: `${idx * 100}ms` }}
                    className="p-4 border-2 border-transparent bg-gradient-to-r from-transparent to-transparent hover:from-blue-50 hover:to-purple-50 dark:hover:from-gray-700 dark:hover:to-gray-700 rounded-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-md slide-up"
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`p-2 bg-gradient-to-br ${eventColor} rounded-lg shadow-md`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {event.title}
                        </h3>
                        {event.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <Clock className="w-3 h-3 mr-1" />
                          {event.start_date ? (
                            new Date(event.start_date).getHours() === 0 && new Date(event.start_date).getMinutes() === 0
                              ? 'All day'
                              : format(new Date(event.start_date), 'h:mm a')
                          ) : 'No time specified'}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No events on this day
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

