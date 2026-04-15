import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Settings, ShieldCheck, LogOut, CreditCard } from 'lucide-react';

const Layout = () => {
  return (
    <div className="layout-container" style={{ display: 'flex', minHeight: '100vh' }}>
      <div className="bg-gradient"></div>
      
      {/* Sidebar */}
      <aside style={{
        width: '260px',
        borderRight: '1px solid var(--border)',
        padding: '32px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '40px',
        backgroundColor: 'rgba(9, 9, 11, 0.5)',
        backdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        height: '100vh'
      }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={20} color="white" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.05em' }}>GitGuard AI</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
          <NavLink to="/dashboard" className="nav-link">
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          <NavLink to="/settings" className="nav-link">
            <Settings size={20} />
            Settings
          </NavLink>
          <NavLink to="/upgrade" className="nav-link">
            <CreditCard size={20} />
            Upgrade Plan
          </NavLink>
        </nav>

        <button className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <LogOut size={20} />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '48px', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
