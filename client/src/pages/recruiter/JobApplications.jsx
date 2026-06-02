import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilter, FiDownload, FiEye, FiChevronDown, FiRefreshCw, FiClock, FiMapPin, FiEdit, FiTrash2, FiX } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import styles from './JobApplications.module.css';

const STATUSES = ['all', 'pending', 'reviewed', 'shortlisted', 'interview', 'selected', 'rejected'];

function StatusSelect({ appId, currentStatus, onUpdate }) {
  const [value, setValue] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setValue(newStatus);
    setLoading(true);
    try {
      await api.patch(`/applications/${appId}/status`, { status: newStatus });
      onUpdate(appId, newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch {
      setValue(currentStatus);
      toast.error('Failed to update status');
    }
    setLoading(false);
  };

  return (
    <select
      className={`${styles.statusSelect} badge badge-${value}`}
      value={value}
      onChange={handleChange}
      disabled={loading}
    >
      {STATUSES.filter(s => s !== 'all').map(s => (
        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>
  );
}

export default function JobApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);
  const LIMIT = 15;

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      applicationId: interviewModal.id,
      interviewDate: fd.get('date'),
      time: fd.get('time'),
      mode: fd.get('mode'),
      link: fd.get('link'),
      notes: fd.get('notes')
    };

    try {
      if (interviewModal.isEdit) {
        await api.patch(`/recruiter/interviews/${interviewModal.id}`, payload);
        toast.success('Interview updated successfully');
      } else {
        await api.post(`/recruiter/interviews`, payload);
        toast.success('Interview scheduled successfully');
      }
      setInterviewModal(null);
      fetchApplications();
    } catch {
      toast.error('Failed to schedule interview');
    }
  };

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page, limit: LIMIT,
        ...(search && { search }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const { data } = await api.get(`/applications/all?${params}`);
      if (data.success) {
        setApplications(data.applications);
        setTotal(data.total || 0);
      }
    } catch {}
    setLoading(false);
  }, [page, search, statusFilter]);

  useEffect(() => { fetchApplications(); }, [fetchApplications]);

  const updateStatus = (id, status) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const totalPages = Math.ceil(total / LIMIT);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
  const formatSalary = (v) => v ? `₹${(v/100000).toFixed(1)}L` : null;

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Job Applications</h1>
            <p className="section-subtitle">{total} total applications</p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchApplications}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>

        <div className={styles.filters}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
            <FiSearch size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search candidates or jobs..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          <div className={styles.statusTabs}>
            {STATUSES.map(s => (
              <button
                key={s}
                className={`${styles.statusTab} ${statusFilter === s ? styles.activeTab : ''}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />
              ))}
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-title">No applications found</p>
              <p className="empty-state-desc">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Experience</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Resume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app, i) => (
                  <React.Fragment key={app.id}>
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td>
                        <div className={styles.candidateCell}>
                          <div className={styles.candidateAvatar}>
                            {app.avatar_url
                              ? <img src={app.avatar_url} alt="" />
                              : <span>{(app.first_name?.[0] || '?') + (app.last_name?.[0] || '')}</span>
                            }
                          </div>
                          <div>
                            <p className={styles.candidateName}>{app.first_name} {app.last_name}</p>
                            <p className={styles.candidateEmail}>{app.seeker_email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <p className={styles.jobTitle}>{app.job_title}</p>
                        {app.seeker_location && <p className={styles.jobMeta}>📍 {app.seeker_location}</p>}
                      </td>
                      <td>
                        <span className="text-sm text-muted">{app.designation || '—'}</span>
                      </td>
                      <td>
                        <span className="text-sm text-muted">{formatDate(app.applied_at)}</span>
                      </td>
                      <td>
                        <StatusSelect appId={app.id} currentStatus={app.status} onUpdate={updateStatus} />
                      </td>
                      <td>
                        {app.resume_url ? (
                          <a
                            href={app.resume_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary btn-sm"
                          >
                            <FiEye size={13} /> View
                          </a>
                        ) : (
                          <span className="text-muted text-sm">N/A</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                        >
                          <FiChevronDown
                            size={14}
                            style={{ transform: expanded === app.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
                          />
                        </button>
                      </td>
                    </motion.tr>

                    {expanded === app.id && (
                      <tr>
                        <td colSpan={7}>
                          <motion.div
                            className={styles.expandedRow}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <div className={styles.expandedGrid}>
                              <div>
                                <p className={styles.expandedLabel}>Phone</p>
                                <p className={styles.expandedValue}>{app.phone || '—'}</p>
                              </div>
                              <div>
                                <p className={styles.expandedLabel}>Cover Letter</p>
                                <p className={styles.expandedValue}>{app.cover_letter || 'No cover letter provided'}</p>
                              </div>
                              <div style={{ flex: '1 1 100%' }}>
                                <label className={styles.expandedLabel}>Recruiter Notes</label>
                                {(() => {
                                  let parsedNotes = null;
                                  try {
                                    if (app.recruiter_notes && app.recruiter_notes.trim().startsWith('{')) {
                                      parsedNotes = JSON.parse(app.recruiter_notes);
                                    }
                                  } catch (e) {}

                                  if (parsedNotes && typeof parsedNotes === 'object') {
                                    return (
                                      <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-light)', marginTop: '8px' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginBottom: '16px', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px' }}>
                                            {parsedNotes.interviewTime && (
                                              <div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Interview Time</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                                  <FiClock size={14} /> {parsedNotes.interviewTime}
                                                </div>
                                              </div>
                                            )}
                                            <div>
                                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Mode & Link/Location</div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
                                                <FiMapPin size={14} /> {parsedNotes.mode || 'N/A'} - {parsedNotes.link ? (parsedNotes.link.startsWith('http') ? <a href={parsedNotes.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Join Link</a> : parsedNotes.link) : 'Not specified'}
                                              </div>
                                            </div>
                                          </div>
                                          <div style={{ display: 'flex', gap: 8 }}>
                                            <button 
                                              className="btn btn-sm btn-outline" 
                                              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                                              onClick={() => {
                                                let defaultDate = '';
                                                let defaultTime = parsedNotes.interviewTime || '';
                                                if (app.interview_date) {
                                                  const d = new Date(app.interview_date);
                                                  defaultDate = d.toISOString().split('T')[0];
                                                  if (!defaultTime) {
                                                    defaultTime = d.toTimeString().substring(0,5);
                                                  }
                                                }
                                                setInterviewModal({
                                                  ...app,
                                                  isEdit: true,
                                                  defaultDate,
                                                  defaultTime,
                                                  defaultMode: parsedNotes.mode || 'Online',
                                                  defaultLink: parsedNotes.link || '',
                                                  defaultNotes: parsedNotes.notes || ''
                                                });
                                              }}
                                            >
                                              <FiEdit size={14} /> Edit
                                            </button>
                                            <button 
                                              className="btn btn-sm btn-outline" 
                                              style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--error)', borderColor: 'var(--error)' }}
                                              onClick={async () => {
                                                if (window.confirm('Are you sure you want to remove the interview details?')) {
                                                  try {
                                                    await api.delete(`/recruiter/interviews/${app.id}`);
                                                    fetchApplications();
                                                    toast.success('Interview details removed');
                                                  } catch {
                                                    toast.error('Failed to remove interview details');
                                                  }
                                                }
                                              }}
                                            >
                                              <FiTrash2 size={14} /> Delete
                                            </button>
                                          </div>
                                        </div>
                                        <div>
                                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>Additional Notes</div>
                                          <textarea
                                            className="form-input form-textarea"
                                            rows={2}
                                            defaultValue={parsedNotes.notes || ''}
                                            placeholder="Add additional notes..."
                                            onBlur={async (e) => {
                                              try {
                                                const updatedNotes = { ...parsedNotes, notes: e.target.value };
                                                await api.patch(`/applications/${app.id}/status`, {
                                                  status: app.status,
                                                  recruiter_notes: JSON.stringify(updatedNotes),
                                                });
                                              } catch {}
                                            }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  }

                                  return (
                                    <textarea
                                      className="form-input form-textarea"
                                      rows={3}
                                      defaultValue={app.recruiter_notes || ''}
                                      placeholder="Add notes about this candidate..."
                                      style={{ marginTop: '8px' }}
                                      onBlur={async (e) => {
                                        try {
                                          await api.patch(`/applications/${app.id}/status`, {
                                            status: app.status,
                                            recruiter_notes: e.target.value,
                                          });
                                        } catch {}
                                      }}
                                    />
                                  );
                                })()}
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
            <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              );
            })}
            <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
            <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {interviewModal && (
          <div className={styles.modalOverlay} onClick={() => setInterviewModal(null)}>
            <motion.div className={styles.modalContent} onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className={styles.modalHeader}>
                <h3>{interviewModal.isEdit ? 'Edit Interview' : 'Schedule Interview'}</h3>
                <button type="button" className="btn btn-ghost btn-icon" onClick={() => setInterviewModal(null)}><FiX /></button>
              </div>
              <form onSubmit={handleScheduleInterview}>
                <div className={styles.modalBody}>
                  <p style={{ marginBottom: 16 }}>{interviewModal.isEdit ? 'Editing' : 'Scheduling'} interview for <strong>{interviewModal.first_name} {interviewModal.last_name}</strong></p>
                  
                  <div className="form-group">
                    <label className="form-label">Interview Date</label>
                    <input type="date" name="date" defaultValue={interviewModal.defaultDate || ''} className="form-input" required min={new Date().toISOString().split('T')[0]} />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Interview Time</label>
                    <input type="time" name="time" defaultValue={interviewModal.defaultTime || ''} className="form-input" required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Interview Mode</label>
                    <select name="mode" defaultValue={interviewModal.defaultMode || 'Online'} className="form-input" required>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Meeting Link / Location</label>
                    <input type="text" name="link" defaultValue={interviewModal.defaultLink || ''} className="form-input" placeholder="e.g. Zoom link or Office address" required />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea name="notes" defaultValue={interviewModal.defaultNotes || ''} className="form-input form-textarea" rows="3" placeholder="Additional instructions for the candidate..." />
                  </div>
                </div>
                <div className={styles.modalFooter}>
                  <button type="button" className="btn btn-secondary" onClick={() => setInterviewModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{interviewModal.isEdit ? 'Update Interview' : 'Schedule Interview'}</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
