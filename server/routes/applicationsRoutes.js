import express from 'express';
import {
  applyForJob, getMyApplications, getJobApplications,
  getAllRecruiterApplications, updateApplicationStatus
} from '../controllers/applicationsController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = express.Router();

router.post('/:jobId/apply', authenticateToken, requireRole('job_seeker'), applyForJob);
router.get('/my', authenticateToken, requireRole('job_seeker'), getMyApplications);
router.get('/all', authenticateToken, requireRole('recruiter'), getAllRecruiterApplications);
router.get('/job/:jobId', authenticateToken, requireRole('recruiter'), getJobApplications);
router.patch('/:id/status', authenticateToken, requireRole('recruiter'), updateApplicationStatus);

export default router;
