/**
 * Seeder — populates MongoDB with 12 sample courses and a demo mentor account.
 * Run: node seeder.js          (seed)
 * Run: node seeder.js --clear  (wipe all courses + users)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/User');
const Course = require('./models/Course');

const MENTOR = {
  name: 'Demo Mentor',
  email: 'mentor@skillsphere.com',
  password: 'mentor123',
  role: 'mentor',
};

const COURSES = [
  {
    title: 'Complete Web Development Bootcamp',
    description: 'Master HTML, CSS, JavaScript, React and Node.js. Build 5 real-world projects and become a job-ready full-stack developer from scratch.',
    category: 'Coding', level: 'Beginner', price: 0, isFree: true, duration: '42 hours',
    // Unsplash: Luca Bravo — https://unsplash.com/photos/4hbJ-eymZ1o
    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=250&fit=crop&auto=format',
    tags: ['html','css','javascript','react'],
    lessons: [
      { title: 'Introduction to HTML', duration: '15 min', order: 1, videoUrl: 'https://www.youtube.com/embed/qz0aGYrrlhU' },
      { title: 'CSS Fundamentals', duration: '20 min', order: 2, videoUrl: 'https://www.youtube.com/embed/1PnVor36_40' },
      { title: 'JavaScript Basics', duration: '30 min', order: 3, videoUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk' },
      { title: 'React Components', duration: '45 min', order: 4, videoUrl: 'https://www.youtube.com/embed/Ke90Tje7VS0' },
    ],
    upcomingClass: { date: '2026-04-10', time: '6:00 PM', platform: 'Zoom', link: 'https://zoom.us/j/123456' },
    studentsCount: 12, rating: 4.8,
  },
  {
    title: 'Guitar for Absolute Beginners',
    description: 'Start your guitar journey today. Learn chords, strumming patterns, and play your first songs within weeks — no experience needed.',
    category: 'Guitar', level: 'Beginner', price: 0, isFree: true, duration: '18 hours',
    // Unsplash: Jefferson Santos — https://unsplash.com/photos/1510915361894-db8b60106cb1
    thumbnail: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=400&h=250&fit=crop&auto=format',
    tags: ['guitar','music','beginner'],
    lessons: [
      { title: 'Holding the Guitar Correctly', duration: '10 min', order: 1 },
      { title: 'Your First Chord: G Major', duration: '15 min', order: 2 },
      { title: 'Basic Strumming Patterns', duration: '20 min', order: 3 },
    ],
    upcomingClass: { date: '2026-04-12', time: '5:00 PM', platform: 'Google Meet', link: 'https://meet.google.com/abc-defg' },
    studentsCount: 8, rating: 4.9,
  },
  {
    title: 'Contemporary Dance Masterclass',
    description: 'Explore contemporary dance techniques, improvisation, and choreography with a professional dancer.',
    category: 'Dance', level: 'Intermediate', price: 0, isFree: true, duration: '24 hours',
    // Unsplash: Ahmad Odeh — https://unsplash.com/photos/1547153760-18fc86324498
    thumbnail: 'https://images.unsplash.com/photo-1547153760-18fc86324498?w=400&h=250&fit=crop&auto=format',
    tags: ['dance','contemporary'],
    lessons: [
      { title: 'Warm-up Routine', duration: '20 min', order: 1 },
      { title: 'Floor Work Basics', duration: '25 min', order: 2 },
    ],
    upcomingClass: { date: '2026-04-14', time: '4:00 PM', platform: 'Zoom', link: 'https://zoom.us/j/789012' },
    studentsCount: 5, rating: 4.7,
  },
  {
    title: 'UI/UX Design with Figma',
    description: 'Master Figma and core design principles to create stunning user interfaces and experiences for web and mobile apps.',
    category: 'Design', level: 'Intermediate', price: 0, isFree: true, duration: '30 hours',
    // Unsplash: Balázs Kétyi — https://unsplash.com/photos/1561070791-2526d30994b5
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop&auto=format',
    tags: ['figma','ui','ux','design'],
    lessons: [
      { title: 'Figma Interface Tour', duration: '12 min', order: 1 },
      { title: 'Design Principles & Typography', duration: '18 min', order: 2 },
    ],
    upcomingClass: { date: '2026-04-15', time: '7:00 PM', platform: 'Zoom', link: 'https://zoom.us/j/345678' },
    studentsCount: 9, rating: 4.6,
  },
  {
    title: 'Piano Fundamentals',
    description: 'Learn to read sheet music and play piano from zero. Covers scales, chords, and popular songs.',
    category: 'Music', level: 'Beginner', price: 0, isFree: true, duration: '22 hours',
    // Unsplash: Jordan Whitfield — https://unsplash.com/photos/1520523839897-bd0b52f945a0
    thumbnail: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=250&fit=crop&auto=format',
    tags: ['piano','music'],
    lessons: [
      { title: 'Piano Keys Overview', duration: '10 min', order: 1 },
      { title: 'Reading Sheet Music', duration: '20 min', order: 2 },
    ],
    upcomingClass: { date: '2026-04-16', time: '3:00 PM', platform: 'Google Meet', link: 'https://meet.google.com/xyz-abcd' },
    studentsCount: 7, rating: 4.8,
  },
  {
    title: 'Python & Data Science Bootcamp',
    description: 'Deep dive into Python, pandas, numpy, matplotlib, and machine learning. Build real data science projects.',
    category: 'Coding', level: 'Advanced', price: 0, isFree: true, duration: '55 hours',
    // Unsplash: Markus Spiske — https://unsplash.com/photos/1526374965328-7f61d4dc18c5
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400&h=250&fit=crop&auto=format',
    tags: ['python','data science','ml'],
    lessons: [
      { title: 'Python Refresher', duration: '25 min', order: 1 },
      { title: 'Intro to Pandas & NumPy', duration: '30 min', order: 2 },
    ],
    upcomingClass: { date: '2026-04-18', time: '8:00 PM', platform: 'Zoom', link: 'https://zoom.us/j/901234' },
    studentsCount: 15, rating: 4.9,
  },
  {
    title: 'Photography Masterclass',
    description: 'Learn composition, lighting, and editing to take stunning photos with any camera.',
    category: 'Photography', level: 'Beginner', price: 0, isFree: true, duration: '20 hours',
    // Unsplash: Terje Sollie — https://unsplash.com/photos/1452587996403-9d8d9a8c1b1a
    thumbnail: 'https://images.unsplash.com/photo-1452587996403-9d8d9a8c1b1a?w=400&h=250&fit=crop&auto=format',
    tags: ['photography','camera','editing'],
    lessons: [{ title: 'Camera Basics', duration: '15 min', order: 1 }],
    upcomingClass: { date: '2026-04-20', time: '5:30 PM', platform: 'Zoom', link: 'https://zoom.us/j/567890' },
    studentsCount: 6, rating: 4.7,
  },
  {
    title: 'Digital Marketing Fundamentals',
    description: 'Master SEO, social media marketing, email campaigns, and paid ads.',
    category: 'Business', level: 'Beginner', price: 0, isFree: true, duration: '28 hours',
    // Unsplash: Campaign Creators — https://unsplash.com/photos/qCi_MzVODoU
    thumbnail: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=400&h=250&fit=crop&auto=format',
    tags: ['marketing','seo','social media'],
    lessons: [{ title: 'Intro to Digital Marketing', duration: '18 min', order: 1 }],
    upcomingClass: { date: '2026-04-22', time: '6:30 PM', platform: 'Google Meet', link: 'https://meet.google.com/mno-pqrs' },
    studentsCount: 11, rating: 4.5,
  },
  {
    title: 'Spanish for Beginners',
    description: 'Learn conversational Spanish from zero. Master greetings, everyday phrases, and grammar basics.',
    category: 'Language', level: 'Beginner', price: 0, isFree: true, duration: '16 hours',
    // Unsplash: Romain Vignes — https://unsplash.com/photos/ywqa9IZB-dU
    thumbnail: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=400&h=250&fit=crop&auto=format',
    tags: ['spanish','language','beginner'],
    lessons: [{ title: 'Greetings & Introductions', duration: '12 min', order: 1 }],
    upcomingClass: { date: '2026-04-24', time: '4:30 PM', platform: 'Zoom', link: 'https://zoom.us/j/112233' },
    studentsCount: 14, rating: 4.8,
  },
  {
    title: 'Yoga & Mindfulness',
    description: 'Build strength, flexibility, and mental clarity through guided yoga sessions and mindfulness practices.',
    category: 'Fitness', level: 'Beginner', price: 0, isFree: true, duration: '14 hours',
    // Unsplash: Conscious Design — https://unsplash.com/photos/r3pIy-3Xgmg
    thumbnail: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=250&fit=crop&auto=format',
    tags: ['yoga','fitness','mindfulness'],
    lessons: [{ title: 'Breathing Techniques', duration: '10 min', order: 1 }],
    upcomingClass: { date: '2026-04-25', time: '7:00 AM', platform: 'Zoom', link: 'https://zoom.us/j/445566' },
    studentsCount: 18, rating: 4.9,
  },
  {
    title: 'Italian Cooking Masterclass',
    description: 'Learn authentic Italian recipes from pasta to tiramisu. Master techniques used by professional chefs.',
    category: 'Cooking', level: 'Intermediate', price: 0, isFree: true, duration: '12 hours',
    // Unsplash: Eaters Collective — https://unsplash.com/photos/rS1GogPLVHk
    thumbnail: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=400&h=250&fit=crop&auto=format',
    tags: ['cooking','italian','recipes'],
    lessons: [{ title: 'Fresh Pasta from Scratch', duration: '30 min', order: 1 }],
    upcomingClass: { date: '2026-04-26', time: '5:00 PM', platform: 'Google Meet', link: 'https://meet.google.com/tuv-wxyz' },
    studentsCount: 9, rating: 4.7,
  },
  {
    title: 'Academic Writing & Research',
    description: 'Master essay writing, research methodology, citations, and academic argumentation.',
    category: 'Academic', level: 'Intermediate', price: 0, isFree: true, duration: '18 hours',
    // Unsplash: Thought Catalog — https://unsplash.com/photos/505eectW54k
    thumbnail: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=250&fit=crop&auto=format',
    tags: ['writing','academic','research'],
    lessons: [{ title: 'Essay Structure', duration: '15 min', order: 1 }],
    upcomingClass: { date: '2026-04-28', time: '6:00 PM', platform: 'Zoom', link: 'https://zoom.us/j/778899' },
    studentsCount: 10, rating: 4.6,
  },
];

const seed = async () => {
  await connectDB();
  const clear = process.argv.includes('--clear');

  if (clear) {
    await Course.deleteMany({});
    await User.deleteMany({});
    console.log('🗑  Cleared all users and courses');
    process.exit(0);
  }

  // Create or find demo mentor
  let mentor = await User.findOne({ email: MENTOR.email });
  if (!mentor) {
    mentor = await User.create(MENTOR);
    console.log(`👤 Created demo mentor: ${MENTOR.email} / ${MENTOR.password}`);
  } else {
    console.log(`👤 Demo mentor already exists: ${MENTOR.email}`);
  }

  // Only seed courses if none exist
  const existing = await Course.countDocuments();
  if (existing > 0) {
    console.log(`📚 ${existing} courses already in DB — skipping seed`);
  } else {
    const coursesWithMentor = COURSES.map(c => ({ ...c, mentor: mentor._id }));
    await Course.insertMany(coursesWithMentor);
    console.log(`✅ Seeded ${COURSES.length} courses`);
  }

  console.log('\n🎉 Done! You can now start the server with: npm run dev');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
