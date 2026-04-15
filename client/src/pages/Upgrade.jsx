import React from 'react';
import { Check, ShieldCheck, Zap, Infinity as InfinityIcon } from 'lucide-react';
import axios from 'axios';

const Upgrade = () => {
  const handleUpgrade = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/payments/create-checkout-session', {}, { withCredentials: true });
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error starting upgrade:', error.message);
      alert('Failed to start checkout. Please ensure you are logged in.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', maxWidth: '1000px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '16px', background: 'linear-gradient(135deg, white, var(--primary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Scale Your Code Security
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem' }}>
          Choose the plan that fits your development workflow.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', width: '100%' }}>
        {/* Free Plan */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Free</h2>
            <p style={{ color: 'var(--text-muted)' }}>For individual developers.</p>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 700 }}>$0<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={18} color="#4ade80" /> 5 Automated Reviews / mo</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={18} color="#4ade80" /> Security Deep Scans</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-muted)' }}><Check size={18} color="var(--border)" /> Priority Queue</li>
          </ul>
          <button className="nav-link" disabled style={{ background: 'var(--border)', padding: '12px', borderRadius: '12px', justifyContent: 'center' }}>
            Current Plan
          </button>
        </div>

        {/* Pro Plan */}
        <div className="glass-card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '32px', 
          border: '2px solid var(--primary)',
          boxShadow: '0 0 30px -10px rgba(129, 140, 248, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Pro</h2>
              <p style={{ color: 'var(--text-muted)' }}>For power users & small teams.</p>
            </div>
            <span className="badge-success" style={{ background: 'var(--primary)', color: 'white' }}>RECOMMENDED</span>
          </div>
          <div style={{ fontSize: '3rem', fontWeight: 700 }}>$19<span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/mo</span></div>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={18} color="#4ade80" /> <InfinityIcon size={18} /> Unlimited Reviews</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={18} color="#4ade80" /> Priority Queue</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={18} color="#4ade80" /> Advanced Performance Audits</li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '12px' }}><Check size={18} color="#4ade80" /> Human-like Suggestion Engine</li>
          </ul>
          <button className="btn-primary" onClick={handleUpgrade} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
            Upgrade Now
          </button>
        </div>
      </div>

      <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
        <p>Protected by Stripe. Secure payments guaranteed.</p>
      </div>
    </div>
  );
};

export default Upgrade;
