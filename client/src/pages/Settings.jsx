import React from 'react';
import { ToggleLeft as Toggle, Settings as SettingsIcon, Shield, Zap, BookOpen } from 'lucide-react';

const RepoSetting = ({ name, isEnabled, settings }) => (
  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h3 style={{ fontSize: '1.125rem' }}>{name}</h3>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Status: {isEnabled ? 'Active' : 'Paused'}</span>
      </div>
      <div style={{ 
        width: '48px', 
        height: '24px', 
        borderRadius: '999px', 
        backgroundColor: isEnabled ? 'var(--primary)' : 'var(--border)',
        position: 'relative',
        cursor: 'pointer'
      }}>
        <div style={{ 
          width: '20px', 
          height: '20px', 
          borderRadius: '50%', 
          backgroundColor: 'white', 
          position: 'absolute', 
          top: '2px', 
          left: isEnabled ? '26px' : '2px',
          transition: 'left 0.2s ease'
        }} />
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px', pt: '16px', borderTop: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: settings.security ? 'var(--text)' : 'var(--text-muted)' }}>
        <Shield size={16} /> Security
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: settings.performance ? 'var(--text)' : 'var(--text-muted)' }}>
        <Zap size={16} /> Performance
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: settings.bestPractices ? 'var(--text)' : 'var(--text-muted)' }}>
        <BookOpen size={16} /> Best Practices
      </div>
    </div>
  </div>
);

const Settings = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Repository Settings</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure how GitGuard AI interacts with your projects.</p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <RepoSetting 
          name="GitGuard-AI/backend" 
          isEnabled={true} 
          settings={{ security: true, performance: true, bestPractices: true }} 
        />
        <RepoSetting 
          name="GitGuard-AI/frontend" 
          isEnabled={true} 
          settings={{ security: true, performance: false, bestPractices: true }} 
        />
        <RepoSetting 
          name="Personal/old-website" 
          isEnabled={false} 
          settings={{ security: false, performance: false, bestPractices: false }} 
        />
      </div>

      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h3 style={{ fontSize: '1.125rem' }}>Add New Repository</h3>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Import more repositories from your GitHub account.</span>
        </div>
        <button className="btn-primary">
          Configure on GitHub
        </button>
      </div>
    </div>
  );
};

export default Settings;
