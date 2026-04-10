import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CourseProvider } from './context/CourseContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';

import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';
import PrivateRoute from './components/common/PrivateRoute';

import CreateCourse from './components/mentor/CreateCourse';
import EditCourse from './components/mentor/EditCourse';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import StudentDashboardPage from './pages/StudentDashboardPage';
import MentorDashboardPage from './pages/MentorDashboardPage';
import Profile from './pages/Profile';
import CertificatePage from './pages/CertificatePage';
import VerifyCertificate from './pages/VerifyCertificate';
import WishlistPage from './pages/WishlistPage';

import './App.css';

const NotFound = () => (
  <MainLayout>
    <div style={{ textAlign:'center', padding:'6rem 1rem' }}>
      <div style={{ fontSize:'5rem' }}>🔍</div>
      <h2 style={{ marginTop:'1rem', fontSize:'1.5rem', fontWeight:800 }}>404 — Page not found</h2>
      <p style={{ color:'#6b7280', marginTop:'0.5rem' }}>The page you're looking for doesn't exist.</p>
    </div>
  </MainLayout>
);

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CourseProvider>
            <NotificationProvider>
              <Routes>
                <Route path="/" element={<MainLayout><Home /></MainLayout>} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/courses" element={<MainLayout><Courses /></MainLayout>} />
                <Route path="/courses/:id" element={<MainLayout><CourseDetails /></MainLayout>} />
                <Route path="/certificates/verify/:certId" element={<MainLayout><VerifyCertificate /></MainLayout>} />

                <Route path="/profile" element={
                  <PrivateRoute><MainLayout><Profile /></MainLayout></PrivateRoute>
                } />
                <Route path="/wishlist" element={
                  <PrivateRoute role="student"><MainLayout><WishlistPage /></MainLayout></PrivateRoute>
                } />
                <Route path="/certificates" element={
                  <PrivateRoute role="student"><MainLayout><CertificatePage /></MainLayout></PrivateRoute>
                } />
                <Route path="/student/dashboard" element={
                  <PrivateRoute role="student"><StudentDashboardPage /></PrivateRoute>
                } />
                <Route path="/mentor/dashboard" element={
                  <PrivateRoute role="mentor"><MentorDashboardPage /></PrivateRoute>
                } />
                <Route path="/mentor/create-course" element={
                  <PrivateRoute role="mentor"><DashboardLayout><CreateCourse /></DashboardLayout></PrivateRoute>
                } />
                <Route path="/mentor/edit-course/:id" element={
                  <PrivateRoute role="mentor"><DashboardLayout><EditCourse /></DashboardLayout></PrivateRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </NotificationProvider>
          </CourseProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
