import express from 'express';
import {
  getSeekerProfile, updateSeekerProfile, uploadAvatar, uploadResume,
  addSkill, deleteSkill,
  addEducation, updateEducation, deleteEducation,
  addExperience, updateExperience, deleteExperience,
  addProject, deleteProject,
  addCertification, deleteCertification,
  saveJob, unsaveJob, getSavedJobs,
  getRecruiterProfile, updateRecruiterProfile, uploadLogo
} from '../controllers/profileController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.js';
import { upload } from '../middlewares/upload.js';

const router = express.Router();

router.get('/seeker', authenticateToken, requireRole('job_seeker'), getSeekerProfile);
router.put('/seeker', authenticateToken, requireRole('job_seeker'), updateSeekerProfile);
router.post('/seeker/avatar', authenticateToken, requireRole('job_seeker'), upload.single('avatar'), uploadAvatar);
router.post('/seeker/resume', authenticateToken, requireRole('job_seeker'), upload.single('resume'), uploadResume);

router.post('/seeker/skills', authenticateToken, requireRole('job_seeker'), addSkill);
router.delete('/seeker/skills/:id', authenticateToken, requireRole('job_seeker'), deleteSkill);

router.post('/seeker/education', authenticateToken, requireRole('job_seeker'), addEducation);
router.put('/seeker/education/:id', authenticateToken, requireRole('job_seeker'), updateEducation);
router.delete('/seeker/education/:id', authenticateToken, requireRole('job_seeker'), deleteEducation);

router.post('/seeker/experience', authenticateToken, requireRole('job_seeker'), addExperience);
router.put('/seeker/experience/:id', authenticateToken, requireRole('job_seeker'), updateExperience);
router.delete('/seeker/experience/:id', authenticateToken, requireRole('job_seeker'), deleteExperience);

router.post('/seeker/projects', authenticateToken, requireRole('job_seeker'), addProject);
router.delete('/seeker/projects/:id', authenticateToken, requireRole('job_seeker'), deleteProject);

router.post('/seeker/certifications', authenticateToken, requireRole('job_seeker'), upload.single('certificate'), addCertification);
router.delete('/seeker/certifications/:id', authenticateToken, requireRole('job_seeker'), deleteCertification);

router.post('/seeker/saved-jobs/:jobId', authenticateToken, requireRole('job_seeker'), saveJob);
router.delete('/seeker/saved-jobs/:jobId', authenticateToken, requireRole('job_seeker'), unsaveJob);
router.get('/seeker/saved-jobs', authenticateToken, requireRole('job_seeker'), getSavedJobs);

router.get('/recruiter', authenticateToken, requireRole('recruiter'), getRecruiterProfile);
router.put('/recruiter', authenticateToken, requireRole('recruiter'), updateRecruiterProfile);
router.post('/recruiter/logo', authenticateToken, requireRole('recruiter'), upload.single('logo'), uploadLogo);

export default router;
