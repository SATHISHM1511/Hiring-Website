import express from 'express';
import { getDashboardCounts, getDashboardApplications, getDashboardShortlisted, getDashboardInterviews } from '../controllers/seekerDashboardController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('job_seeker'));

router.get('/counts', getDashboardCounts);
router.get('/applications', getDashboardApplications);
router.get('/shortlisted', getDashboardShortlisted);
router.get('/interviews', getDashboardInterviews);

export default router;
