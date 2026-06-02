import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiEdit2, FiSave, FiGlobe, FiMapPin, FiBriefcase, FiUpload } from 'react-icons/fi';
import DashboardLayout from '../../components/layout/DashboardLayout.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import styles from './RecruiterProfile.module.css';

const INDUSTRIES = ['Technology', 'Finance', 'Healthcare', 'Education', 'Retail', 'Manufacturing', 'Media', 'Other'];
const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

export default function RecruiterProfile() {
  const { profile: authProfile, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    name: '', company_name: '', company_email: '', website: '', industry: '',
    location: '', company_size: '', description: '', founded_year: '',
  });

  useEffect(() => {
    api.get('/profile/recruiter').then(({ data }) => {
      if (data.success) {
        setProfile(data.profile);
        setForm({
          name: data.profile.name || '',
          company_name: data.profile.company_name || '',
          company_email: data.profile.company_email || '',
          website: data.profile.website || '',
          industry: data.profile.industry || '',
          location: data.profile.location || '',
          company_size: data.profile.company_size || '',
          description: data.profile.description || '',
          founded_year: data.profile.founded_year || '',
        });
      }
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data } = await api.put('/profile/recruiter', form);
      if (data.success) {
        toast.success('Profile updated successfully!');
        setProfile(prev => ({ ...prev, ...form }));
        updateProfile(form);
        setEditing(false);
      }
    } catch (err) {
      toast.error('Failed to update profile');
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const { data } = await api.post('/profile/recruiter/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        setProfile(prev => ({ ...prev, logo_url: data.logo_url }));
        toast.success('Logo updated!');
      }
    } catch {
      toast.error('Failed to upload logo');
    }
  };

  const update = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));
  const companyInitials = form.company_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <DashboardLayout>
      <div className="page-content">
        <div className="section-header">
          <div>
            <h1 className="section-title">Company Profile</h1>
            <p className="section-subtitle">Manage your company information</p>
          </div>
          {!editing ? (
            <button className="btn btn-primary" onClick={() => setEditing(true)}>
              <FiEdit2 size={16} /> Edit Profile
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
                <FiSave size={16} /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        <motion.div
          className={`card ${styles.profileHeader}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.logoSection}>
            <div className={styles.logoWrapper}>
              {profile?.logo_url ? (
                <img src={profile.logo_url} alt="Company Logo" className={styles.logoImg} />
              ) : (
                <div className={styles.logoFallback}>{companyInitials || 'CO'}</div>
              )}
              <label className={styles.logoUpload} htmlFor="logo-upload">
                <FiUpload size={14} />
                <input id="logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
              </label>
            </div>
            <div className={styles.companyInfo}>
              <h2 className={styles.companyName}>{profile?.company_name || 'Your Company'}</h2>
              <p className={styles.companyEmail}>{profile?.email}</p>
              <div className={styles.companyTags}>
                {profile?.industry && <span className="tag">{profile.industry}</span>}
                {profile?.company_size && <span className="tag tag-purple">{profile.company_size} employees</span>}
                {profile?.location && <span className="tag tag-cyan">📍 {profile.location}</span>}
              </div>
            </div>
          </div>
        </motion.div>

        <div className={styles.profileGrid}>
          <motion.div
            className="card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h3 className={styles.sectionTitle}><FiBriefcase size={18} /> Company Information</h3>

            <div className={styles.formGrid}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input className="form-input" value={form.name} onChange={update('name')} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-input" value={form.company_name} onChange={update('company_name')} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Company Email</label>
                <input type="email" className="form-input" value={form.company_email} onChange={update('company_email')} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label"><FiGlobe size={14} /> Website</label>
                <input type="url" className="form-input" placeholder="https://yourcompany.com" value={form.website} onChange={update('website')} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label"><FiMapPin size={14} /> Location</label>
                <input className="form-input" placeholder="Mumbai, India" value={form.location} onChange={update('location')} disabled={!editing} />
              </div>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <select className="form-input form-select" value={form.industry} onChange={update('industry')} disabled={!editing}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Company Size</label>
                <select className="form-input form-select" value={form.company_size} onChange={update('company_size')} disabled={!editing}>
                  <option value="">Select size</option>
                  {COMPANY_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Founded Year</label>
                <input type="number" className="form-input" placeholder="2020" min="1800" max="2024" value={form.founded_year} onChange={update('founded_year')} disabled={!editing} />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
              <label className="form-label">Company Description</label>
              <textarea
                className="form-input form-textarea"
                rows={4}
                placeholder="Describe your company, mission, culture..."
                value={form.description}
                onChange={update('description')}
                disabled={!editing}
              />
            </div>
          </motion.div>

          <motion.div
            className={styles.statsPanel}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="card">
              <h3 className={styles.sectionTitle}>Profile Completion</h3>
              <div className={styles.completionItems}>
                {[
                  { label: 'Company Name', done: !!form.company_name },
                  { label: 'Email', done: !!form.company_email },
                  { label: 'Website', done: !!form.website },
                  { label: 'Industry', done: !!form.industry },
                  { label: 'Location', done: !!form.location },
                  { label: 'Description', done: !!form.description },
                  { label: 'Logo', done: !!profile?.logo_url },
                ].map((item, i) => (
                  <div key={i} className={styles.completionItem}>
                    <span className={item.done ? styles.checkDone : styles.checkPending}>
                      {item.done ? '✓' : '○'}
                    </span>
                    <span className={item.done ? styles.itemDone : styles.itemPending}>{item.label}</span>
                  </div>
                ))}
              </div>
              <div className={styles.completionBar}>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${([form.company_name, form.company_email, form.website, form.industry, form.location, form.description, profile?.logo_url].filter(Boolean).length / 7) * 100}%`
                    }}
                  />
                </div>
                <p className={styles.completionPct}>
                  {Math.round(([form.company_name, form.company_email, form.website, form.industry, form.location, form.description, profile?.logo_url].filter(Boolean).length / 7) * 100)}% Complete
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
