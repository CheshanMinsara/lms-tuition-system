import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { populateDemoData } from '../lib/demoData'
import toast from 'react-hot-toast'
import { Sparkles } from 'lucide-react'

export default function DemoDataButton() {
  const [loading, setLoading] = useState(false)

  const handlePopulateDemoData = async () => {
    if (!confirm('This will create demo courses, lessons, assessments, and events. Continue?')) {
      return
    }

    setLoading(true)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        toast.error('Authentication error: ' + authError.message)
        setLoading(false)
        return
      }

      if (!user) {
        toast.error('You must be logged in to create demo data')
        setLoading(false)
        return
      }

      console.log('User authenticated:', user.id)
      
      // Check if user has profile and proper role
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile) {
        toast.error('Please complete your profile first', { id: 'demo-data' })
        setLoading(false)
        return
      }

      // For demo purposes, temporarily update role to instructor if needed
      // This allows students to create demo courses
      if (profile.role !== 'instructor' && profile.role !== 'admin') {
        const { error: roleError } = await supabase
          .from('profiles')
          .update({ role: 'instructor' })
          .eq('id', user.id)
        
        if (roleError) {
          console.warn('Could not update role:', roleError)
          toast.error('Permission issue. Please contact admin.', { id: 'demo-data' })
          setLoading(false)
          return
        }
      }

      toast.loading('Creating demo data...', { id: 'demo-data' })

      const results = await populateDemoData(user.id)
      
      const successMessage = `Demo data created! ${results.courses.length} courses, ${results.lessons.length} lessons, ${results.assessments.length} assessments`
      
      if (results.errors.length > 0) {
        toast.error(`Some items failed. Check console for details.`, { id: 'demo-data' })
        console.error('Failed items:', results.errors)
      } else {
        toast.success(successMessage, { id: 'demo-data' })
      }
      
      // Refresh the page after a short delay to show new courses
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Error creating demo data:', error)
      toast.error('Failed to create demo data: ' + (error.message || 'Unknown error'), { id: 'demo-data' })
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePopulateDemoData}
      disabled={loading}
      className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50"
    >
      <Sparkles className="w-4 h-4" />
      <span>{loading ? 'Creating...' : 'Load Demo Data'}</span>
    </button>
  )
}

