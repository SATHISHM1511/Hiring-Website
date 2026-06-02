import pool from '../config/db.js';

export const getRecruiterAnalytics = async (req, res) => {
  try {
    const [recruiters] = await pool.execute('SELECT id FROM recruiters WHERE user_id = ?', [req.user.id]);
    if (recruiters.length === 0) {
      return res.json({ success: true, stats: {} });
    }

    const recruiterId = recruiters[0].id;

    const [totalJobs] = await pool.execute('SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ?', [recruiterId]);
    const [activeJobs] = await pool.execute('SELECT COUNT(*) as count FROM jobs WHERE recruiter_id = ? AND status = "active"', [recruiterId]);
    const [totalApplications] = await pool.execute(
      'SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = ?',
      [recruiterId]
    );
    const [shortlisted] = await pool.execute(
      'SELECT COUNT(*) as count FROM applications a JOIN jobs j ON a.job_id = j.id WHERE j.recruiter_id = ? AND a.status = "shortlisted"',
      [recruiterId]
    );

    const [monthlyApps] = await pool.execute(
      `SELECT DATE_FORMAT(a.applied_at, '%Y-%m') as month, COUNT(*) as count
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE j.recruiter_id = ? AND a.applied_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month`,
      [recruiterId]
    );

    const [statusBreakdown] = await pool.execute(
      `SELECT a.status, COUNT(*) as count
       FROM applications a 
       JOIN jobs j ON a.job_id = j.id 
       WHERE j.recruiter_id = ?
       GROUP BY a.status`,
      [recruiterId]
    );

    const [topJobs] = await pool.execute(
      `SELECT j.title, COUNT(a.id) as applications
       FROM jobs j 
       LEFT JOIN applications a ON j.id = a.job_id
       WHERE j.recruiter_id = ?
       GROUP BY j.id, j.title
       ORDER BY applications DESC LIMIT 5`,
      [recruiterId]
    );

    const [recentApplications] = await pool.execute(
      `SELECT a.*, j.title as job_title, js.first_name, js.last_name, js.avatar_url, u.email
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN job_seekers js ON a.seeker_id = js.id
       JOIN users u ON js.user_id = u.id
       WHERE j.recruiter_id = ?
       ORDER BY a.applied_at DESC LIMIT 5`,
      [recruiterId]
    );

    res.json({
      success: true,
      stats: {
        totalJobs: totalJobs[0].count,
        activeJobs: activeJobs[0].count,
        totalApplications: totalApplications[0].count,
        shortlisted: shortlisted[0].count,
        monthlyApps,
        statusBreakdown,
        topJobs,
        recentApplications,
      },
    });
  } catch (error) {
    console.error('Recruiter analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

export const getSeekerAnalytics = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT * FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.json({ success: true, stats: {} });
    }

    const seekerId = seekers[0].id;

    const [totalApps] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE seeker_id = ?', [seekerId]);
    const [shortlisted] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE seeker_id = ? AND status = "shortlisted"', [seekerId]);
    const [interviews] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE seeker_id = ? AND status = "interview"', [seekerId]);
    const [selected] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE seeker_id = ? AND status = "selected"', [seekerId]);
    const [saved] = await pool.execute('SELECT COUNT(*) as count FROM saved_jobs WHERE seeker_id = ?', [seekerId]);

    const [statusBreakdown] = await pool.execute(
      'SELECT status, COUNT(*) as count FROM applications WHERE seeker_id = ? GROUP BY status',
      [seekerId]
    );

    const [recentApps] = await pool.execute(
      `SELECT a.*, j.title as job_title, j.company_name, j.location, r.logo_url
       FROM applications a
       JOIN jobs j ON a.job_id = j.id
       JOIN recruiters r ON j.recruiter_id = r.id
       WHERE a.seeker_id = ?
       ORDER BY a.applied_at DESC LIMIT 5`,
      [seekerId]
    );

    res.json({
      success: true,
      stats: {
        totalApplications: totalApps[0].count,
        shortlisted: shortlisted[0].count,
        interviews: interviews[0].count,
        selected: selected[0].count,
        savedJobs: saved[0].count,
        profileCompletion: seekers[0].profile_completion,
        statusBreakdown,
        recentApplications: recentApps,
      },
    });
  } catch (error) {
    console.error('Seeker analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
};

export const getPlatformStats = async (req, res) => {
  try {
    const [activeJobs] = await pool.execute('SELECT COUNT(*) as count FROM jobs WHERE status = "active"');
    const [recruiters] = await pool.execute('SELECT COUNT(*) as count FROM recruiters');
    const [candidates] = await pool.execute('SELECT COUNT(*) as count FROM job_seekers');
    const [placements] = await pool.execute('SELECT COUNT(*) as count FROM applications WHERE status = "selected"');

    res.json({
      success: true,
      stats: {
        activeJobs: activeJobs[0].count,
        recruiters: recruiters[0].count,
        candidates: candidates[0].count,
        placements: placements[0].count,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch platform stats' });
  }
};
