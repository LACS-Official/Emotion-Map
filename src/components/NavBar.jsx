import React from 'react';
import { Map, User, LogOut, LogIn, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const NavBar = () => {
  return (
    <nav className="navbar-container glass light">
      <div className="nav-logo">
        <Map className="logo-icon" />
        <h1>城市情绪地图 <span className="logo-badge">Emotion Map</span></h1>
      </div>

      <div className="nav-actions">
        {/* Auth actions removed */}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .navbar-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 40px;
          z-index: 1000;
          border-bottom: 1px solid rgba(0,0,0,0.05);
          background: rgba(255, 255, 255, 0.7) !important;
          backdrop-filter: blur(20px);
        }
        .nav-logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon { color: #3b82f6; width: 32px; height: 32px; }
        .nav-logo h1 { font-size: 1.4rem; font-weight: 700; color: #1e293b; }
        .logo-badge { font-size: 0.8rem; font-weight: 400; color: #64748b; opacity: 0.8; }
        
        .nav-actions { display: flex; align-items: center; gap: 20px; }
        
        .user-profile { display: flex; align-items: center; gap: 12px; }
        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(0,0,0,0.03);
          border-radius: 50px;
          color: #1e293b;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .admin-clear-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fee2e2;
          color: #ef4444;
          border: 1px solid #fecaca;
          padding: 8px 16px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .admin-clear-btn:hover { background: #fecaca; transform: scale(1.05); }
        
        .logout-btn, .login-trigger-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #3b82f6;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        .logout-btn { background: #f1f5f9; color: #64748b; }
        .logout-btn:hover { background: #e2e8f0; color: #1e293b; }
        .login-trigger-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }
      `}} />
    </nav>
  );
};

export default NavBar;
