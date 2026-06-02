import pool from '../config/db.js';

export const applyForJob = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.status(404).json({ success: false, message: 'Job seeker profile not found' });
    }

    const seekerId = seekers[0].id;
    const jobId = req.params.jobId;

    const [existing] = await pool.execute(
      'SELECT id FROM applications WHERE job_id = ? AND seeker_id = ?',
      [jobId, seekerId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Already applied for this job' });
    }

    const { cover_letter } = req.body;

    await pool.execute(
      'INSERT INTO applications (job_id, seeker_id, cover_letter) VALUES (?, ?, ?)',
      [jobId, seekerId, cover_letter || null]
    );

    await pool.execute('UPDATE jobs SET applications_count = applications_count + 1 WHERE id = ?', [jobId]);

    const [jobs] = await pool.execute(
      `SELECT j.*, r.user_id as recruiter_user_id FROM jobs j 
       JOIN recruiters r ON j.recruiter_id = r.id WHERE j.id = ?`,
      [jobId]
    );

    if (jobs.length > 0) {
      const [seeker] = await pool.execute(
        'SELECT first_name, last_name FROM job_seekers WHERE id = ?', [seekerId]
      );
      const seekerName = seeker[0] ? `${seeker[0].first_name} ${seeker[0].last_name}` : 'A candidate';

      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          jobs[0].recruiter_user_id,
          'New Application Received',
          `${seekerName} applied for ${jobs[0].title}`,
          'application_received',
          jobId,
          'job'
        ]
      );

      if (req.app.get('io')) {
        req.app.get('io').to(`user_${jobs[0].recruiter_user_id}`).emit('notification', {
          title: 'New Application',
          message: `${seekerName} applied for ${jobs[0].title}`,
          type: 'application_received',
        });
      }
    }

    res.status(201).json({ success: true, message: 'Application submitted successfully' });
  } catch (error) {
    console.error('Apply error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit application' });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.json({ success: true, applications: [] });
    }

    const [applications] = await pool.execute(
      `SELECT a.*, j.title as job_title, j.company_name, j.location, j.employment_type,
              j.salary_min, j.salary_max, r.logo_url
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN recruiters r ON j.recruiter_id = r.id
       WHERE a.seeker_id = ?
       ORDER BY a.applied_at DESC`,
      [seekers[0].id]
    );

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

export const getJobApplications = async (req, res) => {
  try {
    const [recruiters] = await pool.execute('SELECT id FROM recruiters WHERE user_id = ?', [req.user.id]);
    if (recruiters.length === 0) {
      return res.json({ success: true, applications: [] });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    let where = ['a.job_id = ?', 'j.recruiter_id = ?'];
    let params = [req.params.jobId, recruiters[0].id];

    if (status) { where.push('a.status = ?'); params.push(status); }
    if (search) {
      where.push('(js.first_name LIKE ? OR js.last_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [applications] = await pool.execute(
      `SELECT a.*, 
              js.first_name, js.last_name, js.phone, js.location as seeker_location,
              js.designation, js.resume_url, js.resume_filename, js.avatar_url,
              u.email as seeker_email,
              j.title as job_title
       FROM applications a
       JOIN job_seekers js ON a.seeker_id = js.id
       JOIN users u ON js.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       WHERE ${where.join(' AND ')}
       ORDER BY a.applied_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

export const getAllRecruiterApplications = async (req, res) => {
  try {
    const [recruiters] = await pool.execute('SELECT id FROM recruiters WHERE user_id = ?', [req.user.id]);
    if (recruiters.length === 0) {
      return res.json({ success: true, applications: [] });
    }

    const { page = 1, limit = 20, status, search } = req.query;
    let where = ['j.recruiter_id = ?'];
    let params = [recruiters[0].id];

    if (status && status !== 'all') { where.push('a.status = ?'); params.push(status); }
    if (search) {
      where.push('(js.first_name LIKE ? OR js.last_name LIKE ? OR j.title LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [applications] = await pool.execute(
      `SELECT a.*, 
              js.first_name, js.last_name, js.phone, js.location as seeker_location,
              js.designation, js.resume_url, js.resume_filename, js.avatar_url,
              u.email as seeker_email,
              j.title as job_title, j.id as job_id_ref
       FROM applications a
       JOIN job_seekers js ON a.seeker_id = js.id
       JOIN users u ON js.user_id = u.id
       JOIN jobs j ON a.job_id = j.id
       WHERE ${where.join(' AND ')}
       ORDER BY a.applied_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM applications a
       JOIN jobs j ON a.job_id = j.id
       WHERE ${where.join(' AND ')}`,
      params
    );

    res.json({ success: true, applications, total: countResult[0].total });
  } catch (error) {
    console.error('Get recruiter applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { status, recruiter_notes, interview_date } = req.body;

    const [recruiters] = await pool.execute('SELECT id FROM recruiters WHERE user_id = ?', [req.user.id]);
    if (recruiters.length === 0) {
      return res.status(404).json({ success: false, message: 'Recruiter not found' });
    }

    const [apps] = await pool.execute(
      `SELECT a.*, j.title as job_title, js.user_id as seeker_user_id, 
              js.first_name, js.last_name
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       JOIN job_seekers js ON a.seeker_id = js.id
       WHERE a.id = ? AND j.recruiter_id = ?`,
      [req.params.id, recruiters[0].id]
    );

    if (apps.length === 0) {
      return res.status(404).json({ success: false, message: 'Application not found or unauthorized' });
    }

    const app = apps[0];

    await pool.execute(
      'UPDATE applications SET status = ?, recruiter_notes = ?, interview_date = ? WHERE id = ?',
      [status, recruiter_notes || null, interview_date || null, req.params.id]
    );

    const notificationMessages = {
      reviewed: { title: 'Application Reviewed', msg: `Your application for ${app.job_title} has been reviewed` },
      shortlisted: { title: '🎉 Shortlisted!', msg: `Congratulations! You've been shortlisted for ${app.job_title}` },
      interview: { title: '📅 Interview Scheduled', msg: `An interview has been scheduled for ${app.job_title}` },
      selected: { title: '🎊 Offer Extended!', msg: `You've been selected for ${app.job_title}! Congratulations!` },
      rejected: { title: 'Application Update', msg: `Your application for ${app.job_title} was not selected` },
    };

    const notif = notificationMessages[status];
    if (notif) {
      await pool.execute(
        `INSERT INTO notifications (user_id, title, message, type, reference_id, reference_type) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [app.seeker_user_id, notif.title, notif.msg, status, app.job_id, 'job']
      );

      if (req.app.get('io')) {
        req.app.get('io').to(`user_${app.seeker_user_id}`).emit('notification', {
          title: notif.title,
          message: notif.msg,
          type: status,
        });
      }
    }

    res.json({ success: true, message: 'Application status updated successfully' });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update status' });
  }
};
