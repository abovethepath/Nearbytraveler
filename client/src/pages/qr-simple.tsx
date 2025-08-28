import React, { useEffect, useState } from 'react';

export default function QRSimplePage() {
  const [qrUrl, setQrUrl] = useState('');
  
  useEffect(() => {
    // Simple QR code generation without external library first
    const signupUrl = `${window.location.origin}/join`;
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(signupUrl)}`;
    setQrUrl(qrApiUrl);
  }, []);

  const downloadQR = () => {
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = 'nearby-traveler-qr.png';
    link.click();
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'white', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '500px' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px', color: '#333' }}>
          QR Code for Business Cards
        </h1>
        <p style={{ color: '#666', marginBottom: '32px' }}>
          Print-ready QR code for your business cards
        </p>
        
        {qrUrl && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '32px', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
            border: '1px solid #ddd',
            marginBottom: '24px'
          }}>
            <img 
              src={qrUrl} 
              alt="QR Code for Nearby Traveler Signup"
              style={{ width: '300px', height: '300px', margin: '0 auto', display: 'block' }}
            />
            <button 
              onClick={downloadQR}
              style={{
                marginTop: '24px',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Download QR Code
            </button>
          </div>
        )}
        
        <div style={{ 
          backgroundColor: '#eff6ff', 
          padding: '16px', 
          borderRadius: '6px', 
          textAlign: 'left',
          fontSize: '14px',
          color: '#1e40af'
        }}>
          <strong>Printing Instructions:</strong>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Download the QR code image</li>
            <li>Add to your business card design</li>
            <li>Recommended size: 1-1.5 inches square</li>
            <li>Test scan before final printing</li>
          </ul>
        </div>
        
        <p style={{ marginTop: '16px', fontSize: '12px', color: '#666' }}>
          <strong>Links to:</strong> {window.location.origin}/join
        </p>
      </div>
    </div>
  );
}