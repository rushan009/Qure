import React from 'react';
import styles from './Logo.module.css';
import { Link } from 'react-router-dom';

/**
 * Logo — Qure brand mark
 *
 * Props:
 *  size : 'sm' | 'md' | 'lg'  (default: 'md')
 */
const Logo = ({ size = 'md' }) => (
  <Link to="/" className={`${styles.logo} ${styles[size]}`}>
    <span className={styles.icon}>Q</span>
    <span className={styles.wordmark}>Qure</span>
  </Link>
);

export default Logo;
