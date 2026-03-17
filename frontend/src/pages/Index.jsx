import React from 'react';
import Navbar   from '../components/Navbar';
import Hero     from '../components/Hero';
import Features from '../components/Features';
import About    from '../components/About';
import Contact  from '../components/Contact';
import Footer   from '../components/Footer';

/**
 * Index — assembles all sections into the landing page.
 * Each section is a self-contained component — swap, reorder, or remove freely.
 */
const Index = () => {
  const handleContactSubmit = (formData) => {
    // Replace with your API call / toast notification
    console.log('Contact form submitted:', formData);
    alert(`Thanks ${formData.name}! We'll get back to you within 24 hours.`);
  };

  return (
    <div>
      <Navbar />
      <Hero />
      <Features />
      <About />
      <Contact onSubmit={handleContactSubmit} />
      <Footer />
    </div>
  );
};

export default Index;
