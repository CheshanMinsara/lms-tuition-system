# Quick Setup Guide

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Create an account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the contents of `supabase-schema.sql`
4. Go to Storage and create these buckets:
   - **avatars** (Public bucket for user avatars)
   - **lesson-files** (Private/authenticated bucket for lesson content)
   - **submissions** (Private/authenticated bucket for assignment submissions)

5. Configure Storage policies:
   - For `avatars`: Allow public read access
   - For `lesson-files` and `submissions`: Allow authenticated read/write

## Step 3: Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these values from your Supabase project settings → API

## Step 4: Enable Google OAuth (Optional)

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials

## Step 5: Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to see your LMS!

## Step 6: Create Test Data (Optional)

You can manually create test courses, lessons, and assessments through the Supabase dashboard, or create an admin interface to manage content.

## Troubleshooting

### PDF Viewer Not Working
- Ensure react-pdf is properly installed
- The PDF worker is loaded from CDN, so internet connection is required
- For offline support, you may need to bundle the worker locally

### Storage Upload Errors
- Check that storage buckets are created
- Verify bucket policies allow authenticated access
- Ensure file sizes are within Supabase limits

### Authentication Issues
- Verify your Supabase URL and keys are correct
- Check that email confirmation is disabled (or configure email templates)
- Ensure RLS policies are properly set up

