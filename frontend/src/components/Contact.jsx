import React, { useState } from 'react';
import Input from './ui/Input';
import Button from './ui/Button';
import styles from './Contact.module.css';

const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 7 10-7" />
  </svg>
);

const MsgIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

/**
 * Contact — contact form section
 *
 * Fires onSubmit(formData) when the form is submitted.
 * Props:
 *  onSubmit : function({ name, email, message })
 */
const Contact = ({ onSubmit }) => {
  const [form, setForm]       = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(form);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <section id="contact" className={styles.section}>
      <div className={styles.inner}>
        <h2 className={styles.title}>Get in touch</h2>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <Input
            icon={<UserIcon />}
            type="text"
            name="name"
            placeholder="Your name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <Input
            icon={<MailIcon />}
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <Input
            icon={<MsgIcon />}
            multiline
            name="message"
            placeholder="Your message"
            value={form.message}
            onChange={handleChange}
            required
          />
          <Button
            variant="primary"
            size="lg"
            type="submit"
            className={styles.submitBtn}
          >
            {submitted ? 'Message sent ✓' : 'Send Message'}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default Contact;
