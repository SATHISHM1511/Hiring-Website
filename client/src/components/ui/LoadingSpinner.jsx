import React from 'react';
import { motion } from 'framer-motion';
import styles from './LoadingSpinner.module.css';

export default function LoadingSpinner({ fullscreen, size = 'md', text = '' }) {
  const sizes = { sm: 24, md: 40, lg: 60 };
  const dim = sizes[size] || sizes.md;

  const spinner = (
    <div className={styles.spinnerWrapper} style={{ width: dim, height: dim }}>
      <svg viewBox="0 0 50 50" className={styles.svg}>
        <circle
          className={styles.track}
          cx="25" cy="25" r="20"
          fill="none"
          strokeWidth="4"
        />
        <circle
          className={styles.fill}
          cx="25" cy="25" r="20"
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );

  if (fullscreen) {
    return (
      <div className={styles.fullscreen}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={styles.fullscreenInner}
        >
          <div className={styles.logo}>
            <span className={styles.logoGradient}>H</span>
          </div>
          {spinner}
          {text && <p className={styles.text}>{text}</p>}
        </motion.div>
      </div>
    );
  }

  return (
    <div className={styles.inline}>
      {spinner}
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
}
