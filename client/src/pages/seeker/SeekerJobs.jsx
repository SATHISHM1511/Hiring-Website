import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiBookmark, FiCheckCircle, FiMapPin, FiBriefcase, FiClock, FiDollarSign, FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import styles from './SeekerJobs.module.css';

const TYPES = ['full-time', 'part-time', 'contract', 'internship', 'freelance'];
const EXPERIENCES = ['Fresher', '1-2 years', '2-3 years', '3-5 years', '5-8 years', '8+ years'];

export function JobCard({ job, onApply, onSave, savedIds, appliedIds, matchScore }) {
  const isSaved = savedIds.has(job.id);
  const isApplied = appliedIds.has(job.id);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);

  const formatSalary = (min, max) => {
    if (!min && !max) return null;
    const fmt = (v) => v >= 100000 ? `₹${(v/100000).toFixed(0)}L` : `₹${v.toLocaleString()}`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  };

  const handleApply = async () => {
    if (isApplied || applying) return;
    setApplying(true);
    await onApply(job.id);
    setApplying(false);
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    await onSave(job.id, isSaved);
    setSaving(false);
  };

  const skills = typeof job.skills === 'string' ? JSON.parse(job.skills || '[]') : (job.skills || []);
  const timeAgo = (d) => {
    const ms = Date.now() - new Date(d).getTime();
    const days = Math.floor(ms / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return `${Math.floor(days/7)}w ago`;
  };

  return (
    <motion.div
      className={`${styles.jobCard} ${isApplied ? styles.appliedCard : ''}`}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {matchScore && (
        <div className={styles.matchHeader}>
          <div className={styles.matchScore} style={{
            background: matchScore >= 90 ? 'var(--success-bg)' : matchScore >= 75 ? 'rgba(37,99,235,0.1)' : 'var(--warning-bg)',
            color: matchScore >= 90 ? 'var(--success)' : matchScore >= 75 ? 'var(--primary)' : 'var(--warning)',
          }}>
            <span style={{ display: 'flex', alignItems: 'center' }}>★</span> {matchScore}% Match
          </div>
          <div className={styles.matchBar}>
            <div className={styles.matchFill} style={{
              width: `${matchScore}%`,
              background: matchScore >= 90 ? 'var(--success)' : matchScore >= 75 ? 'var(--primary)' : 'var(--warning)',
            }} />
          </div>
        </div>
      )}

      <div className={styles.cardHeader}>
        <div className={styles.companyLogo}>
          {job.logo_url ? <img src={job.logo_url} alt="" /> : <span>🏢</span>}
        </div>
        <div className={styles.jobInfo}>
          <h3 className={styles.jobTitle}>{job.title}</h3>
          <p className={styles.companyName}>{job.company_name}</p>
        </div>
        <button
          className={`${styles.saveBtn} ${isSaved ? styles.savedBtn : ''}`}
          onClick={handleSave}
          disabled={saving}
          title={isSaved ? 'Unsave' : 'Save'}
        >
          <FiBookmark size={16} />
        </button>
      </div>

      <div className={styles.jobMeta}>
        {job.location && <span><FiMapPin size={13} /> {job.is_remote ? 'Remote' : job.location}</span>}
        {job.employment_type && <span><FiBriefcase size={13} /> {job.employment_type}</span>}
        {job.experience && <span><FiClock size={13} /> {job.experience}</span>}
        {formatSalary(job.salary_min, job.salary_max) && (
          <span><FiDollarSign size={13} /> {formatSalary(job.salary_min, job.salary_max)}</span>
        )}
      </div>

      {skills.length > 0 && (
        <div className={styles.skillsRow}>
          {skills.slice(0, 4).map(s => <span key={s} className="tag">{s}</span>)}
          {skills.length > 4 && <span className="text-muted text-xs">+{skills.length - 4}</span>}
        </div>
      )}

      <div className={styles.cardFooter}>
        <span className={styles.postedTime}>{timeAgo(job.created_at)}</span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to={`/seeker/jobs/${job.id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem', textDecoration: 'none' }}>
            See more
          </Link>
          {isApplied ? (
            <span className="badge badge-selected" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
              <FiCheckCircle size={12} style={{ marginRight: '4px' }} /> Applied
            </span>
          ) : (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleApply}
              disabled={applying}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
            >
              {applying ? 'Applying...' : 'Apply Now'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function SeekerJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    location: '', experience: '', employment_type: '', is_remote: false,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        ...(search && { search }),
        ...(filters.location && { location: filters.location }),
        ...(filters.experience && { experience: filters.experience }),
        ...(filters.employment_type && { employment_type: filters.employment_type }),
        ...(filters.is_remote && { is_remote: 'true' }),
      });
      const { data } = await api.get(`/jobs?${params}`);
      if (data.success) {
        setJobs(data.jobs);
        setPagination(data.pagination);
      }
    } catch {}
    setLoading(false);
  }, [page, search, filters]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    api.get('/profile/seeker/saved-jobs').then(({ data }) => {
      if (data.success) setSavedIds(new Set(data.jobs.map(j => j.id)));
    }).catch(() => {});

    api.get('/applications/my').then(({ data }) => {
      if (data.success) setAppliedIds(new Set(data.applications.map(a => a.job_id)));
    }).catch(() => {});
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

  const clearFilters = () => {
    setFilters({ location: '', experience: '', employment_type: '', is_remote: false });
    setPage(1);
  };

  const hasFilters = filters.location || filters.experience || filters.employment_type || filters.is_remote;

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Browse Jobs</h1>
            <p className="section-subtitle">
              {pagination.total ? `${pagination.total} jobs found` : 'Explore opportunities'}
            </p>
          </div>
          <button
            className={`btn btn-secondary btn-sm ${showFilters ? styles.filterActive : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter size={16} /> Filters {hasFilters && `(active)`}
          </button>
        </div>

        <div className={styles.searchRow}>
          <div className="search-bar" style={{ flex: 1 }}>
            <FiSearch size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              placeholder="Search jobs by title, company, skills..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {showFilters && (
          <motion.div
            className={styles.filtersPanel}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className={styles.filtersGrid}>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" placeholder="e.g. Mumbai, Bangalore" value={filters.location}
                  onChange={(e) => { setFilters(p => ({ ...p, location: e.target.value })); setPage(1); }} />
              </div>
              <div className="form-group">
                <label className="form-label">Experience</label>
                <select className="form-input form-select" value={filters.experience}
                  onChange={(e) => { setFilters(p => ({ ...p, experience: e.target.value })); setPage(1); }}>
                  <option value="">All Levels</option>
                  {EXPERIENCES.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Job Type</label>
                <select className="form-input form-select" value={filters.employment_type}
                  onChange={(e) => { setFilters(p => ({ ...p, employment_type: e.target.value })); setPage(1); }}>
                  <option value="">All Types</option>
                  {TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.filtersFooter}>
              <label className={styles.remoteToggle}>
                <input type="checkbox" checked={filters.is_remote}
                  onChange={(e) => { setFilters(p => ({ ...p, is_remote: e.target.checked })); setPage(1); }} />
                🏠 Remote Only
              </label>
              {hasFilters && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
                  <FiX size={14} /> Clear Filters
                </button>
              )}
            </div>
          </motion.div>
        )}

        {loading ? (
          <div className={styles.jobsGrid}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className={styles.jobCardSkeleton}>
                <div className={styles.skeletonHeader}>
                  <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 16, width: '70%', marginBottom: 8 }} />
                    <div className="skeleton" style={{ height: 12, width: '50%' }} />
                  </div>
                </div>
                <div className="skeleton" style={{ height: 12, width: '90%', marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 12, width: '75%' }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {[1,2,3].map(j => <div key={j} className="skeleton" style={{ height: 26, width: 60, borderRadius: 20 }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <p className="empty-state-title">No jobs found</p>
            <p className="empty-state-desc">Try adjusting your search or filters</p>
            <button className="btn btn-secondary" onClick={clearFilters}>Clear Filters</button>
          </div>
        ) : (
          <>
            <div className={styles.jobsGrid}>
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <JobCard
                    job={job}
                    onApply={handleApply}
                    onSave={handleSave}
                    savedIds={savedIds}
                    appliedIds={appliedIds}
                  />
                </motion.div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
                <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(page - 2, pagination.totalPages - 4)) + i;
                  return (
                    <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  );
                })}
                <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === pagination.totalPages}>›</button>
                <button className="page-btn" onClick={() => setPage(pagination.totalPages)} disabled={page === pagination.totalPages}>»</button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
