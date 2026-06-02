import pool from '../config/db.js';

export const getJobs = async (req, res) => {
  try {
    const {
      search, location, experience, employment_type,
      salary_min, salary_max, is_remote, page = 1, limit = 12
    } = req.query;

    let where = ['j.status = "active"'];
    let params = [];

    if (search) {
      where.push('(j.title LIKE ? OR j.company_name LIKE ? OR j.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (location) { where.push('j.location LIKE ?'); params.push(`%${location}%`); }
    if (experience) { where.push('j.experience = ?'); params.push(experience); }
    if (employment_type) { where.push('j.employment_type = ?'); params.push(employment_type); }
    if (salary_min) { where.push('j.salary_min >= ?'); params.push(parseInt(salary_min)); }
    if (salary_max) { where.push('j.salary_max <= ?'); params.push(parseInt(salary_max)); }
    if (is_remote === 'true') { where.push('j.is_remote = 1'); }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [jobs] = await pool.execute(
      `SELECT j.*, r.company_name as rec_company, r.logo_url 
       FROM jobs j 
       JOIN recruiters r ON j.recruiter_id = r.id 
       WHERE ${where.join(' AND ')} 
       ORDER BY j.created_at DESC 
       LIMIT ${parseInt(limit)} OFFSET ${offset}`,
      params
    );

    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM jobs j WHERE ${where.join(' AND ')}`,
      params
    );

    res.json({
      success: true,
      jobs,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};

export const getJobById = async (req, res) => {
  try {
    const [jobs] = await pool.execute(
      `SELECT j.*, r.company_name as rec_company, r.logo_url, r.website, r.description as company_description
       FROM jobs j 
       JOIN recruiters r ON j.recruiter_id = r.id 
       WHERE j.id = ?`,
      [req.params.id]
    );

    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    await pool.execute('UPDATE jobs SET views_count = views_count + 1 WHERE id = ?', [req.params.id]);

    res.json({ success: true, job: jobs[0] });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch job' });
  }
};

export const createJob = async (req, res) => {
  try {
    const [recruiters] = await pool.execute('SELECT id FROM recruiters WHERE user_id = ?', [req.user.id]);
    if (recruiters.length === 0) {
      return res.status(404).json({ success: false, message: 'Recruiter profile not found' });
    }

    const recruiter = recruiters[0];
    const {
      title, company_name, location, is_remote, experience,
      employment_type, salary_min, salary_max, description,
      requirements, responsibilities, benefits, skills, qualifications, status
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO jobs (recruiter_id, title, company_name, location, is_remote, experience, 
       employment_type, salary_min, salary_max, description, requirements, responsibilities, 
       benefits, skills, qualifications, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recruiter.id, title, company_name, location,
        is_remote ? 1 : 0, experience, employment_type,
        salary_min || null, salary_max || null,
        description, requirements, responsibilities,
        benefits, JSON.stringify(skills || []), qualifications,
        status || 'active'
      ]
    );

    const [newJob] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [result.insertId]);

    res.status(201).json({ success: true, message: 'Job posted successfully', job: newJob[0] });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({ success: false, message: 'Failed to create job' });
  }
};

export const updateJob = async (req, res) => {
  try {
    const [recruiters] = await pool.execute('SELECT id FROM recruiters WHERE user_id = ?', [req.user.id]);
    if (recruiters.length === 0) {
      return res.status(404).json({ success: false, message: 'Recruiter profile not found' });
    }

    const [jobs] = await pool.execute('SELECT * FROM jobs WHERE id = ? AND recruiter_id = ?', [req.params.id, recruiters[0].id]);
    if (jobs.length === 0) {
      return res.status(404).json({ success: false, message: 'Job not found or unauthorized' });
    }

    const { title, location, is_remote, experience, employment_type, salary_min, salary_max, description, requirements, responsibilities, benefits, skills, qualifications, status } = req.body;

    await pool.execute(
      `UPDATE jobs SET title=?, location=?, is_remote=?, experience=?, employment_type=?,
       salary_min=?, salary_max=?, description=?, requirements=?, responsibilities=?,
       benefits=?, skills=?, qualifications=?, status=? WHERE id=?`,
      [title, location, is_remote ? 1 : 0, experience, employment_type,
       salary_min || null, salary_max || null, description, requirements,
       responsibilities, benefits, JSON.stringify(skills || []), qualifications, status, req.params.id]
    );

    const [updated] = await pool.execute('SELECT * FROM jobs WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Job updated successfully', job: updated[0] });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({ success: false, message: 'Failed to update job' });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const [recruiters] = await pool.execute('SELECT id FROM recruiters WHERE user_id = ?', [req.user.id]);
    await pool.execute('DELETE FROM jobs WHERE id = ? AND recruiter_id = ?', [req.params.id, recruiters[0].id]);
    res.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete job' });
  }
};

export const getRecruiterJobs = async (req, res) => {
  try {
    const [recruiters] = await pool.execute('SELECT id FROM recruiters WHERE user_id = ?', [req.user.id]);
    if (recruiters.length === 0) {
      return res.json({ success: true, jobs: [] });
    }

    const [jobs] = await pool.execute(
      'SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY created_at DESC',
      [recruiters[0].id]
    );

    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Get recruiter jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
};

export const getRecommendedJobs = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.json({ success: true, jobs: [] });
    }

    const seekerId = seekers[0].id;
    const [skills] = await pool.execute('SELECT skill_name FROM skills WHERE seeker_id = ?', [seekerId]);
    const skillNames = skills.map(s => s.skill_name);

    let jobs = [];
    if (skillNames.length > 0) {
      const skillConditions = skillNames.map(() => 'j.skills LIKE ?').join(' OR ');
      const skillParams = skillNames.map(s => `%${s}%`);
      const [rows] = await pool.execute(
        `SELECT j.*, r.logo_url, 
         (${skillNames.map(() => 'CASE WHEN j.skills LIKE ? THEN 1 ELSE 0 END').join('+')}) as match_count
         FROM jobs j JOIN recruiters r ON j.recruiter_id = r.id 
         WHERE j.status = 'active' AND (${skillConditions})
         ORDER BY match_count DESC LIMIT 10`,
        [...skillParams, ...skillParams]
      );
      jobs = rows;
    } else {
      const [rows] = await pool.execute(
        `SELECT j.*, r.logo_url FROM jobs j 
         JOIN recruiters r ON j.recruiter_id = r.id 
         WHERE j.status = 'active' ORDER BY j.created_at DESC LIMIT 10`
      );
      jobs = rows;
    }

    res.json({ success: true, jobs });
  } catch (error) {
    console.error('Get recommended error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
  }
};
