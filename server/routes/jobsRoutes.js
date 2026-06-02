import express from 'express';
import {
  getJobs, getJobById, createJob, updateJob, deleteJob,
  getRecruiterJobs, getRecommendedJobs
} from '../controllers/jobsController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getJobs);
router.get('/recruiter/my-jobs', authenticateToken, requireRole('recruiter'), getRecruiterJobs);
router.get('/recommended', authenticateToken, requireRole('job_seeker'), getRecommendedJobs);
router.get('/:id', getJobById);
router.post('/', authenticateToken, requireRole('recruiter'), createJob);
router.put('/:id', authenticateToken, requireRole('recruiter'), updateJob);
router.delete('/:id', authenticateToken, requireRole('recruiter'), deleteJob);

export default router;
