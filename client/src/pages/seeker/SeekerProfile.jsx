import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiEdit2, FiSave, FiPlus, FiTrash2, FiUpload, FiDownload,
  FiEye, FiX, FiGithub, FiLinkedin, FiGlobe, FiMapPin,
  FiPhone, FiBriefcase, FiBook, FiStar, FiAward, FiCode
} from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import styles from './SeekerProfile.module.css';

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><FiX /></button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

export default function SeekerProfile() {
  const { profile: authProfile, updateProfile } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingBasic, setEditingBasic] = useState(false);
  const [basicForm, setBasicForm] = useState({});
  const [savingBasic, setSavingBasic] = useState(false);

  const [modal, setModal] = useState(null); // 'skill'|'education'|'experience'|'project'|'cert'
  const [modalForm, setModalForm] = useState({});

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/profile/seeker');
      if (data.success) {
        setProfile(data.profile);
        setBasicForm({
          first_name: data.profile.first_name || '',
          last_name: data.profile.last_name || '',
          phone: data.profile.phone || '',
          location: data.profile.location || '',
          designation: data.profile.designation || '',
          bio: data.profile.bio || '',
          linkedin_url: data.profile.linkedin_url || '',
          github_url: data.profile.github_url || '',
          portfolio_url: data.profile.portfolio_url || '',
        });
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSaveBasic = async () => {
    setSavingBasic(true);
    try {
      await api.put('/profile/seeker', basicForm);
      await fetchProfile();
      updateProfile(basicForm);
      setEditingBasic(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile'); }
    setSavingBasic(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const { data } = await api.post('/profile/seeker/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) { setProfile(p => ({ ...p, avatar_url: data.avatar_url })); toast.success('Avatar updated!'); }
    } catch { toast.error('Failed to upload avatar'); }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('resume', file);
    try {
      const { data } = await api.post('/profile/seeker/resume', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (data.success) { setProfile(p => ({ ...p, resume_url: data.resume_url, resume_filename: data.filename })); toast.success('Resume uploaded!'); }
    } catch { toast.error('Failed to upload resume'); }
  };

  const addSkill = async () => {
    try {
      await api.post('/profile/seeker/skills', modalForm);
      await fetchProfile();
      setModal(null);
      toast.success('Skill added!');
    } catch { toast.error('Failed to add skill'); }
  };

  const deleteSkill = async (id) => {
    try {
      await api.delete(`/profile/seeker/skills/${id}`);
      setProfile(p => ({ ...p, skills: p.skills.filter(s => s.id !== id) }));
      toast.info('Skill removed');
    } catch { toast.error('Failed to remove skill'); }
  };

  const addEducation = async () => {
    try {
      await api.post('/profile/seeker/education', modalForm);
      await fetchProfile();
      setModal(null);
      toast.success('Education added!');
    } catch { toast.error('Failed to add education'); }
  };

  const deleteEducation = async (id) => {
    try {
      await api.delete(`/profile/seeker/education/${id}`);
      setProfile(p => ({ ...p, education: p.education.filter(e => e.id !== id) }));
      toast.info('Education removed');
    } catch {}
  };

  const addExperience = async () => {
    try {
      await api.post('/profile/seeker/experience', modalForm);
      await fetchProfile();
      setModal(null);
      toast.success('Experience added!');
    } catch { toast.error('Failed to add experience'); }
  };

  const deleteExperience = async (id) => {
    try {
      await api.delete(`/profile/seeker/experience/${id}`);
      setProfile(p => ({ ...p, experience: p.experience.filter(e => e.id !== id) }));
    } catch {}
  };

  const addProject = async () => {
    const payload = { ...modalForm, technologies: modalForm.technologies ? modalForm.technologies.split(',').map(t => t.trim()) : [] };
    try {
      await api.post('/profile/seeker/projects', payload);
      await fetchProfile();
      setModal(null);
      toast.success('Project added!');
    } catch { toast.error('Failed to add project'); }
  };

  const deleteProject = async (id) => {
    try {
      await api.delete(`/profile/seeker/projects/${id}`);
      setProfile(p => ({ ...p, projects: p.projects.filter(pr => pr.id !== id) }));
    } catch {}
  };

  const completion = profile?.profile_completion || 0;
  const avatarText = profile ? `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() : 'U';

  if (loading) return (
    <DashboardLayout>
      <div className="page-content">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 160, borderRadius: 16 }} />)}
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="page-content">
        <motion.div
          className={`card ${styles.profileHeader}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.completionBar}>
            <div className={styles.completionFill} style={{ width: `${completion}%` }} />
          </div>

          <div className={styles.headerContent}>
            <div className={styles.avatarSection}>
              <div className={styles.avatarWrapper}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className={styles.avatar} />
                ) : (
                  <div className={styles.avatarFallback}>{avatarText}</div>
                )}
                <label className={styles.avatarUploadBtn} htmlFor="avatar-upload">
                  <FiEdit2 size={12} />
                  <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </label>
              </div>
            </div>

            <div className={styles.headerInfo}>
              <h1 className={styles.headerName}>
                {profile?.first_name} {profile?.last_name}
              </h1>
              <p className={styles.headerEmail}>{profile?.designation || 'Add your designation'}</p>
              <div className={styles.headerMeta}>
                {profile?.location && <span><FiMapPin size={13} /> {profile.location}</span>}
                {profile?.phone && <span><FiPhone size={13} /> {profile.phone}</span>}
              </div>
              <div className={styles.socialLinks}>
                {profile?.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer"><FiLinkedin /></a>}
                {profile?.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer"><FiGithub /></a>}
                {profile?.portfolio_url && <a href={profile.portfolio_url} target="_blank" rel="noreferrer"><FiGlobe /></a>}
              </div>
            </div>

            <div className={styles.headerActions}>
              {profile?.updated_at && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 12 }}>
                  Profile updated: {new Date(profile.updated_at).toLocaleDateString()}
                </div>
              )}
              <div className={styles.completionBadge}>
                <div className={styles.completionRing}>
                  <svg viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border-light)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="14" fill="none" stroke="var(--primary)" strokeWidth="3"
                      strokeDasharray={`${completion * 0.88} 88`} strokeLinecap="round" />
                  </svg>
                  <span>{completion}%</span>
                </div>
                <p>Profile</p>
              </div>
              {!editingBasic ? (
                <button className="btn btn-primary btn-sm" onClick={() => setEditingBasic(true)}>
                  <FiEdit2 size={14} /> Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditingBasic(false)}>Cancel</button>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveBasic} disabled={savingBasic}>
                    <FiSave size={14} /> {savingBasic ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {editingBasic && (
              <motion.div
                className={styles.editForm}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className={styles.formGrid}>
                  {[
                    { key: 'first_name', label: 'First Name', type: 'text' },
                    { key: 'last_name', label: 'Last Name', type: 'text' },
                    { key: 'phone', label: 'Phone', type: 'tel' },
                    { key: 'location', label: 'Location', type: 'text' },
                    { key: 'designation', label: 'Designation', type: 'text' },
                    { key: 'linkedin_url', label: 'LinkedIn URL', type: 'url' },
                    { key: 'github_url', label: 'GitHub URL', type: 'url' },
                    { key: 'portfolio_url', label: 'Portfolio URL', type: 'url' },
                  ].map(f => (
                    <div key={f.key} className="form-group">
                      <label className="form-label">{f.label}</label>
                      <input type={f.type} className="form-input" value={basicForm[f.key] || ''} onChange={(e) => setBasicForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    </div>
                  ))}
                </div>
                <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
                  <label className="form-label">Bio</label>
                  <textarea className="form-input form-textarea" rows={3} value={basicForm.bio || ''} onChange={(e) => setBasicForm(p => ({ ...p, bio: e.target.value }))} placeholder="Write a short bio about yourself..." />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className={styles.profileGrid}>
          <div className={styles.leftCol}>
            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}><FiStar size={18} /> Skills</h3>
                <button className="btn btn-primary btn-sm" onClick={() => { setModal('skill'); setModalForm({ skill_name: '', proficiency: 'intermediate' }); }}>
                  <FiPlus size={14} /> Add
                </button>
              </div>
              <div className={styles.skillTags}>
                {profile?.skills?.length > 0 ? profile.skills.map(s => (
                  <div key={s.id} className={styles.skillTag}>
                    <span>{s.skill_name}</span>
                    <button onClick={() => deleteSkill(s.id)}><FiX size={11} /></button>
                  </div>
                )) : <p className="text-muted text-sm">No skills added yet. Add your skills to improve your profile!</p>}
              </div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}><FiBriefcase size={18} /> Work Experience</h3>
                <button className="btn btn-primary btn-sm" onClick={() => { setModal('experience'); setModalForm({ company: '', role: '', location: '', start_date: '', end_date: '', is_current: false, description: '' }); }}>
                  <FiPlus size={14} /> Add
                </button>
              </div>
              {profile?.experience?.length > 0 ? profile.experience.map(exp => (
                <div key={exp.id} className={styles.timelineItem}>
                  <div className={styles.timelineDot} />
                  <div className={styles.timelineContent}>
                    <div className={styles.itemHeader}>
                      <div>
                        <h4 className={styles.itemTitle}>{exp.role}</h4>
                        <p className={styles.itemSubtitle}>{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                        <p className={styles.itemDate}>
                          {exp.start_date ? new Date(exp.start_date).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : ''}
                          {' — '}
                          {exp.is_current ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en', { month: 'short', year: 'numeric' }) : ''}
                        </p>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteExperience(exp.id)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                    {exp.description && <p className={styles.itemDesc}>{exp.description}</p>}
                  </div>
                </div>
              )) : <p className="text-muted text-sm">Add your work experience to stand out</p>}
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}><FiBook size={18} /> Education</h3>
                <button className="btn btn-primary btn-sm" onClick={() => { setModal('education'); setModalForm({ college: '', degree: '', field_of_study: '', cgpa: '', start_year: '', end_year: '', description: '' }); }}>
                  <FiPlus size={14} /> Add
                </button>
              </div>
              {profile?.education?.length > 0 ? profile.education.map(edu => (
                <div key={edu.id} className={styles.eduCard}>
                  <div className={styles.eduIcon}>🎓</div>
                  <div className={styles.eduContent}>
                    <div className={styles.itemHeader}>
                      <div>
                        <h4 className={styles.itemTitle}>{edu.college}</h4>
                        <p className={styles.itemSubtitle}>{edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</p>
                        <p className={styles.itemDate}>{edu.start_year} — {edu.is_current ? 'Present' : edu.end_year}{edu.cgpa ? ` · CGPA: ${edu.cgpa}` : ''}</p>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => deleteEducation(edu.id)}>
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )) : <p className="text-muted text-sm">Add your educational qualifications</p>}
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}><FiCode size={18} /> Projects</h3>
                <button className="btn btn-primary btn-sm" onClick={() => { setModal('project'); setModalForm({ name: '', description: '', technologies: '', github_url: '', live_url: '' }); }}>
                  <FiPlus size={14} /> Add
                </button>
              </div>
              {profile?.projects?.length > 0 ? (
                <div className={styles.projectsGrid}>
                  {profile.projects.map(proj => {
                    const techs = typeof proj.technologies === 'string' ? JSON.parse(proj.technologies || '[]') : (proj.technologies || []);
                    return (
                      <div key={proj.id} className={styles.projectCard}>
                        <div className={styles.itemHeader}>
                          <h4 className={styles.itemTitle}>{proj.name}</h4>
                          <button className="btn btn-ghost btn-sm" onClick={() => deleteProject(proj.id)}><FiTrash2 size={14} /></button>
                        </div>
                        <p className={styles.projectDesc}>{proj.description}</p>
                        <div className={styles.techTags}>
                          {techs.map(t => <span key={t} className="tag" style={{ fontSize: '0.72rem' }}>{t}</span>)}
                        </div>
                        <div className={styles.projectLinks}>
                          {proj.github_url && <a href={proj.github_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><FiGithub size={14} /> GitHub</a>}
                          {proj.live_url && <a href={proj.live_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><FiGlobe size={14} /> Live</a>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="text-muted text-sm">Showcase your projects to impress recruiters</p>}
            </motion.div>
          </div>

          <div className={styles.rightCol}>
            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h3 className={styles.sectionTitle} style={{ marginBottom: 'var(--spacing-md)' }}>📄 Resume</h3>
              <div className={styles.resumeSection}>
                {profile?.resume_url ? (
                  <>
                    <div className={styles.resumeFile}>
                      <span>📎</span>
                      <div>
                        <p className={styles.resumeFilename}>{profile.resume_filename || 'Resume.pdf'}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--success)' }}>✓ Uploaded</p>
                      </div>
                    </div>
                    {profile.resume_updated_at && (
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12, marginTop: -4 }}>
                        Resume updated: {new Date(profile.resume_updated_at).toLocaleDateString()}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <a href={profile.resume_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><FiEye size={14} /> View</a>
                      <a href={profile.resume_url} download className="btn btn-secondary btn-sm"><FiDownload size={14} /> Download</a>
                      <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer' }}>
                        <FiUpload size={14} /> Replace
                        <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResumeUpload} />
                      </label>
                    </div>
                  </>
                ) : (
                  <label className={styles.resumeUpload}>
                    <FiUpload size={24} />
                    <p>Upload Resume</p>
                    <span>.PDF, .DOC, .DOCX (max 10MB)</span>
                    <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResumeUpload} />
                  </label>
                )}
              </div>
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}><FiAward size={18} /> Certifications</h3>
                <button className="btn btn-primary btn-sm" onClick={() => { setModal('cert'); setModalForm({ name: '', issuer: '', issue_date: '', credential_url: '' }); }}>
                  <FiPlus size={14} /> Add
                </button>
              </div>
              {profile?.certifications?.length > 0 ? profile.certifications.map(cert => (
                <div key={cert.id} className={styles.certCard}>
                  <div className={styles.certIcon}>🏆</div>
                  <div style={{ flex: 1 }}>
                    <h4 className={styles.itemTitle}>{cert.name}</h4>
                    <p className={styles.itemSubtitle}>{cert.issuer}</p>
                    {cert.issue_date && <p className={styles.itemDate}>{new Date(cert.issue_date).toLocaleDateString('en', { month: 'short', year: 'numeric' })}</p>}
                    {cert.credential_url && <a href={cert.credential_url} target="_blank" rel="noreferrer" className={styles.credentialLink}>View Certificate →</a>}
                  </div>
                </div>
              )) : <p className="text-muted text-sm">Add your certifications and credentials</p>}
            </motion.div>

            <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <h3 className={styles.sectionTitle} style={{ marginBottom: 'var(--spacing-md)' }}>🔗 Portfolio</h3>
              <div className={styles.portfolioLinks}>
                {[
                  { key: 'linkedin_url', label: 'LinkedIn', icon: <FiLinkedin />, color: '#0077B5' },
                  { key: 'github_url', label: 'GitHub', icon: <FiGithub />, color: '#333' },
                  { key: 'portfolio_url', label: 'Website', icon: <FiGlobe />, color: 'var(--primary)' },
                ].map(link => (
                  <div key={link.key} className={styles.portfolioLink}>
                    <span style={{ color: link.color }}>{link.icon}</span>
                    <span className={styles.linkLabel}>{link.label}</span>
                    {profile?.[link.key] ? (
                      <a href={profile[link.key]} target="_blank" rel="noreferrer" className={styles.linkValue}>
                        {profile[link.key].replace('https://', '').slice(0, 25)}...
                      </a>
                    ) : (
                      <span className={styles.linkEmpty}>Not added</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modal === 'skill' && (
          <Modal title="Add Skill" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label className="form-label">Skill Name</label>
                <input className="form-input" placeholder="e.g. React, Python, AWS" value={modalForm.skill_name || ''} onChange={(e) => setModalForm(p => ({ ...p, skill_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Proficiency</label>
                <select className="form-input form-select" value={modalForm.proficiency || 'intermediate'} onChange={(e) => setModalForm(p => ({ ...p, proficiency: e.target.value }))}>
                  {['beginner', 'intermediate', 'advanced', 'expert'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
              <button className="btn btn-primary btn-full" onClick={addSkill}>Add Skill</button>
            </div>
          </Modal>
        )}

        {modal === 'education' && (
          <Modal title="Add Education" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label className="form-label">College / University *</label>
                <input className="form-input" value={modalForm.college || ''} onChange={(e) => setModalForm(p => ({ ...p, college: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label">Degree</label>
                  <input className="form-input" placeholder="B.Tech" value={modalForm.degree || ''} onChange={(e) => setModalForm(p => ({ ...p, degree: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Field of Study</label>
                  <input className="form-input" placeholder="Computer Science" value={modalForm.field_of_study || ''} onChange={(e) => setModalForm(p => ({ ...p, field_of_study: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Year</label>
                  <input type="number" className="form-input" value={modalForm.start_year || ''} onChange={(e) => setModalForm(p => ({ ...p, start_year: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Year</label>
                  <input type="number" className="form-input" value={modalForm.end_year || ''} onChange={(e) => setModalForm(p => ({ ...p, end_year: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">CGPA</label>
                  <input type="number" step="0.01" max="10" className="form-input" value={modalForm.cgpa || ''} onChange={(e) => setModalForm(p => ({ ...p, cgpa: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={addEducation}>Add Education</button>
            </div>
          </Modal>
        )}

        {modal === 'experience' && (
          <Modal title="Add Work Experience" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label">Company *</label>
                  <input className="form-input" value={modalForm.company || ''} onChange={(e) => setModalForm(p => ({ ...p, company: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <input className="form-input" placeholder="Software Engineer" value={modalForm.role || ''} onChange={(e) => setModalForm(p => ({ ...p, role: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-input" value={modalForm.start_date || ''} onChange={(e) => setModalForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-input" value={modalForm.end_date || ''} onChange={(e) => setModalForm(p => ({ ...p, end_date: e.target.value }))} disabled={modalForm.is_current} />
                </div>
              </div>
              <label style={{ display: 'flex', gap: 8, fontSize: '0.875rem', cursor: 'pointer', alignItems: 'center' }}>
                <input type="checkbox" checked={modalForm.is_current || false} onChange={(e) => setModalForm(p => ({ ...p, is_current: e.target.checked }))} />
                Currently working here
              </label>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" rows={3} value={modalForm.description || ''} onChange={(e) => setModalForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <button className="btn btn-primary btn-full" onClick={addExperience}>Add Experience</button>
            </div>
          </Modal>
        )}

        {modal === 'project' && (
          <Modal title="Add Project" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label className="form-label">Project Name *</label>
                <input className="form-input" value={modalForm.name || ''} onChange={(e) => setModalForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input form-textarea" rows={3} value={modalForm.description || ''} onChange={(e) => setModalForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Technologies (comma separated)</label>
                <input className="form-input" placeholder="React, Node.js, MySQL" value={modalForm.technologies || ''} onChange={(e) => setModalForm(p => ({ ...p, technologies: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input type="url" className="form-input" value={modalForm.github_url || ''} onChange={(e) => setModalForm(p => ({ ...p, github_url: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Live URL</label>
                  <input type="url" className="form-input" value={modalForm.live_url || ''} onChange={(e) => setModalForm(p => ({ ...p, live_url: e.target.value }))} />
                </div>
              </div>
              <button className="btn btn-primary btn-full" onClick={addProject}>Add Project</button>
            </div>
          </Modal>
        )}

        {modal === 'cert' && (
          <Modal title="Add Certification" onClose={() => setModal(null)}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-md)' }}>
              <div className="form-group">
                <label className="form-label">Certification Name *</label>
                <input className="form-input" value={modalForm.name || ''} onChange={(e) => setModalForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Issuing Organization</label>
                <input className="form-input" placeholder="AWS, Google, Coursera..." value={modalForm.issuer || ''} onChange={(e) => setModalForm(p => ({ ...p, issuer: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Issue Date</label>
                <input type="date" className="form-input" value={modalForm.issue_date || ''} onChange={(e) => setModalForm(p => ({ ...p, issue_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Credential URL</label>
                <input type="url" className="form-input" value={modalForm.credential_url || ''} onChange={(e) => setModalForm(p => ({ ...p, credential_url: e.target.value }))} />
              </div>
              <button className="btn btn-primary btn-full" onClick={async () => {
                try {
                  await api.post('/profile/seeker/certifications', modalForm);
                  await fetchProfile();
                  setModal(null);
                  toast.success('Certification added!');
                } catch { toast.error('Failed to add certification'); }
              }}>Add Certification</button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
