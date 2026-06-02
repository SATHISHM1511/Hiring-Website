import pool from '../config/db.js';
import path from 'path';


export const getSeekerProfile = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT * FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    const seeker = seekers[0];
    const [skills] = await pool.execute('SELECT * FROM skills WHERE seeker_id = ?', [seeker.id]);
    const [certs] = await pool.execute('SELECT * FROM certifications WHERE seeker_id = ? ORDER BY issue_date DESC', [seeker.id]);
    const [edu] = await pool.execute('SELECT * FROM education WHERE seeker_id = ? ORDER BY end_year DESC', [seeker.id]);
    const [exp] = await pool.execute('SELECT * FROM experience WHERE seeker_id = ? ORDER BY start_date DESC', [seeker.id]);
    const [projects] = await pool.execute('SELECT * FROM projects WHERE seeker_id = ? ORDER BY created_at DESC', [seeker.id]);

    let completion = 0;
    if (seeker.first_name && seeker.last_name) completion += 15;
    if (seeker.phone) completion += 5;
    if (seeker.location) completion += 5;
    if (seeker.designation) completion += 10;
    if (seeker.bio) completion += 10;
    if (seeker.linkedin_url || seeker.github_url || seeker.portfolio_url) completion += 5;
    if (seeker.avatar_url) completion += 10;
    if (seeker.resume_url) completion += 10;
    if (skills.length > 0) completion += 10;
    if (exp.length > 0) completion += 10;
    if (edu.length > 0) completion += 5;
    if (projects.length > 0 || certs.length > 0) completion += 5;

    if (completion !== seeker.profile_completion) {
      await pool.execute('UPDATE job_seekers SET profile_completion = ? WHERE id = ?', [completion, seeker.id]);
      seeker.profile_completion = completion;
    }

    res.json({
      success: true,
      profile: { ...seeker, skills, certifications: certs, education: edu, experience: exp, projects },
    });
  } catch (error) {
    console.error('Get seeker profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch profile' });
  }
};

export const updateSeekerProfile = async (req, res) => {
  try {
    const { 
      first_name = null, last_name = null, phone = null, location = null, designation = null, bio = null,
      linkedin_url = null, github_url = null, portfolio_url = null, behance_url = null, dribbble_url = null 
    } = req.body;

    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    if (seekers.length === 0) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }

    await pool.execute(
      `UPDATE job_seekers SET first_name=?, last_name=?, phone=?, location=?, designation=?, bio=?,
       linkedin_url=?, github_url=?, portfolio_url=?, behance_url=?, dribbble_url=?
       WHERE user_id=?`,
      [first_name, last_name, phone, location, designation, bio,
       linkedin_url, github_url, portfolio_url, behance_url, dribbble_url, req.user.id]
    );

    if (first_name !== null || last_name !== null) {
      const [updatedSeeker] = await pool.execute('SELECT first_name, last_name FROM job_seekers WHERE user_id = ?', [req.user.id]);
      if (updatedSeeker.length > 0) {
        const fullName = `${updatedSeeker[0].first_name || ''} ${updatedSeeker[0].last_name || ''}`.trim();
        await pool.execute('UPDATE users SET name = ? WHERE id = ?', [fullName, req.user.id]);
      }
    }

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update seeker profile error:', error);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const avatarUrl = `${process.env.BASE_URL}/uploads/avatars/${req.file.filename}`;
    await pool.execute('UPDATE job_seekers SET avatar_url = ? WHERE user_id = ?', [avatarUrl, req.user.id]);
    res.json({ success: true, avatar_url: avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload avatar' });
  }
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const resumeUrl = `${process.env.BASE_URL}/uploads/resumes/${req.file.filename}`;
    await pool.execute(
      'UPDATE job_seekers SET resume_url = ?, resume_filename = ?, resume_updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
      [resumeUrl, req.file.originalname, req.user.id]
    );
    res.json({ success: true, resume_url: resumeUrl, filename: req.file.originalname });
  } catch (error) {
    console.error('Upload resume error:', error);
    res.status(500).json({ success: false, message: 'Failed to upload resume' });
  }
};

export const addSkill = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    const { skill_name, proficiency } = req.body;
    await pool.execute(
      'INSERT INTO skills (seeker_id, skill_name, proficiency) VALUES (?, ?, ?)',
      [seekers[0].id, skill_name, proficiency || 'intermediate']
    );
    res.status(201).json({ success: true, message: 'Skill added' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add skill' });
  }
};

export const deleteSkill = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    await pool.execute('DELETE FROM skills WHERE id = ? AND seeker_id = ?', [req.params.id, seekers[0].id]);
    res.json({ success: true, message: 'Skill deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete skill' });
  }
};

export const addEducation = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    const { college, degree, field_of_study, cgpa, start_year, end_year, is_current, description } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO education (seeker_id, college, degree, field_of_study, cgpa, start_year, end_year, is_current, description) VALUES (?,?,?,?,?,?,?,?,?)',
      [seekers[0].id, college, degree, field_of_study, cgpa || null, start_year, end_year, is_current ? 1 : 0, description]
    );
    const [edu] = await pool.execute('SELECT * FROM education WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, education: edu[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add education' });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    const { college, degree, field_of_study, cgpa, start_year, end_year, is_current, description } = req.body;
    await pool.execute(
      'UPDATE education SET college=?,degree=?,field_of_study=?,cgpa=?,start_year=?,end_year=?,is_current=?,description=? WHERE id=? AND seeker_id=?',
      [college, degree, field_of_study, cgpa || null, start_year, end_year, is_current ? 1 : 0, description, req.params.id, seekers[0].id]
    );
    res.json({ success: true, message: 'Education updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update education' });
  }
};

export const deleteEducation = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    await pool.execute('DELETE FROM education WHERE id = ? AND seeker_id = ?', [req.params.id, seekers[0].id]);
    res.json({ success: true, message: 'Education deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete education' });
  }
};

export const addExperience = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    const { company, role, location, start_date, end_date, is_current, description } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO experience (seeker_id, company, role, location, start_date, end_date, is_current, description) VALUES (?,?,?,?,?,?,?,?)',
      [seekers[0].id, company, role, location, start_date, end_date || null, is_current ? 1 : 0, description]
    );
    const [exp] = await pool.execute('SELECT * FROM experience WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, experience: exp[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add experience' });
  }
};

export const updateExperience = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    const { company, role, location, start_date, end_date, is_current, description } = req.body;
    await pool.execute(
      'UPDATE experience SET company=?,role=?,location=?,start_date=?,end_date=?,is_current=?,description=? WHERE id=? AND seeker_id=?',
      [company, role, location, start_date, end_date || null, is_current ? 1 : 0, description, req.params.id, seekers[0].id]
    );
    res.json({ success: true, message: 'Experience updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update experience' });
  }
};

export const deleteExperience = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    await pool.execute('DELETE FROM experience WHERE id = ? AND seeker_id = ?', [req.params.id, seekers[0].id]);
    res.json({ success: true, message: 'Experience deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete experience' });
  }
};

export const addProject = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    const { name, description, technologies, github_url, live_url } = req.body;
    const [result] = await pool.execute(
      'INSERT INTO projects (seeker_id, name, description, technologies, github_url, live_url) VALUES (?,?,?,?,?,?)',
      [seekers[0].id, name, description, JSON.stringify(technologies || []), github_url, live_url]
    );
    const [project] = await pool.execute('SELECT * FROM projects WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, project: project[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add project' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    await pool.execute('DELETE FROM projects WHERE id = ? AND seeker_id = ?', [req.params.id, seekers[0].id]);
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete project' });
  }
};

export const addCertification = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    const { name, issuer, issue_date, expiry_date, credential_id, credential_url } = req.body;
    let fileUrl = null;
    if (req.file) {
      fileUrl = `${process.env.BASE_URL}/uploads/certificates/${req.file.filename}`;
    }
    const [result] = await pool.execute(
      'INSERT INTO certifications (seeker_id, name, issuer, issue_date, expiry_date, credential_id, credential_url, file_url) VALUES (?,?,?,?,?,?,?,?)',
      [seekers[0].id, name, issuer || null, issue_date || null, expiry_date || null, credential_id || null, credential_url || null, fileUrl]
    );
    const [cert] = await pool.execute('SELECT * FROM certifications WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, certification: cert[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add certification' });
  }
};

export const deleteCertification = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    await pool.execute('DELETE FROM certifications WHERE id = ? AND seeker_id = ?', [req.params.id, seekers[0].id]);
    res.json({ success: true, message: 'Certification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete certification' });
  }
};

export const saveJob = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    await pool.execute(
      'INSERT IGNORE INTO saved_jobs (seeker_id, job_id) VALUES (?, ?)',
      [seekers[0].id, req.params.jobId]
    );
    res.json({ success: true, message: 'Job saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save job' });
  }
};

export const unsaveJob = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    await pool.execute('DELETE FROM saved_jobs WHERE seeker_id = ? AND job_id = ?', [seekers[0].id, req.params.jobId]);
    res.json({ success: true, message: 'Job removed from saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to unsave job' });
  }
};

export const getSavedJobs = async (req, res) => {
  try {
    const [seekers] = await pool.execute('SELECT id FROM job_seekers WHERE user_id = ?', [req.user.id]);
    const [jobs] = await pool.execute(
      `SELECT j.*, r.logo_url, s.saved_at FROM saved_jobs s
       JOIN jobs j ON s.job_id = j.id
       JOIN recruiters r ON j.recruiter_id = r.id
       WHERE s.seeker_id = ?
       ORDER BY s.saved_at DESC`,
      [seekers[0].id]
    );
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch saved jobs' });
  }
};


export const getRecruiterProfile = async (req, res) => {
  try {
    const [recruiters] = await pool.execute(
      `SELECT r.*, u.email, u.name FROM recruiters r 
       JOIN users u ON r.user_id = u.id 
       WHERE r.user_id = ?`,
      [req.user.id]
    );
    if (recruiters.length === 0) {
      return res.status(404).json({ success: false, message: 'Recruiter profile not found' });
    }
    res.json({ success: true, profile: recruiters[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch recruiter profile' });
  }
};

export const updateRecruiterProfile = async (req, res) => {
  try {
    const { 
      name = null, company_name = null, company_email = null, website = null, industry = null, 
      location = null, company_size = null, description = null, founded_year = null 
    } = req.body;
    await pool.execute(
      `UPDATE recruiters SET company_name=?, company_email=?, website=?, industry=?, location=?,
       company_size=?, description=?, founded_year=? WHERE user_id=?`,
      [company_name, company_email, website, industry, location, company_size, description, founded_year || null, req.user.id]
    );
    if (name !== null) {
      await pool.execute('UPDATE users SET name = ? WHERE id = ?', [name, req.user.id]);
    }
    
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${req.user.id}`).emit('profile_updated', {
        company_name, company_email, website, industry, location, company_size, description, founded_year, name
      });
    }
    
    res.json({ success: true, message: 'Recruiter profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const logoUrl = `${process.env.BASE_URL}/uploads/logos/${req.file.filename}`;
    await pool.execute('UPDATE recruiters SET logo_url = ? WHERE user_id = ?', [logoUrl, req.user.id]);
    
    if (req.app.get('io')) {
      req.app.get('io').to(`user_${req.user.id}`).emit('profile_updated', { logo_url: logoUrl });
    }
    
    res.json({ success: true, logo_url: logoUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to upload logo' });
  }
};
