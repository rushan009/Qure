import React from 'react';
import StatCard from './StatCard';
import styles from './About.module.css';

const DEFAULT_STATS = [
  { value: '< 3s',    label: 'Data access time' },
  { value: '256-bit', label: 'AES encryption'   },
  { value: '24/7',    label: 'Emergency ready'  },
];

/**
 * About — "Why Qure?" section with description and stats
 *
 * Props:
 *  stats : array of { value, label }  (defaults to DEFAULT_STATS)
 */
const About = ({ stats = DEFAULT_STATS }) => (
  <section id="about" className={styles.section}>
    <div className={styles.inner}>
      <h2 className={styles.title}>Why Qure?</h2>
      <p className={styles.body}>
        Delayed access to medical records costs lives. Qure bridges the gap between patients,
        doctors, and emergency responders — giving instant access to verified medical data through
        secure QR codes and encrypted profiles. No more paper trails. No more delays.
      </p>

      <div className={styles.stats}>
        {stats.map((s) => (
          <StatCard key={s.label} value={s.value} label={s.label} />
        ))}
      </div>
    </div>
  </section>
);

export default About;
