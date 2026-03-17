import React from 'react';
import styles from './Logo.module.css';

/**
 * Logo — Qure brand mark
 *
 * Props:
 *  size : 'sm' | 'md' | 'lg'  (default: 'md')
 */
const Logo = ({ size = 'md' }) => (
  <a href="#" className={`${styles.logo} ${styles[size]}`}>
    <span className={styles.icon}>Q</span>
    <span className={styles.wordmark}>Qure</span>
  </a>
);

export default Logo;
