import React from 'react';
import Navbar   from '../components/ui/Navbar';
import Hero     from '../components/ui/Hero';
import Features from '../components/ui/Features';
import About    from '../components/ui/About';
import Contact  from '../components/ui/Contact';
import Footer   from '../components/ui/Footer';

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
