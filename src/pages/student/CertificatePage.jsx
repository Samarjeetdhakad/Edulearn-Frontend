// src/pages/student/CertificatePage.js
import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageHeader, EmptyState, Loader, Badge } from '../../components/common/index';
import { progressAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './CertificatePage.css';

const CertificatePage = () => {
  const { user } = useAuth();
  const [certs, setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [downloading, setDownloading] = useState(null);
  const [activeCert, setActiveCert] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      try {
        const { enrollmentAPI, courseAPI, progressAPI } = await import('../../services/api');
        const enrRes = await enrollmentAPI.getByStudent(user.userId);
        const certifiedEnrollments = enrRes.data.filter(e => e.certificateIssued);
        
        const certsList = [];
        for (const enr of certifiedEnrollments) {
           try {
             const certRes = await progressAPI.getCertificate(user.userId, enr.courseId);
             certsList.push(certRes.data);
           } catch (err) {
             console.error("Failed to load certificate for course", enr.courseId);
           }
        }
        setCerts(certsList);
      } catch (err) {
        console.error("Error fetching certificates:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchCertificates();
  }, [user]);

  const handleVerify = async () => {
    if (!verifyCode.trim()) return;
    setVerifying(true);
    try {
      const { progressAPI } = await import('../../services/api');
      const res = await progressAPI.verifyCertificate(verifyCode.trim());
      setVerifyResult({ valid: true, certificate: res.data });
    } catch (err) {
       setVerifyResult({ valid: false, message: err.response?.data?.message || 'Invalid verification code. Certificate not found.' });
    } finally {
       setVerifying(false);
    }
  };

  const handleDownload = async (cert) => {
    setActiveCert(cert);
    setDownloading(cert.certificateId);
    try {
      // Delay to ensure the hidden template is fully updated with cert details
      await new Promise(r => setTimeout(r, 300));
      
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions (landscape)
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EduLearn_Certificate_${cert.courseName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Failed to generate certificate PDF", err);
      alert("Failed to generate certificate PDF. Please try again.");
    } finally {
      setDownloading(null);
    }
  };


  return (
    <DashboardLayout>
      <PageHeader title="My Certificates" subtitle="Your earned certificates from completed courses" />

      {/* Verify Section */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div className="card-body">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Verify a Certificate</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 14 }}>
            Enter a verification code to check if a certificate is authentic.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <input type="text" className="form-control" placeholder="e.g. CERT-EDU-2026-ABC123"
              value={verifyCode} onChange={e => { setVerifyCode(e.target.value); setVerifyResult(null); }} style={{ maxWidth: 340 }} />
            <button className="btn btn-primary" onClick={handleVerify} disabled={verifying || !verifyCode.trim()}>
              {verifying ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {verifyResult && (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 'var(--radius-sm)', background: verifyResult.valid ? '#d1fae5' : '#fee2e2', color: verifyResult.valid ? '#065f46' : '#991b1b', fontSize: 14 }}>
              {verifyResult.valid ? (
                <span>Valid Certificate — <strong>{verifyResult.certificate.courseName}</strong> issued on {verifyResult.certificate.issuedAt}</span>
              ) : (
                <span>{verifyResult.message}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Certificate Cards */}
      {loading ? <Loader /> : certs.length === 0 ? (
        <EmptyState title="No certificates yet"
          description="Complete a course to earn your first certificate!" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24 }}>
          {certs.map(cert => {
            return (
              <div key={cert.certificateId} className="cert-card card">
                {/* Certificate visual */}
                <div className="cert-visual">
                  <p className="cert-label">CERTIFICATE OF COMPLETION</p>
                  <h3 className="cert-course-name">{cert.courseName}</h3>
                  <p className="cert-instructor">by {cert.instructorName}</p>
                </div>
                <div className="card-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Badge variant="success">Verified</Badge>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Issued: {new Date(cert.issuedAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ background: 'var(--bg)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', marginBottom: 14 }}>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>VERIFICATION CODE</p>
                    <p style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: 'var(--primary)', letterSpacing: 1 }}>
                      {cert.verificationCode}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button 
                      onClick={() => handleDownload(cert)} 
                      disabled={downloading === cert.certificateId}
                      className="btn btn-primary btn-sm" 
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {downloading === cert.certificateId ? 'Generating...' : 'Download PDF'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => { setVerifyCode(cert.verificationCode); setVerifyResult(null); window.scrollTo(0, 0); }}>
                      Share
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hidden Template for Image Generation */}
      <div className="cert-download-wrapper">
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        <div className="cert-download-content" ref={printRef}>
          <div className="cert-border-outer"></div>
          <div className="cert-border-inner"></div>
          
          <div className="cert-download-header">Certificate of Completion</div>
          
          <div className="cert-download-seal-wrap">
            <div className="cert-download-seal">
              <span style={{ fontSize: '12px', fontWeight: 400 }}>EST. 2024</span>
              <br />
              EduLearn
              <br />
              <span style={{ fontSize: '10px', fontWeight: 400 }}>OFFICIAL SEAL</span>
            </div>
          </div>

          <div className="cert-download-subheader">This is to certify that</div>
          <div className="cert-download-name">{user?.fullName || 'Student Name'}</div>
          
          <div className="cert-download-text">
            has successfully completed all requirements for the professional course
          </div>
          
          <div className="cert-download-course">{activeCert?.courseName || 'Course Name'}</div>
          

          
          <div className="cert-download-footer">
            <div className="cert-download-sig">
              <div className="sig-line"></div>
              <h4>{activeCert ? new Date(activeCert.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Date'}</h4>
              <p>Date Issued</p>
            </div>
            
            <div className="cert-download-sig">
              <div className="sig-line"></div>
              <h4>{activeCert?.instructorName || 'Instructor'}</h4>
              <p>Authorized Instructor</p>
            </div>
          </div>
          
          <div className="cert-download-code">
            Verifiable Certificate ID: {activeCert?.verificationCode || 'VERIFY-CODE'}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};


export default CertificatePage;
