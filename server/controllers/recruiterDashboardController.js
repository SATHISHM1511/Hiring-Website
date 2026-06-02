import pool from '../config/db.js';

const getRecruiterId = async (userId) => {
  const [recruiters] = await pool.execute('SELECT id FROM recruiters WHERE user_id = ?', [userId]);
  return recruiters.length > 0 ? recruiters[0].id : null;
};

export const getDashboardCounts = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const [totalJobsResult] = await pool.execute('SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ?', [recruiterId]);
    const [activeJobsResult] = await pool.execute('SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND applications_count > 0', [recruiterId]);
    const [applicationsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = ?',
      [recruiterId]
    );
    const [shortlistedResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = ? AND a.status = "shortlisted"',
      [recruiterId]
    );

    res.json({
      success: true,
      counts: {
        totalJobs: totalJobsResult[0].count,
        activeJobs: activeJobsResult[0].count,
        applications: applicationsResult[0].count,
        shortlisted: shortlistedResult[0].count,
      }
    });
  } catch (error) {
    console.error('getDashboardCounts error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getManageJobs = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const [jobs] = await pool.execute(
      'SELECT id, title, employment_type, location, created_at, applications_count, status, company_name FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC',
      [recruiterId]
    );

    res.json({ success: true, jobs });
  } catch (error) {
    console.error('getManageJobs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getActiveJobs = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const [jobs] = await pool.execute(
      'SELECT id, title, company_name as department, applications_count, created_at, status FROM jobs WHERE recruiter_id = ? AND applications_count > 0 ORDER BY applications_count DESC',
      [recruiterId]
    );

    res.json({ success: true, activeJobs: jobs });
  } catch (error) {
    console.error('getActiveJobs error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getShortlistedCandidates = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const [candidates] = await pool.execute(
      `SELECT js.first_name, js.last_name, u.email, a.updated_at as shortlisted_date, a.status, j.title as job_role
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN job_seekers js ON a.seeker_id = js.id
       JOIN users u ON js.user_id = u.id
       WHERE j.recruiter_id = ? AND a.status = 'shortlisted'
       ORDER BY a.updated_at DESC`,
      [recruiterId]
    );

    res.json({ success: true, candidates });
  } catch (error) {
    console.error('getShortlistedCandidates error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteJob = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const jobId = req.params.jobId;

    const [jobs] = await connection.execute('SELECT id FROM jobs WHERE id = ? AND recruiter_id = ?', [jobId, recruiterId]);
    if (jobs.length === 0) {
      connection.release();
      return res.status(404).json({ success: false, message: 'Job not found or unauthorized' });
    }

    await connection.beginTransaction();

    await connection.execute('DELETE FROM applications WHERE job_id = ?', [jobId]);
    await connection.execute('DELETE FROM saved_jobs WHERE job_id = ?', [jobId]);
    await connection.execute('DELETE FROM jobs WHERE id = ?', [jobId]);

    await connection.commit();
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('deleteJob error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  } finally {
    connection.release();
  }
};

export const getJobCandidates = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const jobId = req.params.jobId;

    const [jobs] = await pool.execute('SELECT id, title, location FROM jobs WHERE id = ? AND recruiter_id = ?', [jobId, recruiterId]);
    if (jobs.length === 0) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to job candidates' });
    }

    const jobData = jobs[0];

    const [candidates] = await pool.execute(
      `SELECT 
        a.id as application_id, a.status, a.applied_at, a.cover_letter, a.recruiter_notes, a.interview_date,
        js.id as seeker_id, js.first_name, js.last_name, js.avatar_url, js.resume_url, js.resume_filename, js.phone, js.location as seeker_location,
        u.email,
        (SELECT SUM(DATEDIFF(IFNULL(end_date, CURRENT_DATE()), start_date)) FROM experience WHERE seeker_id = js.id AND start_date IS NOT NULL) as total_experience_days
       FROM applications a
       JOIN job_seekers js ON a.seeker_id = js.id
       JOIN users u ON js.user_id = u.id
       WHERE a.job_id = ?
       ORDER BY a.applied_at DESC`,
      [jobId]
    );

    const formattedCandidates = candidates.map(c => {
      let experienceText = 'N/A';
      if (c.total_experience_days) {
        const years = Math.floor(c.total_experience_days / 365);
        experienceText = `${years} Years`;
      }
      return {
        ...c,
        experience: experienceText,
        job_title: jobData.title,
        job_location: jobData.location
      };
    });

    const counts = {
      total: candidates.length,
      reviewed: candidates.filter(c => c.status === 'reviewed').length,
      shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
      rejected: candidates.filter(c => c.status === 'rejected').length,
    };

    res.json({ success: true, jobTitle: jobData.title, counts, candidates: formattedCandidates });
  } catch (error) {
    console.error('getJobCandidates error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateCandidateStatus = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const applicationId = req.params.applicationId;
    const { status } = req.body;

    const [apps] = await pool.execute(
      `SELECT a.id FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE a.id = ? AND j.recruiter_id = ?`,
      [applicationId, recruiterId]
    );

    if (apps.length === 0) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    await pool.execute('UPDATE applications SET status = ? WHERE id = ?', [status, applicationId]);

    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('updateCandidateStatus error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const scheduleInterview = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const { applicationId, interviewDate, time, mode, link, notes } = req.body;

    const [apps] = await pool.execute(
      `SELECT a.id, a.recruiter_notes, js.user_id as seeker_user_id, j.title as job_title 
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN job_seekers js ON a.seeker_id = js.id
       WHERE a.id = ? AND j.recruiter_id = ?`,
      [applicationId, recruiterId]
    );

    if (apps.length === 0) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    let dateTime = null;
    if (interviewDate && time) {
      dateTime = new Date(`${interviewDate}T${time}`);
    } else if (interviewDate) {
      dateTime = new Date(interviewDate);
    }

    const originalNotes = apps[0].recruiter_notes ? JSON.parse(apps[0].recruiter_notes).originalNotes || apps[0].recruiter_notes : '';
    const recruiterNotesStr = JSON.stringify({ mode, link, notes, originalNotes, interviewTime: time });

    await pool.execute(
      'UPDATE applications SET status = "interview", interview_date = ?, recruiter_notes = ? WHERE id = ?',
      [dateTime, recruiterNotesStr, applicationId]
    );

    if (req.app.get('io')) {
      const io = req.app.get('io');
      const payload = {
        applicationId,
        status: 'interview',
        interview_date: dateTime,
        recruiter_notes: recruiterNotesStr
      };
      io.to(`user_${apps[0].seeker_user_id}`).emit('interview_updated', payload);
      io.to(`user_${req.user.id}`).emit('interview_updated', payload);

      const notifMsg = `An interview has been scheduled for ${apps[0].job_title}`;
      io.to(`user_${apps[0].seeker_user_id}`).emit('notification', {
        title: '📅 Interview Scheduled',
        message: notifMsg,
        type: 'interview_scheduled'
      });
      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [apps[0].seeker_user_id, '📅 Interview Scheduled', notifMsg, 'interview_scheduled', applicationId, 'application']
      );
    }

    res.json({ success: true, message: 'Interview scheduled successfully' });
  } catch (error) {
    console.error('scheduleInterview error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateInterview = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const { applicationId } = req.params;
    const { interviewDate, time, mode, link, notes } = req.body;

    const [apps] = await pool.execute(
      `SELECT a.id, a.recruiter_notes, js.user_id as seeker_user_id, j.title as job_title 
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN job_seekers js ON a.seeker_id = js.id
       WHERE a.id = ? AND j.recruiter_id = ?`,
      [applicationId, recruiterId]
    );

    if (apps.length === 0) return res.status(403).json({ success: false, message: 'Unauthorized' });

    let dateTime = null;
    if (interviewDate && time) {
      dateTime = new Date(`${interviewDate}T${time}`);
    } else if (interviewDate) {
      dateTime = new Date(interviewDate);
    }

    let parsedNotes = {};
    try {
      parsedNotes = JSON.parse(apps[0].recruiter_notes || '{}');
    } catch(e) {}
    
    const originalNotes = parsedNotes.originalNotes !== undefined ? parsedNotes.originalNotes : apps[0].recruiter_notes;
    const recruiterNotesStr = JSON.stringify({ mode, link, notes, originalNotes, interviewTime: time });

    await pool.execute(
      'UPDATE applications SET interview_date = ?, recruiter_notes = ? WHERE id = ?',
      [dateTime, recruiterNotesStr, applicationId]
    );

    if (req.app.get('io')) {
      const io = req.app.get('io');
      const payload = {
        applicationId: parseInt(applicationId),
        interview_date: dateTime,
        recruiter_notes: recruiterNotesStr
      };
      io.to(`user_${apps[0].seeker_user_id}`).emit('interview_updated', payload);
      io.to(`user_${req.user.id}`).emit('interview_updated', payload);

      const notifMsg = `Your interview for ${apps[0].job_title} has been updated`;
      io.to(`user_${apps[0].seeker_user_id}`).emit('notification', {
        title: '📅 Interview Updated',
        message: notifMsg,
        type: 'interview_scheduled'
      });
      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [apps[0].seeker_user_id, '📅 Interview Updated', notifMsg, 'interview_scheduled', applicationId, 'application']
      );
    }

    res.json({ success: true, message: 'Interview updated successfully' });
  } catch (error) {
    console.error('updateInterview error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteInterviewSchedule = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const { applicationId } = req.params;

    const [apps] = await pool.execute(
      `SELECT a.id, a.recruiter_notes, js.user_id as seeker_user_id, j.title as job_title 
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN job_seekers js ON a.seeker_id = js.id
       WHERE a.id = ? AND j.recruiter_id = ?`,
      [applicationId, recruiterId]
    );

    if (apps.length === 0) return res.status(403).json({ success: false, message: 'Unauthorized' });

    let parsedNotes = {};
    try {
      parsedNotes = JSON.parse(apps[0].recruiter_notes || '{}');
    } catch(e) {}
    
    const recruiterNotesStr = parsedNotes.originalNotes !== undefined ? parsedNotes.originalNotes : null;

    await pool.execute(
      'UPDATE applications SET status = "shortlisted", interview_date = NULL, recruiter_notes = ? WHERE id = ?',
      [recruiterNotesStr, applicationId]
    );

    if (req.app.get('io')) {
      const io = req.app.get('io');
      const payload = {
        applicationId: parseInt(applicationId),
        status: 'shortlisted',
        interview_date: null,
        recruiter_notes: recruiterNotesStr
      };
      io.to(`user_${apps[0].seeker_user_id}`).emit('interview_updated', payload);
      io.to(`user_${req.user.id}`).emit('interview_updated', payload);

      const notifMsg = `Your interview for ${apps[0].job_title} has been cancelled`;
      io.to(`user_${apps[0].seeker_user_id}`).emit('notification', {
        title: '📅 Interview Cancelled',
        message: notifMsg,
        type: 'general'
      });
      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) VALUES (?, ?, ?, ?, ?, ?)`,
        [apps[0].seeker_user_id, '📅 Interview Cancelled', notifMsg, 'general', applicationId, 'application']
      );
    }

    res.json({ success: true, message: 'Interview removed successfully' });
  } catch (error) {
    console.error('deleteInterviewSchedule error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};


export const getCandidateProfile = async (req, res) => {
  try {
    const recruiterId = await getRecruiterId(req.user.id);
    if (!recruiterId) return res.status(404).json({ success: false, message: 'Recruiter not found' });

    const seekerId = req.params.seekerId;

    const [seekers] = await pool.execute(
      'SELECT js.*, u.email FROM job_seekers js JOIN users u ON js.user_id = u.id WHERE js.id = ?',
      [seekerId]
    );

    if (seekers.length === 0) return res.status(404).json({ success: false, message: 'Candidate not found' });

    const profile = seekers[0];

    const [skills] = await pool.execute('SELECT skill_name FROM skills WHERE seeker_id = ?', [seekerId]);
    const [experience] = await pool.execute('SELECT * FROM experience WHERE seeker_id = ? ORDER BY start_date DESC', [seekerId]);
    const [education] = await pool.execute('SELECT * FROM education WHERE seeker_id = ? ORDER BY start_year DESC', [seekerId]);
    const [projects] = await pool.execute('SELECT * FROM projects WHERE seeker_id = ? ORDER BY created_at DESC', [seekerId]);
    const [certifications] = await pool.execute('SELECT * FROM certifications WHERE seeker_id = ? ORDER BY issue_date DESC', [seekerId]);

    res.json({
      success: true,
      profile: {
        ...profile,
        skills: skills.map(s => s.skill_name),
        experience,
        education,
        projects,
        certifications
      }
    });
  } catch (error) {
    console.error('getCandidateProfile error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
