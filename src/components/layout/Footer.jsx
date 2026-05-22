// src/components/layout/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container">
      <div className="footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">🎓 EduLearn</div>
          <p>Your gateway to quality education. Learn anytime, grow everywhere.</p>
          <div className="social-links">
            <a href="#" aria-label="Twitter">🐦</a>
            <a href="#" aria-label="LinkedIn">💼</a>
            <a href="#" aria-label="YouTube">▶️</a>
            <a href="#" aria-label="Instagram">📸</a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Platform</h4>
          <Link to="/courses">Browse Courses</Link>
          <Link to="/register?role=instructor">Teach on EduLearn</Link>
          <Link to="/student/subscription">Pricing</Link>
          <Link to="#">Blog</Link>
        </div>

        <div className="footer-links">
          <h4>Categories</h4>
          <Link to="/courses?category=Backend">Backend</Link>
          <Link to="/courses?category=Frontend">Frontend</Link>
          <Link to="/courses?category=Data Science">Data Science</Link>
          <Link to="/courses?category=DevOps">DevOps</Link>
        </div>

        <div className="footer-links">
          <h4>Support</h4>
          <a href="#">Help Center</a>
          <a href="#">Contact Us</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© EduLearn LMS.</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>edulearn@gmail.com</p>
      </div>
    </div>
  </footer>
);

export default Footer;
