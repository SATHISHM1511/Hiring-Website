import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBriefcase, FiCheckCircle, FiStar, FiBookmark, FiArrowRight, FiUser, FiX } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import styles from './SeekerDashboard.module.css';
import modalStyles from './SeekerDashboardModal.module.css';

export default function SeekerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [dashboardCounts, setDashboardCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [activeModal, setActiveModal] = useState(null);
  const [modalData, setModalData] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    api.get('/analytics/seeker').then(({ data }) => {
      if (data.success) setStats(data.stats);
      setLoading(false);
    }).catch(() => setLoading(false));

    api.get('/seeker/dashboard/counts').then(({ data }) => {
      if (data.success) setDashboardCounts(data.counts);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModal) setActiveModal(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModal]);

  const handleCardClick = async (type) => {
    if (type === 'Saved Jobs') {
      navigate('/seeker/saved');
      return;
    }
    
    const modalTypes = { 'Applications': 'applications', 'Shortlisted': 'shortlisted', 'Interviews': 'interviews' };
    const modalKey = modalTypes[type];
    
    if (modalKey) {
      setActiveModal(modalKey);
      setModalLoading(true);
      try {
        const { data } = await api.get(`/seeker/dashboard/${modalKey}`);
        if (data.success) setModalData(data[modalKey] || []);
      } catch (error) {
        console.error(`Error fetching ${modalKey}:`, error);
        setModalData([]);
      }
      setModalLoading(false);
    }
  };

  const name = profile ? `${profile.first_name} ${profile.last_name}` : 'there';
  const completion = stats?.profileCompletion || profile?.profile_completion || 0;

  const statCards = [
    { label: 'Applications', value: dashboardCounts?.applications ?? stats?.totalApplications ?? 0, icon: '📋', color: 'rgba(37,99,235,0.1)', iconColor: 'var(--primary)' },
    { label: 'Shortlisted', value: dashboardCounts?.shortlisted ?? stats?.shortlisted ?? 0, icon: '⭐', color: 'rgba(124,58,237,0.1)', iconColor: 'var(--secondary)' },
    { label: 'Interviews', value: dashboardCounts?.interviews ?? stats?.interviews ?? 0, icon: '📅', color: 'rgba(6,182,212,0.1)', iconColor: 'var(--accent)' },
    { label: 'Saved Jobs', value: dashboardCounts?.savedJobs ?? stats?.savedJobs ?? 0, icon: '🔖', color: 'rgba(16,185,129,0.1)', iconColor: 'var(--success)' },
  ];

  return (
    <DashboardLayout>
      <div className="page-content">
        <motion.div
          className={styles.welcomeCard}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.welcomeLeft}>
            <div className={styles.welcomeAvatar}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" />
              ) : (
                <span>{name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <h1 className={styles.welcomeTitle}>
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, <span className="text-gradient">{name}</span>! 👋
              </h1>
              <p className={styles.welcomeSub}>Your career journey continues — let's find something amazing today!</p>
            </div>
          </div>

          <div className={styles.completionWidget}>
            <div className={styles.completionCircle}>
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--border-light)" strokeWidth="2.5" />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="url(#grad)"
                  strokeWidth="2.5"
                  strokeDasharray={`${completion} ${100 - completion}`}
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </svg>
              <div className={styles.completionText}>
                <span>{completion}%</span>
              </div>
            </div>
            <div>
              <p className={styles.completionLabel}>Profile Complete</p>
              <Link to="/seeker/profile" className={styles.completionLink}>
                Improve Profile <FiArrowRight size={12} />
              </Link>
            </div>
          </div>
        </motion.div>

        <div className="stats-grid">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              className="stat-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => handleCardClick(card.label)}
              style={{ cursor: 'pointer' }}
            >
              <div className="stat-icon" style={{ background: card.color, color: card.iconColor }}>
                <span style={{ fontSize: '1.4rem' }}>{card.icon}</span>
              </div>
              <div className="stat-info">
                <div className="stat-value">{loading ? '—' : card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className={styles.contentGrid}>
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="section-header">
              <div>
                <h3 className="section-title">Recent Applications</h3>
                <p className="section-subtitle">Track your application status</p>
              </div>
              <Link to="/seeker/applied" className="btn btn-secondary btn-sm">
                View All <FiArrowRight size={14} />
              </Link>
            </div>

            {!stats?.recentApplications?.length ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-title">No applications yet</p>
                <p className="empty-state-desc">Start exploring jobs and apply today!</p>
                <Link to="/seeker/jobs" className="btn btn-primary btn-sm">
                  <FiBriefcase size={14} /> Browse Jobs
                </Link>
              </div>
            ) : (
              <div className={styles.appList}>
                {stats.recentApplications.map((app, i) => (
                  <motion.div
                    key={app.id}
                    className={styles.appItem}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                  >
                    <div className={styles.appLogo}>
                      {app.logo_url ? <img src={app.logo_url} alt="" /> : <span>🏢</span>}
                    </div>
                    <div className={styles.appInfo}>
                      <p className={styles.appTitle}>{app.job_title}</p>
                      <p className={styles.appCompany}>{app.company_name}</p>
                    </div>
                    <div className={styles.appRight}>
                      <span className={`badge badge-${app.status}`}>{app.status}</span>
                      <span className={styles.appDate}>{new Date(app.applied_at).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          <div className={styles.sidebar}>
            <motion.div
              className="card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className="section-title mb-md">Quick Actions</h3>
              <div className={styles.quickActions}>
                {[
                  { icon: '🔍', label: 'Browse Jobs', to: '/seeker/jobs' },
                  { icon: '⭐', label: 'Recommended', to: '/seeker/recommended' },
                  { icon: '🔖', label: 'Saved Jobs', to: '/seeker/saved' },
                  { icon: '👤', label: 'Edit Profile', to: '/seeker/profile' },
                ].map((a, i) => (
                  <Link key={i} to={a.to} className={styles.quickLink}>
                    <span>{a.icon}</span>
                    <span>{a.label}</span>
                    <FiArrowRight size={14} className={styles.qaArrow} />
                  </Link>
                ))}
              </div>
            </motion.div>

            {stats?.statusBreakdown?.length > 0 && (
              <motion.div
                className="card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="section-title mb-md">Application Status</h3>
                <div className={styles.statusList}>
                  {stats.statusBreakdown.map((s, i) => (
                    <div key={i} className={styles.statusRow}>
                      <span className={`badge badge-${s.status}`}>{s.status}</span>
                      <div className={styles.statusBar}>
                        <div
                          className={styles.statusFill}
                          style={{
                            width: `${(s.count / stats.totalApplications) * 100}%`,
                            background: 'var(--gradient-primary)',
                          }}
                        />
                      </div>
                      <span className={styles.statusCount}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeModal && (
          <motion.div 
            className={modalStyles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveModal(null)}
          >
            <motion.div 
              className={modalStyles.modalContent}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className={modalStyles.modalHeader}>
                <h2 className={modalStyles.modalTitle}>
                  {activeModal === 'applications' ? 'My Applications' : activeModal === 'shortlisted' ? 'Shortlisted Jobs' : 'Interview Schedule'}
                </h2>
                <button className={modalStyles.closeButton} onClick={() => setActiveModal(null)}>
                  <FiX size={24} />
                </button>
              </div>
              
              <div className={modalStyles.modalBody}>
                {modalLoading ? (
                  <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
                ) : modalData.length === 0 ? (
                  <div className="empty-state" style={{ padding: '2rem' }}>
                    <p className="empty-state-title">
                      {activeModal === 'applications' ? 'No applications found.' : activeModal === 'shortlisted' ? 'No shortlisted jobs available.' : 'No interviews scheduled.'}
                    </p>
                  </div>
                ) : (
                  <div className={modalStyles.modalList}>
                    {modalData.map((item, i) => (
                      <div key={i} className={modalStyles.modalCard}>
                        <div className={modalStyles.modalCardTitle}>{item.job_title}</div>
                        <div className={modalStyles.modalCardSubtitle}>{item.company_name}</div>
                        
                        <div className={modalStyles.modalCardDetails}>
                          {activeModal === 'applications' && (
                            <>
                              <div><strong>Location:</strong> {item.location}</div>
                              <div><strong>Type:</strong> {item.employment_type}</div>
                              <div><strong>Applied:</strong> {new Date(item.applied_at).toLocaleDateString()}</div>
                              <div><strong>Status:</strong> <span className={`badge badge-${item.status}`}>{item.status}</span></div>
                            </>
                          )}
                          {activeModal === 'shortlisted' && (
                            <>
                              <div><strong>Date:</strong> {new Date(item.shortlisted_date).toLocaleDateString()}</div>
                              <div><strong>Recruiter:</strong> {item.recruiter_name || 'N/A'}</div>
                            </>
                          )}
                          {activeModal === 'interviews' && (
                            <>
                              <div><strong>Date:</strong> {item.date}</div>
                              <div><strong>Time:</strong> {item.time}</div>
                              <div><strong>Mode:</strong> {item.mode}</div>
                              <div><strong>Status:</strong> <span className={`badge badge-${item.status}`}>{item.status}</span></div>
                              {item.link && (
                                <div style={{ gridColumn: 'span 2', marginTop: 4 }}>
                                  <strong>Link:</strong> <a href={item.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>{item.link}</a>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
