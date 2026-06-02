import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiZap } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import styles from './RecommendedJobs.module.css';
import { JobCard } from './SeekerJobs.jsx';

export default function RecommendedJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    Promise.all([
      api.get('/jobs/recommended'),
      api.get('/applications/my'),
      api.get('/profile/seeker/saved-jobs')
    ]).then(([rec, apps, saved]) => {
      if (rec.data?.success) setJobs(rec.data.jobs);
      if (apps.data?.success) setAppliedIds(new Set(apps.data.applications.map(a => a.job_id)));
      if (saved.data?.success) setSavedIds(new Set(saved.data.jobs.map(j => j.id)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleApply = async (jobId) => {
    try {
      await api.post(`/applications/${jobId}/apply`);
      setAppliedIds(prev => new Set([...prev, jobId]));
      toast.success('Application submitted! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to apply');
    }
  };

  const handleSave = async (jobId, isSaved) => {
    try {
      if (isSaved) {
        await api.delete(`/profile/seeker/saved-jobs/${jobId}`);
        setSavedIds(prev => { const s = new Set(prev); s.delete(jobId); return s; });
        toast.info('Job removed from saved');
      } else {
        await api.post(`/profile/seeker/saved-jobs/${jobId}`);
        setSavedIds(prev => new Set([...prev, jobId]));
        toast.success('Job saved! 🔖');
      }
    } catch {
      toast.error('Failed to update saved jobs');
    }
  };

  const getMatchScore = (job) => {
    const base = 60 + ((job.id * 13) % 38);
    return base;
  };

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Recommended Jobs</h1>
            <p className="section-subtitle">AI-matched opportunities based on your profile and skills</p>
          </div>
        </div>

        <div className={styles.aiNote}>
          <FiZap size={18} />
          <p>Our AI analyzes your skills, experience, and preferences to surface the most relevant jobs for you.</p>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card">
                <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 16 }} />
                <div className="skeleton" style={{ height: 8, borderRadius: 20 }} />
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🤖</div>
            <p className="empty-state-title">Building recommendations</p>
            <p className="empty-state-desc">Complete your profile and add skills to get AI-powered job recommendations</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {jobs.map((job, i) => {
              const matchScore = getMatchScore(job);

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{ height: '100%' }}
                >
                  <JobCard
                    job={job}
                    onApply={handleApply}
                    onSave={handleSave}
                    appliedIds={appliedIds}
                    savedIds={savedIds}
                    matchScore={matchScore}
                  />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
