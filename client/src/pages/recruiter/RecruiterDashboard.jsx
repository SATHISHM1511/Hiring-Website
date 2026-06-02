import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiCheckSquare, FiUsers, FiTrendingUp, FiPlus, FiArrowRight, FiEye, FiX } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import styles from './RecruiterDashboard.module.css';

function SkeletonCard() {
  return (
    <div className="stat-card">
      <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 14, width: '80%' }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)' }}>
      <motion.div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-xl)', width: '100%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}
      >
        <div style={{ padding: 'var(--spacing-lg) var(--spacing-xl)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><FiX size={20} /></button>
        </div>
        <div style={{ padding: 'var(--spacing-xl)' }}>
          {children}
        </div>
      </motion.div>
    </div>
  );
}

export default function RecruiterDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [counts, setCounts] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeJobsModal, setActiveJobsModal] = useState(false);
  const [shortlistedModal, setShortlistedModal] = useState(false);
  const [activeJobsData, setActiveJobsData] = useState([]);
  const [shortlistedData, setShortlistedData] = useState([]);
  const [loadingModal, setLoadingModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [analyticsRes, countsRes] = await Promise.all([
          api.get('/analytics/recruiter'),
          api.get('/recruiter/dashboard/counts')
        ]);
        if (analyticsRes.data.success) setStats(analyticsRes.data.stats);
        if (countsRes.data.success) setCounts(countsRes.data.counts);
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const openActiveJobsModal = async () => {
    setActiveJobsModal(true);
    setLoadingModal(true);
    try {
      const { data } = await api.get('/recruiter/dashboard/active-jobs');
      if (data.success) setActiveJobsData(data.activeJobs);
    } catch {}
    setLoadingModal(false);
  };

  const openShortlistedModal = async () => {
    setShortlistedModal(true);
    setLoadingModal(true);
    try {
      const { data } = await api.get('/recruiter/dashboard/shortlisted');
      if (data.success) {
        const grouped = data.candidates.reduce((acc, c) => {
          if (!acc[c.job_role]) acc[c.job_role] = [];
          acc[c.job_role].push(c);
          return acc;
        }, {});
        setShortlistedData(grouped);
      }
    } catch {}
    setLoadingModal(false);
  };

  const statCards = counts ? [
    { label: 'Total Jobs', value: counts.totalJobs, icon: '💼', bg: 'rgba(37,99,235,0.1)', color: 'var(--primary)', onClick: () => navigate('/recruiter/manage-jobs') },
    { label: 'Active Jobs', value: counts.activeJobs, icon: '✅', bg: 'rgba(16,185,129,0.1)', color: 'var(--success)', onClick: openActiveJobsModal },
    { label: 'Applications', value: counts.applications, icon: '📋', bg: 'rgba(124,58,237,0.1)', color: 'var(--secondary)', onClick: () => navigate('/recruiter/applications') },
    { label: 'Shortlisted', value: counts.shortlisted, icon: '⭐', bg: 'rgba(245,158,11,0.1)', color: 'var(--warning)', onClick: openShortlistedModal },
  ] : [];

  return (
    <DashboardLayout>
      <div className="page-content">
        <motion.div
          className={styles.welcomeBar}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className={styles.welcomeTitle}>
              Welcome back, <span className="text-gradient">{profile?.company_name || 'Recruiter'}</span> 👋
            </h1>
            <p className={styles.welcomeSubtitle}>Here's what's happening with your talent pipeline today</p>
          </div>
          <Link to="/recruiter/post-job" className="btn btn-primary">
            <FiPlus size={16} /> Post a Job
          </Link>
        </motion.div>

        <div className="stats-grid">
          {loading
            ? [1,2,3,4].map(i => <SkeletonCard key={i} />)
            : statCards.map((card, i) => (
              <motion.div
                key={i}
                className="stat-card"
                style={{ cursor: 'pointer', transition: 'transform 0.2s', border: '1px solid transparent' }}
                whileHover={{ scale: 1.02, borderColor: card.color, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={card.onClick}
              >
                <div className="stat-icon" style={{ background: card.bg, color: card.color }}>
                  <span style={{ fontSize: '1.4rem' }}>{card.icon}</span>
                </div>
                <div className="stat-info">
                  <div className="stat-value">{card.value || 0}</div>
                  <div className="stat-label">{card.label}</div>
                </div>
              </motion.div>
            ))
          }
        </div>

        <div className={styles.dashboardGrid}>
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="section-header">
              <div>
                <h3 className="section-title">Recent Applications</h3>
                <p className="section-subtitle">Latest candidate activity</p>
              </div>
              <Link to="/recruiter/applications" className="btn btn-secondary btn-sm">
                View All <FiArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => (
                  <div key={i} className={styles.skeletonRow}>
                    <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 6 }} />
                      <div className="skeleton" style={{ height: 12, width: '40%' }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentApplications?.length > 0 ? (
              <div className={styles.appList}>
                {stats.recentApplications.map((app, i) => (
                  <motion.div
                    key={app.id}
                    className={styles.appRow}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <div className={styles.appAvatar}>
                      {app.avatar_url
                        ? <img src={app.avatar_url} alt="" />
                        : <span>{(app.first_name?.[0] || '?') + (app.last_name?.[0] || '')}</span>
                      }
                    </div>
                    <div className={styles.appInfo}>
                      <p className={styles.appName}>{app.first_name} {app.last_name}</p>
                      <p className={styles.appJob}>{app.job_title}</p>
                    </div>
                    <div className={styles.appRight}>
                      <StatusBadge status={app.status} />
                      <span className={styles.appDate}>{new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p className="empty-state-title">No applications yet</p>
                <p className="empty-state-desc">Post a job to start receiving applications</p>
                <Link to="/recruiter/post-job" className="btn btn-primary btn-sm">
                  <FiPlus size={14} /> Post First Job
                </Link>
              </div>
            )}
          </motion.div>

          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className="section-title mb-md">Quick Actions</h3>
            <div className={styles.quickActions}>
              {[
                { icon: '📝', label: 'Post a Job', desc: 'Create a new job listing', to: '/recruiter/post-job', color: 'blue' },
                { icon: '👥', label: 'View Applications', desc: 'Review candidate applications', to: '/recruiter/applications', color: 'purple' },
                { icon: '💼', label: 'Manage Jobs', desc: 'Manage your active job posts', to: '/recruiter/manage-jobs', color: 'orange' },
                { icon: '👤', label: 'Edit Profile', desc: 'Update company information', to: '/recruiter/profile', color: 'green' },
              ].map((action, i) => (
                <Link key={i} to={action.to} className={styles.quickAction}>
                  <span className={styles.qaIcon}>{action.icon}</span>
                  <div className={styles.qaInfo}>
                    <p className={styles.qaLabel}>{action.label}</p>
                    <p className={styles.qaDesc}>{action.desc}</p>
                  </div>
                  <FiArrowRight size={14} className={styles.qaArrow} />
                </Link>
              ))}
            </div>

            {stats?.statusBreakdown?.length > 0 && (
              <div className={styles.statusSection}>
                <h4 className={styles.statusTitle}>Application Breakdown</h4>
                <div className={styles.statusList}>
                  {stats.statusBreakdown.map((s, i) => (
                    <div key={i} className={styles.statusRow}>
                      <StatusBadge status={s.status} />
                      <span className={styles.statusCount}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {stats?.topJobs?.length > 0 && (
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ marginTop: 'var(--spacing-lg)' }}
          >
            <div className="section-header">
              <h3 className="section-title">Top Performing Jobs</h3>
            </div>
            <div className={styles.topJobsGrid}>
              {stats.topJobs.map((job, i) => (
                <div key={i} className={styles.topJobCard}>
                  <div className={styles.topJobRank}>#{i + 1}</div>
                  <div className={styles.topJobInfo}>
                    <p className={styles.topJobTitle}>{job.title}</p>
                    <p className={styles.topJobApps}>{job.applications} applications</p>
                  </div>
                  <div className={styles.topJobBar}>
                    <div
                      className={styles.topJobFill}
                      style={{ width: `${Math.min((job.applications / (stats.topJobs[0]?.applications || 1)) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {activeJobsModal && (
          <Modal title="Most Active Jobs" onClose={() => setActiveJobsModal(false)}>
            {loadingModal ? (
              <div className="skeleton" style={{ height: 200, borderRadius: 12 }} />
            ) : activeJobsData.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                {activeJobsData.map(job => (
                  <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '4px' }}>{job.title}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{job.department} • Posted {new Date(job.created_at).toLocaleDateString()}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{job.applications_count}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Applications</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <div className="empty-state-icon">📉</div>
                <p className="empty-state-title">No active jobs with applications.</p>
              </div>
            )}
          </Modal>
        )}

        {shortlistedModal && (
          <Modal title="Shortlisted Candidates" onClose={() => setShortlistedModal(false)}>
            {loadingModal ? (
              <div className="skeleton" style={{ height: 300, borderRadius: 12 }} />
            ) : Object.keys(shortlistedData).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                {Object.keys(shortlistedData).map(role => (
                  <div key={role}>
                    <h4 style={{ fontWeight: 800, color: 'var(--primary)', borderBottom: '2px solid var(--border-light)', paddingBottom: '8px', marginBottom: '16px' }}>{role}</h4>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {shortlistedData[role].map((c, i) => (
                        <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }} />
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.first_name} {c.last_name}</p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{c.email}</p>
                          </div>
                          <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <p>Shortlisted</p>
                            <p>{new Date(c.shortlisted_date).toLocaleDateString()}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '2rem 0' }}>
                <div className="empty-state-icon">🤷‍♂️</div>
                <p className="empty-state-title">No shortlisted candidates.</p>
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
