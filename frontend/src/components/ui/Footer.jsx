import React from 'react';
import Logo from '../ui/Logo';
import styles from './Footer.module.css';

const FOOTER_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'About',    href: '#about'    },
  { label: 'Contact',  href: '#contact'  },
  { label: 'Login',    href: '#'         },
];

/**
 * Footer — site footer with logo, links, and copyright
 *
 * Props:
 *  links     : array of { label, href }  (defaults to FOOTER_LINKS)
 *  copyright : string
 */
const Footer = ({
  links     = FOOTER_LINKS,
  copyright = '© 2026 Qure. All rights reserved.',
}) => (
  <footer className={styles.footer}>
    <Logo size="sm" />

    <div className={styles.links}>
      {links.map(({ label, href }) => (
        <a key={label} href={href} className={styles.link}>{label}</a>
      ))}
    </div>

    <p className={styles.copy}>{copyright}</p>
  </footer>
);

export default Footer;
