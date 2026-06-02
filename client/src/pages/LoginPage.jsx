import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiLock, FiEye, FiEyeOff, FiArrowRight, FiZap, FiBriefcase, FiUsers } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext.jsx';
import { toast } from 'react-toastify';
import styles from './AuthPages.module.css';

const ROLES = [
  { id: 'job_seeker', label: 'Job Seeker', desc: 'Find your dream job with AI-powered matching', icon: <FiUser size={22} />, color: 'blue' },
  { id: 'recruiter', label: 'Recruiter', desc: 'Find the best talent for your organization', icon: <FiUsers size={22} />, color: 'purple' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('job_seeker');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const data = await login({ email, password, role: selectedRole });
      navigate(selectedRole === 'recruiter' ? '/recruiter/dashboard' : '/seeker/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

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
          <h1>Welcome back to<br /><span className="text-gradient">HireWave</span></h1>
          <p>Your next opportunity is just one step away. Sign in to access your dashboard, explore jobs, and connect with top talent.</p>

          <div className={styles.featureList}>
            {[
              'Access AI-powered job matching',
              'Track application progress',
              'Connect with top companies',
              'Real-time notifications',
            ].map((feat, i) => (
              <div key={i} className={styles.featureItem}>
                <div className={styles.checkIcon}>✓</div>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.leftDecor}>
          <div className={styles.decorCard}>
            <span>🎊</span>
            <div>
              <p className={styles.decorTitle}>New Match Found!</p>
              <p className={styles.decorSub}>Senior Dev · 96% match</p>
            </div>
          </div>
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
            <h2>Sign In</h2>
            <p>Welcome back! Please enter your details.</p>
          </div>

          <div className={styles.roleSelector}>
            <label className={styles.formLabel}>Choose Your Role</label>
            <div className={styles.roleGrid}>
              {ROLES.map(role => (
                <button
                  key={role.id}
                  type="button"
                  className={`${styles.roleCard} ${selectedRole === role.id ? styles.roleActive : ''}`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <div className={`${styles.roleIcon} ${styles[`roleIcon_${role.color}`]}`}>
                    {role.icon}
                  </div>
                  <div className={styles.roleInfo}>
                    <p className={styles.roleLabel}>{role.label}</p>
                    <p className={styles.roleDesc}>{role.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className={styles.inputWrapper}>
                <FiUser className={styles.inputIcon} size={16} />
                <input
                  type="email"
                  className={`form-input ${styles.inputWithIcon} ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="form-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${styles.inputWithIcon} ${styles.inputWithToggle} ${errors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && <span className="form-error">{errors.password}</span>}
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-full btn-lg ${loading ? styles.loading : ''}`}
              disabled={loading}
            >
              {loading ? (
                <span className={styles.loadingDots}>Signing in<span>...</span></span>
              ) : (
                <><span>Sign In</span><FiArrowRight size={16} /></>
              )}
            </button>
          </form>

          <p className={styles.authSwitch}>
            Don't have an account? <Link to="/register">Create one free →</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
