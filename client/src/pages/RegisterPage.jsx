import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUser, FiLock, FiMail, FiBriefcase, FiEye, FiEyeOff, FiArrowRight, FiZap, FiUsers, FiCheck } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-toastify';
import styles from './AuthPages.module.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'job_seeker');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    first_name: '', last_name: '', name: '', email: '', password: '', confirm_password: '',
    company_name: '', company_email: '',
  });

  const updateForm = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (role === 'job_seeker') {
      if (!form.first_name.trim()) errs.first_name = 'First name required';
      if (!form.last_name.trim()) errs.last_name = 'Last name required';
    } else {
      if (!form.name.trim()) errs.name = 'Name required';
      if (!form.company_name.trim()) errs.company_name = 'Company name required';
    }
    if (!form.email.trim()) errs.email = 'Email required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email';
    if (!form.password) errs.password = 'Password required';
    else if (form.password.length < 8) errs.password = 'Min 8 characters';
    if (form.password !== form.confirm_password) errs.confirm_password = 'Passwords do not match';
    if (!agreed) errs.agreed = 'You must agree to the terms';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await register({
        role, email: form.email, password: form.password,
        first_name: form.first_name, last_name: form.last_name, name: form.name,
        company_name: form.company_name, company_email: form.company_email || form.email,
      });
      navigate(role === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const strength = passwordStrength();
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

  return (
    <div className={styles.authPage}>
      <div className={styles.authBg}>
        <div className={styles.authBlob1} />
        <div className={styles.authBlob2} />
      </div>

      <motion.div
        className={styles.leftPanel}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
      >
        <Link to="/" className={styles.brandLogo}>
          <div className={styles.brandIcon}><FiZap size={20} /></div>
          <span>HireWave</span>
        </Link>

        <div className={styles.leftContent}>
          <h1>Join <span className="text-gradient">HireWave</span> — Where Real Talent Meets AI Efficiency!</h1>
          <p>Unlock a world of opportunities by connecting with top companies seeking real professionals. Combine AI-driven precision with human expertise.</p>

          <div className={styles.featureList}>
            {[
              'AI-powered job matching & recommendations',
              'Professional network of recruiters',
              'Streamlined application process',
              'Real-time application tracking',
            ].map((feat, i) => (
              <div key={i} className={styles.featureItem}>
                <div className={`${styles.checkIcon} ${styles[`check${i}`]}`}>✓</div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.leftStats}>
          {[
            { value: '10K+', label: 'Active Users' },
            { value: '1.2K+', label: 'Companies' },
            { value: '95%', label: 'Success Rate' },
          ].map((s, i) => (
            <div key={i} className={styles.leftStat}>
              <p className={styles.leftStatValue}>{s.value}</p>
              <p className={styles.leftStatLabel}>{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className={styles.rightPanel}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <div className={styles.authCard}>
          <div className={styles.authCardHeader}>
            <h2>Create Account</h2>
            <p>Join thousands of professionals already using HireWave</p>
          </div>

          <div className={styles.roleTabs}>
            {[
              { id: 'job_seeker', label: 'Job Seeker', icon: <FiUser size={15} /> },
              { id: 'recruiter', label: 'Recruiter', icon: <FiUsers size={15} /> },
            ].map(r => (
              <button
                key={r.id}
                type="button"
                className={`${styles.roleTab} ${role === r.id ? styles.roleTabActive : ''}`}
                onClick={() => setRole(r.id)}
              >
                {r.icon} {r.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <AnimatePresence mode="wait">
              {role === 'job_seeker' ? (
                <motion.div
                  key="seeker"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={styles.formGrid2}
                >
                  <div className="form-group">
                    <label className="form-label">First Name *</label>
                    <input className={`form-input ${errors.first_name ? 'error' : ''}`} placeholder="Enter first name" value={form.first_name} onChange={updateForm('first_name')} />
                    {errors.first_name && <span className="form-error">{errors.first_name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name *</label>
                    <input className={`form-input ${errors.last_name ? 'error' : ''}`} placeholder="Enter last name" value={form.last_name} onChange={updateForm('last_name')} />
                    {errors.last_name && <span className="form-error">{errors.last_name}</span>}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="recruiter"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="form-group">
                    <label className="form-label">Your Name *</label>
                    <div className={styles.inputWrapper}>
                      <FiUser className={styles.inputIcon} size={16} />
                      <input className={`form-input ${styles.inputWithIcon} ${errors.name ? 'error' : ''}`} placeholder="Enter your name" value={form.name} onChange={updateForm('name')} />
                    </div>
                    {errors.name && <span className="form-error">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company Name *</label>
                    <div className={styles.inputWrapper}>
                      <FiBriefcase className={styles.inputIcon} size={16} />
                      <input className={`form-input ${styles.inputWithIcon} ${errors.company_name ? 'error' : ''}`} placeholder="Enter company name" value={form.company_name} onChange={updateForm('company_name')} />
                    </div>
                    {errors.company_name && <span className="form-error">{errors.company_name}</span>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} size={16} />
                <input type="email" className={`form-input ${styles.inputWithIcon} ${errors.email ? 'error' : ''}`} placeholder="Enter your email" value={form.email} onChange={updateForm('email')} />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password *</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${styles.inputWithIcon} ${styles.inputWithToggle} ${errors.password ? 'error' : ''}`}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={updateForm('password')}
                />
                <button type="button" className={styles.passwordToggle} onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className={styles.strengthBar}>
                  <div className={styles.strengthSegments}>
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={styles.strengthSeg}
                        style={{ background: i <= strength ? strengthColors[strength] : 'var(--border-light)' }}
                      />
                    ))}
                  </div>
                  <span style={{ color: strengthColors[strength], fontSize: '0.75rem', fontWeight: 600 }}>
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={16} />
                <input
                  type="password"
                  className={`form-input ${styles.inputWithIcon} ${errors.confirm_password ? 'error' : ''}`}
                  placeholder="Confirm your password"
                  value={form.confirm_password}
                  onChange={updateForm('confirm_password')}
                />
                {form.confirm_password && form.password === form.confirm_password && (
                  <FiCheck className={styles.matchIcon} size={16} />
                )}
              </div>
              {errors.confirm_password && <span className="form-error">{errors.confirm_password}</span>}
            </div>

            <label className={styles.agreeLabel}>
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
              <span>I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a></span>
            </label>
            {errors.agreed && <span className="form-error">{errors.agreed}</span>}

            <button
              type="submit"
              className={`btn btn-primary btn-full btn-lg`}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : <><span>Create Account</span><FiArrowRight size={16} /></>}
            </button>
          </form>

          <p className={styles.authSwitch}>
            Already have an account? <Link to="/login">Login Here →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
