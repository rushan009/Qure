import React from 'react';
import styles from './QRCard.module.css';

// Positions of filled dots in the 5×5 QR grid
const FILLED = new Set([0, 1, 2, 4, 5, 6, 8, 10, 12, 14, 16, 18, 20, 22, 23, 24]);

/**
 * QRCard — decorative patient ID card with QR-style dot grid
 *
 * Props:
 *  patientId : string  (default: '#2847')
 *  bloodType : string  (default: 'O+')
 */
const QRCard = ({ patientId = '#2847', bloodType = 'O+' }) => (
  <div className={styles.wrapper}>
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.header}>
        <span className={styles.logoIcon}>Q</span>
        <span className={styles.logoText}>Qure ID</span>
      </div>

      {/* QR dot grid */}
      <div className={styles.grid}>
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${FILLED.has(i) ? styles.filled : ''}`}
          />
        ))}
      </div>

      {/* Footer info */}
      <div className={styles.footer}>
        <p className={styles.patientId}>Patient {patientId}</p>
        <p className={styles.bloodType}>Blood: {bloodType}</p>
      </div>
    </div>

    {/* SOS badge */}
    <div className={styles.sosBadge}>
      <svg viewBox="0 0 24 24" fill="white" width="18" height="18">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  </div>
);

export default QRCard;
