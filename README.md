# LMS Tuition System

A modern, mobile-friendly Learning Management System designed for tuition centers and private tutoring, built with React and Supabase.

## Features

### 🔐 Authentication & User Management
- Student registration and login (email/password, Google sign-in)
- Profile management (photo, contact info, grade/class level)
- Password reset functionality
- User dashboard upon login

### 📚 Course Management
- Browse available courses/subjects
- Enroll in courses
- Course catalog with descriptions, instructors, schedules
- My Courses page showing enrolled courses
- Course progress tracking with completion percentages

### 📹 Content Delivery (All Types Supported)
- Video lessons (YouTube embeds or direct upload)
- PDF documents and reading materials
- Image-based content
- Text-based lessons and notes
- Downloadable resources
- Interactive content viewer

### 📝 Assessment & Grading System
- Multiple quiz types: multiple choice, true/false, short answer, essay
- Timed assessments
- Assignment submission (file upload)
- Grade viewing and feedback
- Quiz retakes (if allowed by instructor)
- Assessment history and scores
- Automatic grading for objective questions
- Grade book/report card view

### 📅 Calendar & Scheduling
- Interactive calendar view (monthly, weekly, daily)
- Upcoming classes and sessions
- Assignment due dates
- Exam schedules
- Event reminders and notifications
- Integration with course schedules

### 💬 Communication Tools
- Announcements from instructors
- Discussion forums per course
- Direct messaging with instructors
- Comment sections on lessons
- Notification system (in-app, email, push notifications)

### 📊 Progress Tracking & Analytics
- Overall progress dashboard
- Course completion status
- Time spent on learning
- Quiz performance analytics
- Strengths and weaknesses analysis
- Achievement badges/milestones
- Learning streaks

### 🏆 Certificates & Achievements
- Course completion certificates
- Downloadable/printable certificates
- Achievement badges for milestones
- Leaderboard (optional)

### 📱 Mobile-Friendly Design
- Fully responsive design that works on phones, tablets, desktops
- Touch-friendly interface
- Mobile-optimized navigation
- Fast loading times
- Dark mode support

### 🔍 Additional Features
- Search functionality (courses, lessons, resources)
- Bookmarking/favorites for lessons
- Notes feature for students to take notes
- Resource library
- FAQ section
- Help/Support center
- Dark mode option

## Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Build Tool**: Vite
- **Icons**: Lucide React
- **UI Components**: Custom components with Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository:
```bash
cd lms-tuition-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up Supabase:
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to SQL Editor and run the SQL script from `supabase-schema.sql`
   - Go to Storage and create the following buckets:
     - `avatars` (public access)
     - `lesson-files` (authenticated access)
     - `submissions` (authenticated access)

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Add your Supabase project URL and anon key:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
lms-tuition-system/
├── src/
│   ├── components/       # Reusable components
│   │   └── Layout.jsx
│   ├── lib/              # Utilities and configurations
│   │   └── supabase.js
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Courses.jsx
│   │   ├── CourseDetail.jsx
│   │   ├── LessonViewer.jsx
│   │   ├── Assessments.jsx
│   │   ├── AssessmentDetail.jsx
│   │   ├── Calendar.jsx
│   │   ├── Messages.jsx
│   │   ├── Profile.jsx
│   │   ├── Progress.jsx
│   │   ├── Certificates.jsx
│   │   └── Announcements.jsx
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── supabase-schema.sql   # Database schema
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## Database Schema

The database schema includes tables for:
- Profiles
- Courses
- Lessons
- Enrollments
- Progress
- Assessments & Questions
- Submissions
- Calendar Events
- Conversations & Messages
- Announcements
- Notifications
- Bookmarks

See `supabase-schema.sql` for the complete schema with Row Level Security policies.

## Features in Detail

### Authentication
- Email/password authentication
- Google OAuth integration
- Secure session management
- Password reset functionality

### Course System
- Course creation and management
- Lesson organization with multiple content types
- Enrollment tracking
- Progress monitoring

### Assessment System
- Multiple question types
- Timed quizzes
- File uploads for assignments
- Automatic grading for quizzes
- Manual grading for essays

### Communication
- Real-time messaging with instructors
- Course announcements
- Notification system
- Discussion threads

## Deployment

### Build for Production

```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Vercel/Netlify

1. Push your code to GitHub
2. Connect your repository to Vercel or Netlify
3. Add environment variables
4. Deploy

## Environment Variables

Required environment variables:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon/public key

## Security

- Row Level Security (RLS) enabled on all tables
- Secure authentication with Supabase Auth
- File uploads validated and stored securely
- User data protected with RLS policies

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For support, email support@example.com or create an issue in the repository.

