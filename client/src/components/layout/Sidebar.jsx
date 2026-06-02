import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiGrid, FiBarChart2, FiPlusSquare, FiUsers, FiUser,
  FiBriefcase, FiStar, FiBookmark, FiCheckCircle, FiList,
  FiLogOut, FiChevronLeft, FiZap
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext.jsx';
import styles from './Sidebar.module.css';

const recruiterLinks = [
  { path: '/recruiter/dashboard', icon: <FiGrid />, label: 'Dashboard' },
  { path: '/recruiter/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  { path: '/recruiter/post-job', icon: <FiPlusSquare />, label: 'Post a Job' },
  { path: '/recruiter/manage-jobs', icon: <FiBriefcase />, label: 'Manage Jobs' },
  { path: '/recruiter/applications', icon: <FiUsers />, label: 'Applications' },
  { path: '/recruiter/profile', icon: <FiUser />, label: 'Profile' },
];

const seekerLinks = [
  { path: '/seeker/dashboard', icon: <FiGrid />, label: 'Dashboard' },
  { path: '/seeker/jobs', icon: <FiBriefcase />, label: 'Browse Jobs' },
  { path: '/seeker/recommended', icon: <FiStar />, label: 'Recommended' },
  { path: '/seeker/applied', icon: <FiCheckCircle />, label: 'Applied Jobs' },
  { path: '/seeker/saved', icon: <FiBookmark />, label: 'Saved Jobs' },
  { path: '/seeker/profile', icon: <FiUser />, label: 'Profile' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'recruiter' ? recruiterLinks : seekerLinks;

  const displayName = profile
    ? (user?.role === 'recruiter' ? profile.company_name : `${profile.first_name} ${profile.last_name}`)
    : 'User';

  const avatarText = displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const sidebarVariants = {
    open: { x: 0, transition: { type: 'spring', stiffness: 400, damping: 40 } },
    closed: { x: '-100%', transition: { type: 'spring', stiffness: 400, damping: 40 } },
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.overlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : styles.closed}`}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <FiZap size={20} />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.span
                className={styles.logoText}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
              >
                HireWave
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {isOpen && (
          <div className={styles.userInfo}>
            {(profile?.avatar_url || profile?.logo_url) ? (
              <img src={profile.avatar_url || profile.logo_url} alt="Avatar" className={styles.userAvatar} />
            ) : (
              <div className={styles.userAvatarFallback}>{avatarText}</div>
            )}
            <div className={styles.userDetails}>
              <p className={styles.userName}>{displayName}</p>
              <p className={styles.userRole}>
                {user?.role === 'recruiter' ? '🏢 Recruiter' : '👤 Job Seeker'}
              </p>
            </div>
          </div>
        )}

        <nav className={styles.nav}>
          <p className={styles.navLabel}>{isOpen ? 'MENU' : ''}</p>
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.active : ''}`
              }
              data-tooltip={!isOpen ? link.label : undefined}
            >
              <span className={styles.navIcon}>{link.icon}</span>
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    className={styles.navLabel2}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                  >
                    {link.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        <button
          className={styles.logoutBtn}
          onClick={() => { logout(); navigate('/'); }}
          data-tooltip={!isOpen ? 'Sign Out' : undefined}
        >
          <FiLogOut size={18} />
          {isOpen && <span>Sign Out</span>}
        </button>
      </aside>
    </>
  );
}
