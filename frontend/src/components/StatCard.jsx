import React from 'react';
import styles from './StatCard.module.css';

/**
 * StatCard — single stat display (value + label)
 *
 * Props:
 *  value : string  e.g. '< 3s'
 *  label : string  e.g. 'Data access time'
 */
const StatCard = ({ value, label }) => (
  <div className={styles.stat}>
    <p className={styles.value}>{value}</p>
    <p className={styles.label}>{label}</p>
  </div>
);

export default StatCard;
