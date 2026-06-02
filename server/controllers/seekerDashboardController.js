import pool from '../config/db.js';

export const getDashboardCounts = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.json({ success: true, counts: { applications: 0, shortlisted: 0, interviews: 0, savedJobs: 0 } });
    }
    const seekerId = seekers[0].id;

    const [totalApps] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE seeker_id = ?', [seekerId]);
    const [shortlisted] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE seeker_id = ? AND status = "shortlisted"', [seekerId]);
    const [interviews] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE seeker_id = ? AND status = "interview"', [seekerId]);
    const [saved] = await pool.execute('SELECT COUNT(*) as count FROM saved_jobs WHERE seeker_id = ?', [seekerId]);

    res.json({
      success: true,
      counts: {
        applications: totalApps[0].count,
        shortlisted: shortlisted[0].count,
        interviews: interviews[0].count,
        savedJobs: saved[0].count,
      },
    });
  } catch (error) {
    console.error('Counts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch counts' });
  }
};

export const getDashboardApplications = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.json({ success: true, applications: [] });
    }
    
    const [applications] = await pool.execute(
      `SELECT j.title as job_title, j.company_name, j.location, j.employment_type, a.applied_at, a.status 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE a.seeker_id = ? 
       ORDER BY a.applied_at DESC`,
      [seekers[0].id]
    );

    res.json({ success: true, applications });
  } catch (error) {
    console.error('Applications error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
};

export const getDashboardShortlisted = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.json({ success: true, shortlisted: [] });
    }
    
    const [shortlisted] = await pool.execute(
      `SELECT j.title as job_title, j.company_name, a.updated_at as shortlisted_date, u.name as recruiter_name 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       JOIN recruiters r ON j.recruiter_id = r.id
       JOIN users u ON r.user_id = u.id
       WHERE a.seeker_id = ? AND a.status = 'shortlisted'
       ORDER BY a.updated_at DESC`,
      [seekers[0].id]
    );

    res.json({ success: true, shortlisted });
  } catch (error) {
    console.error('Shortlisted error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch shortlisted jobs' });
  }
};

export const getDashboardInterviews = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.json({ success: true, interviews: [] });
    }
    
    const [interviews] = await pool.execute(
      `SELECT j.title as job_title, j.company_name, a.interview_date, a.status 
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE a.seeker_id = ? AND a.status = 'interview'
       ORDER BY a.interview_date ASC`,
      [seekers[0].id]
    );

    const formattedInterviews = interviews.map(i => {
      let date = 'Not Scheduled';
      let time = 'TBD';
      if (i.interview_date) {
        const d = new Date(i.interview_date);
        date = d.toLocaleDateString();
        time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return {
        ...i,
        date,
        time,
        mode: 'Online',
        link: 'https://meet.google.com/xyz',
      };
    });

    res.json({ success: true, interviews: formattedInterviews });
  } catch (error) {
    console.error('Interviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch interviews' });
  }
};
