import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiArrowLeft, FiEye, FiMoreVertical, FiCalendar, FiUser, FiCheckCircle, FiXCircle, FiMessageSquare, FiX, FiEdit, FiTrash2, FiClock, FiMapPin, FiAlignLeft } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import { useSocket } from '../../contexts/SocketContext.jsx';
import styles from './JobCandidates.module.css';

const STATUSES = ['all', 'pending', 'reviewed', 'shortlisted', 'interview', 'selected', 'rejected'];

function StatusSelect({ appId, currentStatus, onUpdate }) {
  const [value, setValue] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(currentStatus);
  }, [currentStatus]);

  const handleChange = async (e) => {
    const newStatus = e.target.value;
    setValue(newStatus);
    setLoading(true);
    try {
      await api.patch(`/recruiter/candidates/${appId}/status`, { status: newStatus });
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

function ActionDropdown({ onAction, candidate }) {
  const [open, setOpen] = useState(false);
  const [direction, setDirection] = useState('down');
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!open && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow < 250 && spaceAbove > spaceBelow) {
        setDirection('up');
      } else {
        setDirection('down');
      }
    }
    setOpen(!open);
  };

  const handle = (action) => {
    setOpen(false);
    onAction(action, candidate);
  };

  return (
    <div className={styles.dropdownContainer} ref={ref}>
      <button className="btn btn-ghost btn-icon" onClick={handleToggle}>
        <FiMoreVertical size={16} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div 
            className={styles.dropdownMenu}
            style={direction === 'up' ? { bottom: '100%', top: 'auto', marginBottom: '4px' } : { top: '100%', bottom: 'auto', marginTop: '4px' }}
            initial={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: direction === 'up' ? 10 : -10 }}
            transition={{ duration: 0.15 }}
          >
            <button className={styles.dropdownItem} onClick={() => handle('profile')}>
              <FiUser size={14} /> View Profile
            </button>
            <button className={styles.dropdownItem} onClick={() => handle('shortlist')}>
              <FiCheckCircle size={14} /> Shortlist
            </button>
            <button className={styles.dropdownItem} onClick={() => handle('interview')}>
              <FiCalendar size={14} /> Schedule Interview
            </button>
            <button className={styles.dropdownItem} onClick={() => handle('hire')}>
              <FiCheckCircle size={14} color="var(--success)" /> Hire Candidate
            </button>
            <button className={styles.dropdownItem} onClick={() => handle('reject')}>
              <FiXCircle size={14} color="var(--error)" /> Reject
            </button>
            <button className={styles.dropdownItem} onClick={() => handle('message')}>
              <FiMessageSquare size={14} /> Send Message
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function JobCandidates() {
  const { jobId } = useParams();
  const { socket } = useSocket();
  const [candidates, setCandidates] = useState([]);
  const [jobTitle, setJobTitle] = useState('');
  const [counts, setCounts] = useState({ total: 0, reviewed: 0, shortlisted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [profileDrawer, setProfileDrawer] = useState(null);
  const [interviewModal, setInterviewModal] = useState(null);

  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/recruiter/jobs/${jobId}/candidates`);
      if (data.success) {
        setCandidates(data.candidates);
        setJobTitle(data.jobTitle);
        setCounts(data.counts);
      }
    } catch (err) {
      toast.error('Failed to load candidates. You might not have access.');
    }
    setLoading(false);
  }, [jobId]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  useEffect(() => {
    if (!socket) return;
    const handleInterviewUpdated = (payload) => {
      setCandidates(prev => prev.map(c => {
        if (c.application_id === payload.applicationId) {
          return {
            ...c,
            status: payload.status || c.status,
            interview_date: payload.interview_date,
            recruiter_notes: payload.recruiter_notes
          };
        }
        return c;
      }));
    };
    socket.on('interview_updated', handleInterviewUpdated);
    return () => socket.off('interview_updated', handleInterviewUpdated);
  }, [socket]);

  const updateStatus = (appId, status) => {
    setCandidates(prev => prev.map(c => c.application_id === appId ? { ...c, status } : c));
    fetchCandidates();
  };

  const handleAction = async (action, candidate) => {
    if (action === 'profile') {
      try {
        const { data } = await api.get(`/recruiter/candidates/${candidate.seeker_id}/profile`);
        if (data.success) {
          setProfileDrawer(data.profile);
        }
      } catch {
        toast.error('Failed to load profile');
      }
    } else if (action === 'shortlist') {
      await updateStatusAPI(candidate.application_id, 'shortlisted');
    } else if (action === 'hire') {
      if (window.confirm(`Are you sure you want to hire ${candidate.first_name}?`)) {
        await updateStatusAPI(candidate.application_id, 'selected');
      }
    } else if (action === 'reject') {
      if (window.confirm(`Are you sure you want to reject ${candidate.first_name}?`)) {
        await updateStatusAPI(candidate.application_id, 'rejected');
      }
    } else if (action === 'interview') {
      setInterviewModal(candidate);
    } else if (action === 'message') {
      toast.info('Messaging feature coming soon!');
    }
  };

  const updateStatusAPI = async (appId, status) => {
    try {
      await api.patch(`/recruiter/candidates/${appId}/status`, { status });
      updateStatus(appId, status);
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      applicationId: interviewModal.application_id,
      interviewDate: fd.get('date'),
      time: fd.get('time'),
      mode: fd.get('mode'),
      link: fd.get('link'),
      notes: fd.get('notes')
    };

    try {
      if (interviewModal.isEdit) {
        await api.patch(`/recruiter/interviews/${interviewModal.application_id}`, payload);
        toast.success('Interview updated successfully');
      } else {
        await api.post(`/recruiter/interviews`, payload);
        toast.success('Interview scheduled successfully');
      }
      setInterviewModal(null);
      fetchCandidates(); // Refresh list to show status change
    } catch {
      toast.error('Failed to schedule interview');
    }
  };

  const handleDeleteInterview = async (candidate) => {
    if (!window.confirm(`Are you sure you want to cancel the interview for ${candidate.first_name}?`)) return;
    try {
      await api.delete(`/recruiter/interviews/${candidate.application_id}`);
      toast.success('Interview cancelled successfully');
      fetchCandidates();
    } catch {
      toast.error('Failed to cancel interview');
    }
  };

  const handleEditInterview = (candidate) => {
    let parsedNotes = {};
    try {
      parsedNotes = JSON.parse(candidate.recruiter_notes || '{}');
    } catch (e) {}
    
    let defaultDate = '';
    let defaultTime = parsedNotes.interviewTime || '';
    if (candidate.interview_date) {
      const d = new Date(candidate.interview_date);
      defaultDate = d.toISOString().split('T')[0];
      if (!defaultTime) {
        defaultTime = d.toTimeString().substring(0,5);
      }
    }

    setInterviewModal({
      ...candidate,
      isEdit: true,
      defaultDate,
      defaultTime,
      defaultMode: parsedNotes.mode || 'Online',
      defaultLink: parsedNotes.link || '',
      defaultNotes: parsedNotes.notes || ''
    });
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  const filteredCandidates = candidates.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const searchLower = search.toLowerCase();
    const matchSearch = search === '' || 
      `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower);
    return matchStatus && matchSearch;
  });

  return (
    <DashboardLayout>
      <div className="page-content">
        <Link to="/recruiter/manage-jobs" className="btn btn-ghost btn-sm" style={{ marginBottom: 20 }}>
          <FiArrowLeft /> Back to Manage Jobs
        </Link>

        <div className="section-header">
          <div>
            <h1 className="section-title">{jobTitle || 'Job Candidates'}</h1>
            <p className="section-subtitle">Candidates Applied For This Position</p>
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>{counts.total}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Apps</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--info)' }}>{counts.reviewed}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reviewed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{counts.shortlisted}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shortlisted</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error)' }}>{counts.rejected}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rejected</div>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          <div className="search-bar" style={{ flex: 1, maxWidth: 360 }}>
            <FiSearch size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search by candidate name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.statusTabs}>
            {STATUSES.map(s => (
              <button
                key={s}
                className={`${styles.statusTab} ${statusFilter === s ? styles.activeTab : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <p className="empty-state-title">No candidates have applied for this job yet.</p>
              <p className="empty-state-desc">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Experience</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                  <th>Resume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((c, i) => (
                  <React.Fragment key={c.application_id}>
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td>
                      <div className={styles.candidateCell}>
                        <div className={styles.candidateAvatar}>
                          {c.avatar_url ? <img src={c.avatar_url} alt="" /> : <span>{c.first_name?.[0]}{c.last_name?.[0]}</span>}
                        </div>
                        <div>
                          <p className={styles.candidateName}>{c.first_name} {c.last_name}</p>
                          <p className={styles.candidateEmail}>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <p className={styles.jobTitle}>{c.job_title}</p>
                      {c.seeker_location && <p className={styles.jobMeta}>📍 {c.seeker_location}</p>}
                    </td>
                    <td>
                      <span className="text-sm text-muted">{c.experience}</span>
                    </td>
                    <td>
                      <span className="text-sm text-muted">{formatDate(c.applied_at)}</span>
                    </td>
                    <td>
                      <StatusSelect appId={c.application_id} currentStatus={c.status} onUpdate={updateStatus} />
                    </td>
                    <td>
                      {c.resume_url ? (
                        <a href={c.resume_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                          <FiEye size={13} /> View
                        </a>
                      ) : (
                        <span className="text-muted text-sm">N/A</span>
                      )}
                    </td>
                    <td>
                      <ActionDropdown onAction={handleAction} candidate={c} />
                    </td>
                  </motion.tr>
                  {c.status === 'interview' && (
                    <motion.tr key={`interview-${c.application_id}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <td colSpan={6} style={{ padding: 0, borderBottom: '1px solid var(--border-light)' }}>
                        <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderLeft: '4px solid #F97316' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: 6, color: '#F97316' }}>
                                <FiCalendar /> Interview Details
                              </h4>
                              {(() => {
                                let notes = {};
                                try { notes = JSON.parse(c.recruiter_notes || '{}'); } catch(e) {}
                                return (
                                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '48px', marginTop: 12 }}>
                                    <div>
                                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Date & Time</div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                                        <FiClock size={14} /> 
                                        {c.interview_date ? new Date(c.interview_date).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : 'Not specified'}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mode & Link/Location</div>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 500 }}>
                                        <FiMapPin size={14} />
                                        {notes.mode || 'N/A'} - {notes.link ? (notes.link.startsWith('http') ? <a href={notes.link} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>Join Link</a> : notes.link) : 'Not specified'}
                                      </div>
                                    </div>
                                    {notes.notes && (
                                      <div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Notes</div>
                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, fontSize: 14 }}>
                                          <FiAlignLeft size={14} style={{ marginTop: 2 }} />
                                          <span style={{ whiteSpace: 'pre-wrap' }}>{notes.notes}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleEditInterview(c)} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <FiEdit size={14} /> Edit
                              </button>
                              <button onClick={() => handleDeleteInterview(c)} className="btn btn-sm btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--error)', borderColor: 'var(--error)' }}>
                                <FiTrash2 size={14} /> Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </motion.tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AnimatePresence>
        {profileDrawer && (
          <div className={styles.modalOverlay} onClick={() => setProfileDrawer(null)}>
            <motion.div className={styles.modalContent} style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className={styles.modalHeader}>
                <h3>Candidate Profile</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setProfileDrawer(null)}><FiX size={20} /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.candidateCell} style={{ marginBottom: 16 }}>
                  <div className={styles.candidateAvatar} style={{ width: 64, height: 64, fontSize: '1.5rem' }}>
                    {profileDrawer.avatar_url ? <img src={profileDrawer.avatar_url} alt="" /> : <span>{profileDrawer.first_name?.[0]}{profileDrawer.last_name?.[0]}</span>}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{profileDrawer.first_name} {profileDrawer.last_name}</h2>
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>{profileDrawer.designation || 'Candidate'}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                      {profileDrawer.resume_url && (
                        <a href={profileDrawer.resume_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline">
                          View Resume
                        </a>
                      )}
                      {profileDrawer.resume_updated_at && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Resume updated: {new Date(profileDrawer.resume_updated_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  {profileDrawer.updated_at && (
                    <div style={{ marginLeft: 'auto', alignSelf: 'flex-start', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '4px 10px', borderRadius: 12 }}>
                      Profile updated: {new Date(profileDrawer.updated_at).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {profileDrawer.bio && (
                  <div className={styles.profileSection}>
                    <h4>About</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.5, marginTop: 0 }}>{profileDrawer.bio}</p>
                  </div>
                )}

                <div className={styles.profileSection}>
                  <h4>Contact Info</h4>
                  <div className={styles.detailRow}><div className={styles.detailLabel}>Email</div><div className={styles.detailValue}>{profileDrawer.email}</div></div>
                  <div className={styles.detailRow}><div className={styles.detailLabel}>Phone</div><div className={styles.detailValue}>{profileDrawer.phone || 'N/A'}</div></div>
                  <div className={styles.detailRow}><div className={styles.detailLabel}>Location</div><div className={styles.detailValue}>{profileDrawer.location || 'N/A'}</div></div>
                </div>

                {(profileDrawer.linkedin_url || profileDrawer.github_url || profileDrawer.portfolio_url || profileDrawer.behance_url || profileDrawer.dribbble_url) && (
                  <div className={styles.profileSection}>
                    <h4>Social & Links</h4>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {profileDrawer.linkedin_url && <a href={profileDrawer.linkedin_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">LinkedIn</a>}
                      {profileDrawer.github_url && <a href={profileDrawer.github_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">GitHub</a>}
                      {profileDrawer.portfolio_url && <a href={profileDrawer.portfolio_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">Portfolio</a>}
                      {profileDrawer.behance_url && <a href={profileDrawer.behance_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">Behance</a>}
                      {profileDrawer.dribbble_url && <a href={profileDrawer.dribbble_url} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">Dribbble</a>}
                    </div>
                  </div>
                )}

                <div className={styles.profileSection}>
                  <h4>Skills</h4>
                  <div className={styles.skillsList}>
                    {profileDrawer.skills?.length > 0 ? profileDrawer.skills.map(s => (
                      <span key={s} className={styles.skillTag}>{s}</span>
                    )) : <span className="text-muted text-sm">No skills listed</span>}
                  </div>
                </div>

                <div className={styles.profileSection}>
                  <h4>Experience</h4>
                  {profileDrawer.experience?.length > 0 ? profileDrawer.experience.map(exp => (
                    <div key={exp.id} className={styles.experienceItem}>
                      <div className={styles.expRole}>{exp.role}</div>
                      <div className={styles.expCompany}>{exp.company}</div>
                      <div className={styles.expDate}>{formatDate(exp.start_date)} - {exp.is_current ? 'Present' : formatDate(exp.end_date)}</div>
                    </div>
                  )) : <span className="text-muted text-sm">No experience listed</span>}
                </div>

                <div className={styles.profileSection}>
                  <h4>Education</h4>
                  {profileDrawer.education?.length > 0 ? profileDrawer.education.map(edu => (
                    <div key={edu.id} className={styles.experienceItem}>
                      <div className={styles.expRole}>{edu.degree}</div>
                      <div className={styles.expCompany}>{edu.college}</div>
                      <div className={styles.expDate}>{edu.start_year} - {edu.is_current ? 'Present' : edu.end_year}</div>
                    </div>
                  )) : <span className="text-muted text-sm">No education listed</span>}
                </div>

                <div className={styles.profileSection}>
                  <h4>Projects</h4>
                  {profileDrawer.projects?.length > 0 ? profileDrawer.projects.map(proj => (
                    <div key={proj.id} className={styles.experienceItem}>
                      <div className={styles.expRole}>{proj.name}</div>
                      {proj.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4, marginBottom: 8 }}>{proj.description}</p>}
                      {proj.technologies && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          {(() => {
                            let techs = proj.technologies;
                            if (typeof techs === 'string') {
                              try { techs = JSON.parse(techs); } catch(e) { techs = [techs]; }
                            }
                            if (Array.isArray(techs)) {
                              return techs.map(t => <span key={t} className={styles.skillTag} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{t}</span>);
                            }
                            return null;
                          })()}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 12 }}>
                        {proj.live_url && <a href={proj.live_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>Live Link</a>}
                        {proj.github_url && <a href={proj.github_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>GitHub</a>}
                      </div>
                    </div>
                  )) : <span className="text-muted text-sm">No projects listed</span>}
                </div>

                <div className={styles.profileSection}>
                  <h4>Certifications</h4>
                  {profileDrawer.certifications?.length > 0 ? profileDrawer.certifications.map(cert => (
                    <div key={cert.id} className={styles.experienceItem}>
                      <div className={styles.expRole}>{cert.name}</div>
                      <div className={styles.expCompany}>{cert.issuer}</div>
                      <div className={styles.expDate}>
                        {formatDate(cert.issue_date)} 
                        {cert.expiry_date ? ` - ${formatDate(cert.expiry_date)}` : ' (No Expiration)'}
                      </div>
                      {cert.credential_url && (
                        <a href={cert.credential_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500, display: 'inline-block', marginTop: 4 }}>
                          View Credential
                        </a>
                      )}
                    </div>
                  )) : <span className="text-muted text-sm">No certifications listed</span>}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {interviewModal && (
          <div className={styles.modalOverlay} onClick={() => setInterviewModal(null)}>
            <motion.div className={styles.modalContent} onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className={styles.modalHeader}>
                <h3>Schedule Interview</h3>
                <button className="btn btn-ghost btn-icon" onClick={() => setInterviewModal(null)}><FiX /></button>
              </div>
              <form onSubmit={handleScheduleInterview}>
                <div className={styles.modalBody}>
                  <p style={{ marginBottom: 16 }}>Scheduling interview for <strong>{interviewModal.first_name} {interviewModal.last_name}</strong></p>
                  
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
                  <button type="submit" className="btn btn-primary">Schedule Interview</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </DashboardLayout>
  );
}
