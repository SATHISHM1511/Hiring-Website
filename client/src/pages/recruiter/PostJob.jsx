import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck, FiArrowLeft, FiArrowRight, FiEye, FiSend, FiX, FiPlus } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import styles from './PostJob.module.css';

const STEPS = ['Basic Info', 'Skills & Requirements', 'Description & Preview'];
const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
const EXPERIENCES = ['Fresher', '1-2 years', '2-3 years', '3-5 years', '5-8 years', '8+ years'];

export default function PostJob() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [preview, setPreview] = useState(false);

  const [form, setForm] = useState({
    title: '', company_name: profile?.company_name || '', location: '',
    is_remote: false, experience: '', employment_type: 'full-time',
    salary_min: '', salary_max: '',
    skills: [], requirements: '', qualifications: '',
    description: '', benefits: '', responsibilities: '',
    status: 'active',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (id) {
      const fetchJob = async () => {
        try {
          const { data } = await api.get(`/jobs/${id}`);
          if (data.success) {
            const job = data.job;
            let parsedSkills = [];
            try {
              parsedSkills = typeof job.skills === 'string' ? JSON.parse(job.skills) : (job.skills || []);
            } catch(e) {}
            
            setForm({
              title: job.title || '',
              company_name: job.company_name || profile?.company_name || '',
              location: job.location || '',
              is_remote: job.is_remote ? true : false,
              experience: job.experience || '',
              employment_type: job.employment_type || 'full-time',
              salary_min: job.salary_min || '',
              salary_max: job.salary_max || '',
              skills: parsedSkills,
              requirements: job.requirements || '',
              qualifications: job.qualifications || '',
              description: job.description || '',
              benefits: job.benefits || '',
              responsibilities: job.responsibilities || '',
              status: job.status || 'active',
            });
          }
        } catch (err) {
          toast.error('Failed to load job details');
        }
      };
      fetchJob();
    }
  }, [id, profile]);

  const update = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !form.skills.includes(skill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, skill] }));
      setSkillInput('');
    }
  };

  const removeSkill = (skill) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  const validateStep = (s) => {
    const errs = {};
    if (s === 0) {
      if (!form.title.trim()) errs.title = 'Job title is required';
      if (!form.company_name.trim()) errs.company_name = 'Company name is required';
      if (!form.location.trim() && !form.is_remote) errs.location = 'Location required (or mark as remote)';
      if (!form.employment_type) errs.employment_type = 'Employment type is required';
    }
    if (s === 1) {
      if (form.skills.length === 0) errs.skills = 'Add at least one skill';
    }
    if (s === 2) {
      if (!form.description.trim()) errs.description = 'Job description is required';
    }
    return errs;
  };

  const nextStep = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(prev => Math.min(prev + 1, STEPS.length - 1));
  };

  const prevStep = () => setStep(prev => Math.max(prev - 1, 0));

  const handleSubmit = async (isDraft = false) => {
    const errs = validateStep(step);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = { ...form, status: isDraft ? 'draft' : 'active' };
      if (id) {
        const { data } = await api.put(`/jobs/${id}`, payload);
        if (data.success) {
          toast.success('Job updated successfully! 🚀');
          navigate('/recruiter/manage-jobs');
        }
      } else {
        const { data } = await api.post('/jobs', payload);
        if (data.success) {
          toast.success(isDraft ? 'Job saved as draft' : 'Job published successfully! 🚀');
          navigate('/recruiter/manage-jobs');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };

  const progressPct = ((step + 1) / STEPS.length) * 100;

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className={styles.pageHeader}>
          <div>
            <h1 className="section-title">{id ? 'Edit Job' : 'Post a Job'}</h1>
            <p className="section-subtitle">{id ? 'Update your job posting details' : 'Find the perfect candidate for your open position'}</p>
          </div>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.steps}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className={`${styles.stepIndicator} ${i <= step ? styles.stepDone : ''} ${i === step ? styles.stepActive : ''}`}>
                  <div className={styles.stepCircle}>
                    {i < step ? <FiCheck size={14} /> : i + 1}
                  </div>
                  <span className={styles.stepName}>{s}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`${styles.stepLine} ${i < step ? styles.stepLineDone : ''}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
          </div>
        </div>

        <div className={styles.formContainer}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className={styles.stepContent}
              >
                <h2 className={styles.stepTitle}>Basic Information</h2>
                <p className={styles.stepSubtitle}>Tell us about the position</p>

                <div className={styles.formGrid2}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Job Title *</label>
                    <input className={`form-input ${errors.title ? 'error' : ''}`} placeholder="e.g. Senior React Developer" value={form.title} onChange={update('title')} />
                    {errors.title && <span className="form-error">{errors.title}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <input className={`form-input ${errors.company_name ? 'error' : ''}`} placeholder="Company name" value={form.company_name} onChange={update('company_name')} />
                    {errors.company_name && <span className="form-error">{errors.company_name}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className={`form-input ${errors.location ? 'error' : ''}`} placeholder="City, Country" value={form.location} onChange={update('location')} disabled={form.is_remote} />
                    {errors.location && <span className="form-error">{errors.location}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience Level</label>
                    <select className="form-input form-select" value={form.experience} onChange={update('experience')}>
                      <option value="">Select experience</option>
                      {EXPERIENCES.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Employment Type *</label>
                    <select className={`form-input form-select ${errors.employment_type ? 'error' : ''}`} value={form.employment_type} onChange={update('employment_type')}>
                      {EMPLOYMENT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                    {errors.employment_type && <span className="form-error">{errors.employment_type}</span>}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min Salary (₹/year)</label>
                    <input type="number" className="form-input" placeholder="e.g. 800000" value={form.salary_min} onChange={update('salary_min')} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Salary (₹/year)</label>
                    <input type="number" className="form-input" placeholder="e.g. 1500000" value={form.salary_max} onChange={update('salary_max')} />
                  </div>
                </div>

                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={form.is_remote} onChange={update('is_remote')} />
                  <span>🏠 This is a remote position</span>
                </label>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className={styles.stepContent}
              >
                <h2 className={styles.stepTitle}>Skills & Requirements</h2>
                <p className={styles.stepSubtitle}>What are you looking for in a candidate?</p>

                <div className="form-group">
                  <label className="form-label">Required Skills *</label>
                  <div className={styles.skillInput}>
                    <input
                      className="form-input"
                      placeholder="Add a skill (e.g. React, Python, AWS)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    />
                    <button type="button" className="btn btn-primary btn-sm" onClick={addSkill}>
                      <FiPlus size={16} /> Add
                    </button>
                  </div>
                  {errors.skills && <span className="form-error">{errors.skills}</span>}
                  <div className={styles.skillTags}>
                    {form.skills.map(skill => (
                      <div key={skill} className={styles.skillTag}>
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)}>
                          <FiX size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Requirements</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={5}
                    placeholder="• 3+ years of experience in React&#10;• Strong knowledge of JavaScript ES6+&#10;• Experience with REST APIs"
                    value={form.requirements}
                    onChange={update('requirements')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Qualifications</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={4}
                    placeholder="• Bachelor's degree in Computer Science&#10;• Relevant certifications"
                    value={form.qualifications}
                    onChange={update('qualifications')}
                  />
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                className={styles.stepContent}
              >
                <h2 className={styles.stepTitle}>Job Description & Preview</h2>
                <p className={styles.stepSubtitle}>Describe the role in detail</p>

                <div className="form-group">
                  <label className="form-label">Job Description *</label>
                  <textarea
                    className={`form-input form-textarea ${errors.description ? 'error' : ''}`}
                    rows={6}
                    placeholder="Write a detailed description of the role, company culture, and what makes this opportunity unique..."
                    value={form.description}
                    onChange={update('description')}
                  />
                  {errors.description && <span className="form-error">{errors.description}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Responsibilities</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={5}
                    placeholder="• Design and implement scalable frontend solutions&#10;• Collaborate with design and backend teams&#10;• Code review and mentoring"
                    value={form.responsibilities}
                    onChange={update('responsibilities')}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Benefits & Perks</label>
                  <textarea
                    className="form-input form-textarea"
                    rows={4}
                    placeholder="• Competitive salary&#10;• Health insurance&#10;• Work from home flexibility&#10;• Annual bonus"
                    value={form.benefits}
                    onChange={update('benefits')}
                  />
                </div>

                {preview && (
                  <motion.div
                    className={styles.jobPreview}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className={styles.previewHeader}>
                      <h3>{form.title || 'Job Title'}</h3>
                      <div className={styles.previewMeta}>
                        <span>🏢 {form.company_name}</span>
                        <span>📍 {form.is_remote ? 'Remote' : form.location}</span>
                        <span>💼 {form.employment_type}</span>
                        {form.salary_min && <span>💰 ₹{(parseInt(form.salary_min)/100000).toFixed(1)}L - ₹{(parseInt(form.salary_max)/100000).toFixed(1)}L</span>}
                      </div>
                      <div className={styles.previewSkills}>
                        {form.skills.map(s => <span key={s} className="tag">{s}</span>)}
                      </div>
                    </div>
                    <p>{form.description}</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <div className={styles.formNav}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={prevStep}
              disabled={step === 0}
            >
              <FiArrowLeft size={16} /> Previous
            </button>

            <div className={styles.navRight}>
              {step === STEPS.length - 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setPreview(!preview)}
                >
                  <FiEye size={16} /> {preview ? 'Hide' : 'Preview'}
                </button>
              )}

              {step < STEPS.length - 1 ? (
                <button type="button" className="btn btn-primary" onClick={nextStep}>
                  Next <FiArrowRight size={16} />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => handleSubmit(true)}
                    disabled={loading}
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleSubmit(false)}
                    disabled={loading}
                  >
                    {loading ? 'Publishing...' : <><FiSend size={16} /> Publish Job</>}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
