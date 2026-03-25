import React from 'react';
import FeatureCard from './FeatureCard';
import styles from './Features.module.css';

const FEATURES = [
  {
    title: 'Verified Reports',
    description: 'Upload and store verified medical reports securely. Access them anytime, anywhere.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#3a9ea0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    title: 'Emergency SOS',
    description: 'One-tap emergency alert shares your critical medical data with first responders.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#e05252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    title: 'Doctor Access',
    description: 'Grant time-limited access to your records. Doctors see only what you allow.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#3a9ea0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    ),
  },
  {
    title: 'Privacy & Encryption',
    description: 'End-to-end encryption ensures your medical data stays private and secure.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="#2e9e7a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="22" height="22">
        <rect x="3" y="11" width="18" height="11" rx="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
];

/**
 * Features — grid of feature cards
 *
 * Props:
 *  features : array of { title, description, icon }  (defaults to FEATURES above)
 */
const Features = ({ features = FEATURES }) => (
  <section id="features" className={styles.section}>
    <div className={styles.inner}>
      <div className={styles.header}>
        <h2 className={styles.title}>Built for emergencies</h2>
        <p className={styles.subtitle}>Every feature designed to save time when it matters most.</p>
      </div>

      <div className={styles.grid}>
        {features.map((f) => (
          <FeatureCard key={f.title} icon={f.icon} title={f.title} description={f.description} />
        ))}
      </div>
    </div>
  </section>
);

export default Features;
