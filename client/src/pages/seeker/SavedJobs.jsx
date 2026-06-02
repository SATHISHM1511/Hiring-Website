import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTrash2, FiMapPin, FiBriefcase, FiBookmark } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

export default function SavedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState(new Set());

  useEffect(() => {
    Promise.all([
      api.get('/profile/seeker/saved-jobs'),
      api.get('/applications/my'),
    ]).then(([saved, apps]) => {
      if (saved.data.success) setJobs(saved.data.jobs);
      if (apps.data.success) setAppliedIds(new Set(apps.data.applications.map(a => a.job_id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleUnsave = async (jobId) => {
    try {
      await api.delete(`/profile/seeker/saved-jobs/${jobId}`);
      setJobs(prev => prev.filter(j => j.id !== jobId));
      toast.info('Job removed from saved');
    } catch { toast.error('Failed to remove job'); }
  };

  const handleApply = async (jobId) => {
    try {
      await api.post(`/applications/${jobId}/apply`);
      setAppliedIds(prev => new Set([...prev, jobId]));
      toast.success('Application submitted! 🎉');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to apply'); }
  };

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Saved Jobs</h1>
            <p className="section-subtitle">{jobs.length} jobs saved</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 16 }} />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FiBookmark size={48} style={{ opacity: 0.3 }} /></div>
            <p className="empty-state-title">No saved jobs</p>
            <p className="empty-state-desc">Bookmark jobs you're interested in to apply later</p>
            <Link to="/seeker/jobs" className="btn btn-primary btn-sm">Browse Jobs</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 'var(--spacing-lg)' }}>
            {jobs.map((job, i) => {
              const isApplied = appliedIds.has(job.id);
              const skills = typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : (job.skills || []);
              return (
                <motion.div
                  key={job.id}
                  className="card card-hover"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                      {job.logo_url ? <img src={job.logo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : '🏢'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{job.title}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{job.company_name}</p>
                    </div>
                    <button
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: 6 }}
                      onClick={() => handleUnsave(job.id)}
                      title="Remove from saved"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                    {job.location && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}><FiMapPin size={12} /> {job.location}</span>}
                    {job.employment_type && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}><FiBriefcase size={12} /> {job.employment_type}</span>}
                  </div>
                  {skills.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                      {skills.slice(0, 3).map(s => <span key={s} className="tag" style={{ fontSize: '0.75rem' }}>{s}</span>)}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      className={`btn btn-sm btn-full ${isApplied ? 'btn-secondary' : 'btn-primary'}`}
                      onClick={() => !isApplied && handleApply(job.id)}
                      disabled={isApplied}
                    >
                      {isApplied ? '✓ Applied' : 'Apply Now'}
                    </button>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 8 }}>
                    Saved {new Date(job.saved_at).toLocaleDateString()}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
