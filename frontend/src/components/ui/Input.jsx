import React from 'react';
import styles from './Input.module.css';

/**
 * Input — reusable text input with optional leading icon
 *
 * Props:
 *  icon      : ReactNode  (SVG element shown on the left)
 *  multiline : boolean    (renders <textarea> instead of <input>)
 *  className : string
 *  ...rest   : any HTML input / textarea props
 */
const Input = ({ icon, multiline = false, className = '', ...rest }) => {
  const Tag = multiline ? 'textarea' : 'input';

  return (
    <div className={styles.wrapper}>
      {icon && <span className={`${styles.icon} ${multiline ? styles.iconTop : ''}`}>{icon}</span>}
      <Tag
        className={[styles.input, multiline ? styles.textarea : '', className].filter(Boolean).join(' ')}
        {...rest}
      />
    </div>
  );
};

export default Input;
