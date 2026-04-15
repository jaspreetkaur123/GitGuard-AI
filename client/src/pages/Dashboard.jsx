import React from 'react';
import { Activity, ShieldAlert, Cpu, CheckCircle } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{title}</span>
      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `rgba(${color}, 0.1)`, color: `rgb(${color})` }}>
        <Icon size={20} />
      </div>
    </div>
    <span style={{ fontSize: '1.875rem', fontWeight: 700 }}>{value}</span>
  </div>
);

const Dashboard = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <header>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back! Here's what GitGuard AI has found recently.</p>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
        <StatCard title="Total PRs Reviewed" value="128" icon={Activity} color="129, 140, 248" />
        <StatCard title="Security Risks Averted" value="42" icon={ShieldAlert} color="239, 68, 68" />
        <StatCard title="Performance Gains" value="12%" icon={Cpu} color="34, 211, 238" />
        <StatCard title="Checks Passed" value="94%" icon={CheckCircle} color="74, 222, 128" />
      </div>

      {/* Recent Activity */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <h2 style={{ fontSize: '1.25rem' }}>Recent Review Logs</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingBottom: '16px',
              borderBottom: i !== 3 ? '1px solid var(--border)' : 'none'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontWeight: 600 }}>Fix: Optimize database query in user.service.js</span>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Repo: GitGuard-AI/backend • PR #42</span>
              </div>
              <span className="badge-success">Success</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
