import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Send, User, MessageSquare } from 'lucide-react'
import { format } from 'date-fns'

export default function Messages({ user }) {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
  }, [user])

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages()
      subscribeToMessages()
    }
  }, [selectedConversation])

  const fetchConversations = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*, instructor:instructor_id(*)')
        .eq('student_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setConversations(data || [])
      if (data && data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async () => {
    if (!selectedConversation) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', selectedConversation.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const subscribeToMessages = () => {
    if (!selectedConversation) return

    const subscription = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation) return

    try {
      const { error } = await supabase.from('messages').insert([
        {
          conversation_id: selectedConversation.id,
          sender_id: user.id,
          message: newMessage,
        },
      ])

      if (error) throw error

      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  if (loading) {
    return <div className="animate-pulse">Loading messages...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-white">Messages 💬</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">Communicate with your instructors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-250px)]">
        {/* Conversations List */}
        <div className="bg-gradient-to-br from-white/90 via-blue-50/50 to-purple-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden flex flex-col border-2 border-primary-200/50 dark:border-primary-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Conversations</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`w-full p-4 text-left border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition ${selectedConversation?.id === conversation.id
                      ? 'bg-primary-50 dark:bg-primary-900/20'
                      : ''
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {conversation.instructor?.full_name?.charAt(0) || 'I'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {conversation.instructor?.full_name || 'Instructor'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {conversation.last_message || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 bg-gradient-to-br from-white/90 via-purple-50/50 to-pink-50/50 dark:from-gray-800/90 dark:via-gray-800 dark:to-gray-800 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden flex flex-col border-2 border-secondary-200/50 dark:border-secondary-700">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedConversation.instructor?.full_name?.charAt(0) || 'I'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {selectedConversation.instructor?.full_name || 'Instructor'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedConversation.instructor?.email || ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length > 0 ? (
                  messages.map((message) => {
                    const isOwn = message.sender_id === user.id
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} slide-up`}
                        style={{ animationDelay: `${message.id ? message.id.slice(-2) : 0}ms` }}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg transition-all duration-200 hover:scale-105 ${isOwn
                              ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                            }`}
                        >
                          <p>{message.message}</p>
                          <p
                            className={`text-xs mt-1 ${isOwn ? 'text-primary-100' : 'text-gray-500 dark:text-gray-400'
                              }`}
                          >
                            {format(new Date(message.created_at), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                )}
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 dark:text-gray-400">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

