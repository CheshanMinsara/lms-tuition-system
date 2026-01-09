import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Bell, Calendar } from 'lucide-react'
import { format } from 'date-fns'

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnnouncements()
    subscribeToAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*, courses(*)')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
      console.error('Error fetching announcements:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToAnnouncements = () => {
    const subscription = supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
        },
        (payload) => {
          setAnnouncements((prev) => [payload.new, ...prev])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading announcements...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-gradient">Announcements 📢</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
          Stay updated with latest news and updates
        </p>
      </div>

      <div className="space-y-4">
        {announcements.length > 0 ? (
          announcements.map((announcement, index) => (
            <div
              key={announcement.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="bg-gradient-to-br from-white to-purple-50/50 dark:from-gray-800 dark:to-purple-900/20 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-purple-100 dark:border-purple-900 hover:scale-[1.01] slide-up"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg shadow-md">
                  <Bell className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {announcement.title}
                      </h3>
                      {announcement.courses && (
                        <p className="text-sm text-primary-600 dark:text-primary-400 mt-1">
                          {announcement.courses.title}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(announcement.created_at), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-gradient-to-br from-white/90 via-purple-50/50 to-pink-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 rounded-xl shadow-lg border-2 border-purple-200/50 dark:border-purple-700">
            <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No announcements available</p>
          </div>
        )}
      </div>
    </div>
  )
}

