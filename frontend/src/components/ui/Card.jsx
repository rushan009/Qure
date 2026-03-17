import React from 'react';
import styles from './Card.module.css';

/**
 * Card — generic surface card
 *
 * Props:
 *  children  : ReactNode
 *  hoverable : boolean  (adds lift-on-hover effect)
 *  className : string
 *  ...rest   : any HTML div props
 */
const Card = ({ children, hoverable = false, className = '', ...rest }) => {
  const classes = [
    styles.card,
    hoverable ? styles.hoverable : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

export default Card;
