import express from 'express';
import { getRecruiterAnalytics, getSeekerAnalytics, getPlatformStats } from '../controllers/analyticsController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = express.Router();

router.get('/platform', getPlatformStats);
router.get('/recruiter', authenticateToken, requireRole('recruiter'), getRecruiterAnalytics);
router.get('/seeker', authenticateToken, requireRole('job_seeker'), getSeekerAnalytics);

export default router;
