import React from 'react';
import Button from './ui/Button';
import QRCard from './QRCard';
import styles from './Hero.module.css';

/**
 * Hero — landing page hero section
 *
 * Props:
 *  title       : string
 *  titleAccent : string  (teal coloured part of the title)
 *  subtitle    : string
 *  patientId   : string  (passed to QRCard)
 *  bloodType   : string  (passed to QRCard)
 */
const Hero = ({
  title       = 'Seconds matter.',
  titleAccent = 'Your data is ready.',
  subtitle    = 'Create verified medical profiles and share critical information instantly during emergencies. Qure keeps you safe.',
  patientId   = '#2847',
  bloodType   = 'O+',
}) => (
  <section className={styles.hero}>
    <div className={styles.text}>
      <h1 className={styles.heading}>
        {title}{' '}
        <span className={styles.accent}>{titleAccent}</span>
      </h1>
      <p className={styles.subtitle}>{subtitle}</p>
      <div className={styles.buttons}>
        <Button variant="primary" size="lg" href="#">Get Started</Button>
        <Button variant="outline" size="lg" href="#features">Learn More</Button>
      </div>
    </div>

    <QRCard patientId={patientId} bloodType={bloodType} />
  </section>
);

export default Hero;
