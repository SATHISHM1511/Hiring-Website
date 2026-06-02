import express from 'express';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import {
  getDashboardCounts,
  getManageJobs,
  getActiveJobs,
  getShortlistedCandidates,
  deleteJob,
  getJobCandidates,
  updateCandidateStatus,
  scheduleInterview,
  updateInterview,
  deleteInterviewSchedule,
  getCandidateProfile
} from '../controllers/recruiterDashboardController.js';

const router = express.Router();

router.use(authenticateToken, requireRole('recruiter'));

router.get('/dashboard/counts', getDashboardCounts);
router.get('/manage-jobs', getManageJobs);
router.get('/dashboard/active-jobs', getActiveJobs);
router.get('/dashboard/shortlisted', getShortlistedCandidates);
router.delete('/jobs/:jobId', deleteJob);

router.get('/jobs/:jobId/candidates', getJobCandidates);
router.patch('/candidates/:applicationId/status', updateCandidateStatus);
router.post('/interviews', scheduleInterview);
router.patch('/interviews/:applicationId', updateInterview);
router.delete('/interviews/:applicationId', deleteInterviewSchedule);
router.get('/candidates/:seekerId/profile', getCandidateProfile);

export default router;
