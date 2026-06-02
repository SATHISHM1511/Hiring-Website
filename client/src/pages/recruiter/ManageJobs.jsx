import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiEye, FiEdit2, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import styles from './ManageJobs.module.css';

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <motion.div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
      >
        <div className={styles.modalHeader}>
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onCancel}><FiX /></button>
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" style={{ background: 'var(--error)', borderColor: 'var(--error)' }} onClick={onConfirm}>Delete</button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ManageJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/recruiter/manage-jobs');
      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (error) {
      toast.error('Failed to fetch jobs');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const { data } = await api.delete(`/recruiter/jobs/${deletingId}`);
      if (data.success) {
        toast.success('Job deleted successfully');
        setJobs(jobs.filter(j => j.id !== deletingId));
      }
    } catch (error) {
      toast.error('Failed to delete job');
    }
    setDeletingId(null);
  };

  const filteredJobs = useMemo(() => {
    if (!selectedDate) return jobs;
    return jobs.filter(job => {
      const jobDate = new Date(job.created_at);
      const filterDate = new Date(selectedDate);
      return (
        jobDate.getFullYear() === filterDate.getFullYear() &&
        jobDate.getMonth() === filterDate.getMonth() &&
        jobDate.getDate() === filterDate.getDate()
      );
    });
  }, [jobs, selectedDate]);

  const groupedJobs = filteredJobs.reduce((acc, job) => {
    const date = new Date(job.created_at);
    const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[monthYear]) acc[monthYear] = [];
    acc[monthYear].push(job);
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="page-content">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={styles.header}
        >
          <div>
            <h1 className="page-title">Manage Jobs</h1>
            <p className="page-subtitle">View and manage all your job postings</p>
            {!loading && (
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>
                <span>Total Posted Jobs:</span>
                <span style={{ fontSize: '1rem' }}>{filteredJobs.length}</span>
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '4px 12px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
              <input 
                type="date" 
                className="form-input" 
                style={{ padding: '6px', width: 'auto', border: 'none', background: 'transparent' }}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                title="Filter by Date"
              />
              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate('')} 
                  className="btn btn-ghost btn-icon" 
                  style={{ width: 24, height: 24, padding: 0, marginLeft: 4 }}
                  title="Clear Date"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
            <Link to="/recruiter/post-job" className="btn btn-primary">Post a Job</Link>
          </div>
        </motion.div>

        {loading ? (
          <div className="skeleton" style={{ height: 400, borderRadius: 16 }} />
        ) : filteredJobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💼</div>
            <p className="empty-state-title">No jobs found</p>
            <p className="empty-state-desc">Try adjusting your date filters or post a new job.</p>
            <Link to="/recruiter/post-job" className="btn btn-primary">Post a Job</Link>
          </div>
        ) : (
          <div className={styles.jobGroups}>
            {Object.keys(groupedJobs).map((monthYear, i) => (
              <motion.div
                key={monthYear}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={styles.monthGroup}
              >
                <h3 className={styles.monthTitle}>{monthYear}</h3>
                
                <div className={styles.tableWrapper}>
                  <table className={styles.jobTable}>
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Department</th>
                        <th>Type</th>
                        <th>Location</th>
                        <th>Posted Date</th>
                        <th>Applications</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedJobs[monthYear].map((job) => (
                        <tr key={job.id}>
                          <td className={styles.titleCell}>{job.title}</td>
                          <td>{job.company_name}</td>
                          <td style={{ textTransform: 'capitalize' }}>{job.employment_type.replace('-', ' ')}</td>
                          <td>{job.location || 'Remote'}</td>
                          <td>{new Date(job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                          <td><span className={styles.appCount}>{job.applications_count}</span></td>
                          <td>
                            <span className={`badge badge-${job.status}`}>{job.status.charAt(0).toUpperCase() + job.status.slice(1)}</span>
                          </td>
                          <td>
                            <div className={styles.actions}>
                              <Link to={`/recruiter/manage-jobs/${job.id}/candidates`} className="btn btn-ghost btn-icon" title="View Candidates"><FiEye size={16} /></Link>
                              <Link to={`/recruiter/post-job/${job.id}`} className="btn btn-ghost btn-icon" title="Edit Job" style={{ color: 'var(--primary)' }}>
                                <FiEdit2 size={16} />
                              </Link>
                              <button className="btn btn-ghost btn-icon" style={{ color: 'var(--error)' }} title="Delete" onClick={() => setDeletingId(job.id)}>
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {deletingId && (
          <ConfirmModal
            title="Delete Job?"
            message="Are you sure you want to delete this job posting?"
            onConfirm={handleDelete}
            onCancel={() => setDeletingId(null)}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
