import React from 'react';
import { motion } from 'framer-motion';

const emotions = [
  { id: 'all', label: '全部', emoji: '🌏', color: '#3b82f6' },
  { id: 'happy', label: '快乐', emoji: '😊', color: '#eab308' },
  { id: 'stress', label: '压力', emoji: '😫', color: '#ef4444' },
  { id: 'sad', label: '悲伤', emoji: '😢', color: '#a855f7' },
  { id: 'calm', label: '平静', emoji: '😌', color: '#3b82f6' },
];

const EmotionFilter = ({ activeFilter, onFilterChange }) => {
  return (
    <div className="filter-container glass light">
      {emotions.map((item) => (
        <motion.button
          key={item.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`filter-btn ${activeFilter === item.id ? 'active' : ''}`}
          onClick={() => onFilterChange(item.id)}
          style={{ '--btn-accent': item.color }}
        >
          <span className="emoji">{item.emoji}</span>
          <span className="label">{item.label}</span>
          {activeFilter === item.id && (
            <motion.div 
              layoutId="active-bg" 
              className="active-indicator"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
        </motion.button>
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        .filter-container {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 8px;
          pointer-events: auto;
          background: rgba(255, 255, 255, 0.7) !important;
          border: 1px solid rgba(0,0,0,0.05);
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .filter-btn {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 12px;
          transition: all 0.3s ease;
          width: 140px;
        }
        .filter-btn:hover {
          color: var(--btn-accent);
          background: rgba(0,0,0,0.02);
        }
        .filter-btn.active {
          color: var(--btn-accent);
        }
        .emoji {
          font-size: 1.2rem;
          z-index: 1;
        }
        .label {
          z-index: 1;
        }
        .active-indicator {
          position: absolute;
          inset: 0;
          background: white;
          border-radius: 12px;
          z-index: 0;
          border-left: 4px solid var(--btn-accent);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}} />
    </div>
  );
};

export default EmotionFilter;
