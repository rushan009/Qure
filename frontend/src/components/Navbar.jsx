import React, { useState } from 'react';
import Logo from './ui/Logo';
import Button from './ui/Button';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { label: 'Home',    href: '#'     },
  { label: 'Features', href: '#features' },
  { label: 'About',    href: '#about'    },
  { label: 'Contact',  href: '#contact'  },
];

/**
 * Navbar — sticky top navigation
 * Includes logo, nav links, login + get-started buttons, and a mobile hamburger menu.
 */
const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.nav}>
      <Logo size="md" />

      {/* Desktop links */}
      <ul className={styles.links}>
        {NAV_LINKS.map(({ label, href }) => (
          <li key={label}>
            <a href={href} className={styles.link}>{label}</a>
          </li>
        ))}
      </ul>

      {/* Desktop actions */}
      <div className={styles.actions}>
        <Button variant="ghost">Log in</Button>
        <Button variant="primary">Get Started</Button>
      </div>

      {/* Mobile hamburger */}
      <button
        className={styles.hamburger}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen1 : ''}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen2 : ''}`} />
        <span className={`${styles.bar} ${menuOpen ? styles.barOpen3 : ''}`} />
      </button>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className={styles.mobileLink}
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          <div className={styles.mobileBtns}>
            <Button variant="ghost" size="sm">Log in</Button>
            <Button variant="primary" size="sm">Get Started</Button>
          </div>
        </div>
      )}
    </nav>
  );



  
};

export default Navbar;
