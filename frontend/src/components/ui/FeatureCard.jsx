import React from 'react';
import Card from '../ui/Card';
import styles from './FeatureCard.module.css';

/**
 * FeatureCard — single feature highlight card
 *
 * Props:
 *  icon        : ReactNode  (SVG element)
 *  title       : string
 *  description : string
 */
const FeatureCard = ({ icon, title, description }) => (
  <Card hoverable className={styles.card}>
    <div className={styles.iconWrap}>{icon}</div>
    <h3 className={styles.title}>{title}</h3>
    <p className={styles.description}>{description}</p>
  </Card>
);

export default FeatureCard;
