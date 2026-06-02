import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiBell, FiSearch, FiMenu, FiX, FiUser, FiLogOut,
  FiSettings, FiMoon, FiSun, FiChevronDown
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { useTheme } from '../../contexts/ThemeContext.jsx';
import { useSocket } from '../../contexts/SocketContext.jsx';
import api from '../../services/api.js';
import styles from './Header.module.css';

export default function Header({ onToggleSidebar, sidebarOpen }) {
  const { user, profile, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { notifications, unreadCount, markRead, markAllRead, setInitialNotifications } = useSocket();
  const navigate = useNavigate();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const loadNotifs = async () => {
      try {
        const { data } = await api.get('/notifications');
        if (data.success) {
          setInitialNotifications(data.notifications, data.unreadCount);
        }
      } catch {}
    };
    if (user) loadNotifs();
  }, [user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      markAllRead();
    } catch {}
  };

  const displayName = profile
    ? (user?.role === 'recruiter' ? profile.company_name : `${profile.first_name} ${profile.last_name}`)
    : user?.email?.split('@')[0];

  const avatarText = displayName ? displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button
          className={styles.menuBtn}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
        </button>

        <div className={styles.searchBar}>
          <FiSearch className={styles.searchIcon} size={16} />
          <input
            type="text"
            placeholder="Search jobs, candidates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && searchQuery) {
                navigate(user?.role === 'job_seeker' ? `/seeker/jobs?search=${searchQuery}` : `/recruiter/applications?search=${searchQuery}`);
              }
            }}
          />
        </div>
      </div>

      <div className={styles.headerRight}>
        <button
          className={styles.iconBtn}
          onClick={toggleTheme}
          aria-label="Toggle theme"
          data-tooltip={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>

        <div className={styles.dropdown} ref={notifsRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="Notifications"
          >
            <FiBell size={18} />
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div
                className={styles.dropdownPanel}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <div className={styles.panelHeader}>
                  <h3>Notifications</h3>
                  {unreadCount > 0 && (
                    <button className={styles.clearBtn} onClick={handleMarkAllRead}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div className={styles.notifList}>
                  {notifications.length === 0 ? (
                    <div className={styles.emptyNotifs}>
                      <FiBell size={24} />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.slice(0, 8).map((notif, i) => (
                      <div
                        key={notif.id || i}
                        className={`${styles.notifItem} ${!notif.is_read ? styles.unread : ''}`}
                        onClick={() => markRead(notif.id)}
                      >
                        <div className={styles.notifDot} />
                        <div className={styles.notifContent}>
                          <p className={styles.notifTitle}>{notif.title}</p>
                          <p className={styles.notifMsg}>{notif.message}</p>
                          <span className={styles.notifTime}>
                            {new Date(notif.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={styles.dropdown} ref={profileRef}>
          <button
            className={styles.profileBtn}
            onClick={() => setShowProfile(!showProfile)}
          >
            {(profile?.avatar_url || profile?.logo_url) ? (
              <img src={profile.avatar_url || profile.logo_url} alt="Avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarFallback}>{avatarText}</div>
            )}
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{displayName}</span>
              <span className={styles.profileRole}>
                {user?.role === 'recruiter' ? 'Recruiter' : 'Job Seeker'}
              </span>
            </div>
            <FiChevronDown size={14} />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                className={`${styles.dropdownPanel} ${styles.profilePanel}`}
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Link
                  to={user?.role === 'recruiter' ? '/recruiter/profile' : '/seeker/profile'}
                  className={styles.profileLink}
                  onClick={() => setShowProfile(false)}
                >
                  <FiUser size={16} /> My Profile
                </Link>
                <button className={styles.profileLink} onClick={() => { toggleTheme(); setShowProfile(false); }}>
                  {isDark ? <FiSun size={16} /> : <FiMoon size={16} />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className={styles.divider} />
                <button
                  className={`${styles.profileLink} ${styles.logoutLink}`}
                  onClick={() => { logout(); navigate('/'); }}
                >
                  <FiLogOut size={16} /> Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
