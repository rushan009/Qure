import React from 'react';
import styles from './Button.module.css';
import {Link} from 'react-router-dom'

/**
 * Button — reusable button component
 *
 * Props:
 *  variant  : 'primary' | 'outline' | 'ghost'  (default: 'primary')
 *  size     : 'sm' | 'md' | 'lg'               (default: 'md')
 *  onClick  : function
 *  href     : string (renders as <a> tag)
 *  children : ReactNode
 *  className: string (extra classes)
 *  ...rest  : any other HTML button/anchor props
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  onClick,
  href,
  children,
  className = '',
  ...rest
}) => {
  const classes = [
    styles.btn,
    styles[variant],
    styles[size],
    className,
  ].filter(Boolean).join(' ');

  if (href) {
    return (
      <Link to={href} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} onClick={onClick} {...rest}>
      {children}
    </button>
  );
};

export default Button;
