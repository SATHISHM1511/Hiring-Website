import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMapPin, FiBriefcase, FiClock, FiDollarSign, FiBookmark, FiCheckCircle, FiArrowLeft } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import styles from './SeekerJobs.module.css';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchJobData = async () => {
      try {
        const [{ data: jobData }, { data: savedData }, { data: appliedData }] = await Promise.all([
          api.get(`/jobs/${id}`),
          api.get('/profile/seeker/saved-jobs').catch(() => ({ data: { jobs: [] } })),
          api.get('/applications/my').catch(() => ({ data: { applications: [] } }))
        ]);
        
        if (jobData.success) setJob(jobData.job);
        if (savedData?.success) setSavedIds(new Set(savedData.jobs.map(j => j.id)));
        if (appliedData?.success) setAppliedIds(new Set(appliedData.applications.map(a => a.job_id)));
      } catch (err) {
        toast.error('Failed to load job details');
        navigate('/seeker/jobs');
      } finally {
        setLoading(false);
      }
    };
    fetchJobData();
  }, [id, navigate]);

  const isSaved = job ? savedIds.has(job.id) : false;
  const isApplied = job ? appliedIds.has(job.id) : false;

  const handleApply = async () => {
    if (isApplied || applying) return;
    setApplying(true);
    try {
      await api.post(`/applications/${job.id}/apply`);
      setAppliedIds(prev => new Set([...prev, job.id]));
      toast.success('Application submitted! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
    setApplying(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      if (isSaved) {
        await api.delete(`/profile/seeker/saved-jobs/${job.id}`);
        setSavedIds(prev => { const s = new Set(prev); s.delete(job.id); return s; });
        toast.info('Job removed from saved');
      } else {
        await api.post(`/profile/seeker/saved-jobs/${job.id}`);
        setSavedIds(prev => new Set([...prev, job.id]));
        toast.success('Job saved! 🔖');
      }
    } catch {
      toast.error('Failed to update saved jobs');
    }
    setSaving(false);
  };

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Not Disclosed';
    const fmt = (v) => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${v.toLocaleString()}`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  };

  const timeAgo = (d) => {
    const ms = Date.now() - new Date(d).getTime();
    const days = Math.floor(ms / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="page-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div className="loading-spinner"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) return null;

  const skills = typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : (job.skills || []);

  return (
    <DashboardLayout>
      <div className="page-content" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: '1rem' }}>
          <FiArrowLeft size={16} /> Back
        </button>

        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '1.5rem', borderLeft: isApplied ? '4px solid var(--success-color)' : 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{job.title}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '0.25rem' }}>{job.company_name}</p>
              {job.rec_company && job.rec_company !== job.company_name && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Posted by {job.rec_company}</p>
              )}
            </div>
            {job.logo_url ? (
              <img src={job.logo_url} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'contain', background: '#fff', border: '1px solid var(--border-light)' }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 12, background: 'var(--primary-light)', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                {job.company_name?.charAt(0) || '🏢'}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
            {job.experience && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiBriefcase /> {job.experience}</span>}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiDollarSign /> {formatSalary(job.salary_min, job.salary_max)}</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><FiMapPin /> {job.is_remote ? 'Remote' : job.location}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Posted: <span style={{ color: 'var(--text-primary)' }}>{timeAgo(job.created_at)}</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className={`btn btn-secondary ${isSaved ? 'active' : ''}`}
                onClick={handleSave}
                disabled={saving}
              >
                <FiBookmark /> {isSaved ? 'Saved' : 'Save'}
              </button>
              {isApplied ? (
                <button className="btn btn-primary" disabled style={{ opacity: 0.8 }}>
                  <FiCheckCircle /> Applied
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleApply} disabled={applying}>
                  {applying ? 'Applying...' : 'Apply Now'}
                </button>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ padding: '2rem' }}>
          
          {skills.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Job highlights</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {skills.map(s => <span key={s} className="tag tag-blue">{s}</span>)}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Job description</h3>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {job.description}
            </div>
          </div>

          {job.responsibilities && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Key Responsibilities</h3>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {job.responsibilities}
              </div>
            </div>
          )}

          {job.requirements && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Requirements</h3>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {job.requirements}
              </div>
            </div>
          )}

          {job.qualifications && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Qualifications</h3>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {job.qualifications}
              </div>
            </div>
          )}

          {job.benefits && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Benefits</h3>
              <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {job.benefits}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
