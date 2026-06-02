import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiMapPin, FiBriefcase, FiClock, FiCheckCircle, FiAlertCircle, FiCalendar, FiAlignLeft } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../services/api.js';
import { useSocket } from '../../contexts/SocketContext.jsx';
import styles from './AppliedJobs.module.css';

const STATUS_CONFIG = {
  pending: { color: 'var(--warning)', icon: '⏳', label: 'Pending Review' },
  reviewed: { color: 'var(--accent)', icon: '👁️', label: 'Under Review' },
  shortlisted: { color: 'var(--secondary)', icon: '⭐', label: 'Shortlisted' },
  interview: { color: '#F97316', icon: '📅', label: 'Interview Scheduled' },
  selected: { color: 'var(--success)', icon: '🎊', label: 'Selected!' },
  rejected: { color: 'var(--error)', icon: '❌', label: 'Not Selected' },
};

const STATUS_ORDER = ['pending', 'reviewed', 'shortlisted', 'interview', 'selected'];

export default function AppliedJobs() {
  const { socket } = useSocket();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/applications/my').then(({ data }) => {
      if (data.success) setApplications(data.applications);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleInterviewUpdated = (payload) => {
      setApplications(prev => prev.map(app => {
        if (app.id === payload.applicationId) {
          return {
            ...app,
            status: payload.status || app.status,
            interview_date: payload.interview_date,
            recruiter_notes: payload.recruiter_notes
          };
        }
        return app;
      }));
    };
    socket.on('interview_updated', handleInterviewUpdated);
    return () => socket.off('interview_updated', handleInterviewUpdated);
  }, [socket]);

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Applied Jobs</h1>
            <p className="section-subtitle">{applications.length} total applications</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3].map(i => (
              <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p className="empty-state-title">No applications yet</p>
            <p className="empty-state-desc">Browse jobs and apply to get started on your journey</p>
          </div>
        ) : (
          <div className={styles.appList}>
            {applications.map((app, i) => {
              const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const currentStep = STATUS_ORDER.indexOf(app.status);

              return (
                <motion.div
                  key={app.id}
                  className={styles.appCard}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.companyLogo}>
                      {app.logo_url ? <img src={app.logo_url} alt="" /> : <span>🏢</span>}
                    </div>
                    <div className={styles.jobInfo}>
                      <h3 className={styles.jobTitle}>{app.job_title}</h3>
                      <p className={styles.companyName}>{app.company_name}</p>
                      <div className={styles.jobMeta}>
                        {app.location && <span><FiMapPin size={12} /> {app.location}</span>}
                        {app.employment_type && <span><FiBriefcase size={12} /> {app.employment_type}</span>}
                        <span><FiClock size={12} /> Applied {new Date(app.applied_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className={styles.statusBadge} style={{ background: config.color + '20', color: config.color }}>
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </div>
                  </div>

                  {app.status !== 'rejected' && (
                    <div className={styles.timeline}>
                      {STATUS_ORDER.map((step, si) => {
                        const stepConfig = STATUS_CONFIG[step];
                        const done = si <= currentStep;
                        const active = si === currentStep;
                        return (
                          <div key={step} className={styles.timelineStep}>
                            <div className={`${styles.timelineDot} ${done ? styles.dotDone : ''} ${active ? styles.dotActive : ''}`}>
                              {done && si < currentStep ? '✓' : si + 1}
                            </div>
                            <span className={`${styles.timelineLabel} ${done ? styles.labelDone : ''}`}>
                              {step.charAt(0).toUpperCase() + step.slice(1)}
                            </span>
                            {si < STATUS_ORDER.length - 1 && (
                              <div className={`${styles.timelineLine} ${done && si < currentStep ? styles.lineDone : ''}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {app.status === 'interview' && (
                    <div className={styles.interviewAlert}>
                      <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6, color: '#F97316' }}>
                        <FiCalendar /> Interview Details
                      </h4>
                      {(() => {
                        let notes = {};
                        try { notes = JSON.parse(app.recruiter_notes || '{}'); } catch(e) {}
                        return (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', marginTop: '12px' }}>
                            <div>
                              <div style={{ fontSize: 12, opacity: 0.8 }}>Date & Time</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500, marginTop: 4 }}>
                                <FiClock size={14} /> 
                                {app.interview_date ? new Date(app.interview_date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not specified'}
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: 12, opacity: 0.8 }}>Mode & Link/Location</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500, marginTop: 4 }}>
                                <FiMapPin size={14} />
                                {notes.mode || 'N/A'} - {notes.link ? (notes.link.startsWith('http') ? <a href={notes.link} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Join Link</a> : notes.link) : 'Not specified'}
                              </div>
                            </div>
                            {notes.notes && (
                              <div>
                                <div style={{ fontSize: 12, opacity: 0.8 }}>Notes</div>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 14, marginTop: 4 }}>
                                  <FiAlignLeft size={14} style={{ marginTop: 2 }} />
                                  <span style={{ whiteSpace: 'pre-wrap' }}>{notes.notes}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
