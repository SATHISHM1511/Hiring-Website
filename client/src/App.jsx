import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import LoadingSpinner from './components/ui/LoadingSpinner.jsx';

const LandingPage = lazy(() => import('./pages/LandingPage.jsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const RecruiterDashboard = lazy(() => import('./pages/recruiter/RecruiterDashboard.jsx'));
const RecruiterAnalytics = lazy(() => import('./pages/recruiter/RecruiterAnalytics.jsx'));
const PostJob = lazy(() => import('./pages/recruiter/PostJob.jsx'));
const ManageJobs = lazy(() => import('./pages/recruiter/ManageJobs.jsx'));
const JobCandidates = lazy(() => import('./pages/recruiter/JobCandidates.jsx'));
const JobApplications = lazy(() => import('./pages/recruiter/JobApplications.jsx'));
const RecruiterProfile = lazy(() => import('./pages/recruiter/RecruiterProfile.jsx'));
const SeekerDashboard = lazy(() => import('./pages/seeker/SeekerDashboard.jsx'));
const SeekerJobs = lazy(() => import('./pages/seeker/SeekerJobs.jsx'));
const JobDetails = lazy(() => import('./pages/seeker/JobDetails.jsx'));
const RecommendedJobs = lazy(() => import('./pages/seeker/RecommendedJobs.jsx'));
const AppliedJobs = lazy(() => import('./pages/seeker/AppliedJobs.jsx'));
const SavedJobs = lazy(() => import('./pages/seeker/SavedJobs.jsx'));
const SeekerProfile = lazy(() => import('./pages/seeker/SeekerProfile.jsx'));

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullscreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={user.role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard'} replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner fullscreen />;
  if (user) {
    return <Navigate to={user.role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard'} replace />;
  }
  return children;
};

export default function App() {
  return (
    <Suspense fallback={<LoadingSpinner fullscreen />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        <Route path="/recruiter/dashboard" element={
          <ProtectedRoute allowedRole="recruiter"><RecruiterDashboard /></ProtectedRoute>
        } />
        <Route path="/recruiter/analytics" element={
          <ProtectedRoute allowedRole="recruiter"><RecruiterAnalytics /></ProtectedRoute>
        } />
        <Route path="/recruiter/post-job" element={
          <ProtectedRoute allowedRole="recruiter"><PostJob /></ProtectedRoute>
        } />
        <Route path="/recruiter/post-job/:id" element={
          <ProtectedRoute allowedRole="recruiter"><PostJob /></ProtectedRoute>
        } />
        <Route path="/recruiter/manage-jobs" element={
          <ProtectedRoute allowedRole="recruiter"><ManageJobs /></ProtectedRoute>
        } />
        <Route path="/recruiter/manage-jobs/:jobId/candidates" element={
          <ProtectedRoute allowedRole="recruiter"><JobCandidates /></ProtectedRoute>
        } />
        <Route path="/recruiter/applications" element={
          <ProtectedRoute allowedRole="recruiter"><JobApplications /></ProtectedRoute>
        } />
        <Route path="/recruiter/profile" element={
          <ProtectedRoute allowedRole="recruiter"><RecruiterProfile /></ProtectedRoute>
        } />

        <Route path="/seeker/dashboard" element={
          <ProtectedRoute allowedRole="job_seeker"><SeekerDashboard /></ProtectedRoute>
        } />
        <Route path="/seeker/jobs" element={
          <ProtectedRoute allowedRole="job_seeker"><SeekerJobs /></ProtectedRoute>
        } />
        <Route path="/seeker/jobs/:id" element={
          <ProtectedRoute allowedRole="job_seeker"><JobDetails /></ProtectedRoute>
        } />
        <Route path="/seeker/recommended" element={
          <ProtectedRoute allowedRole="job_seeker"><RecommendedJobs /></ProtectedRoute>
        } />
        <Route path="/seeker/applied" element={
          <ProtectedRoute allowedRole="job_seeker"><AppliedJobs /></ProtectedRoute>
        } />
        <Route path="/seeker/saved" element={
          <ProtectedRoute allowedRole="job_seeker"><SavedJobs /></ProtectedRoute>
        } />
        <Route path="/seeker/profile" element={
          <ProtectedRoute allowedRole="job_seeker"><SeekerProfile /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
