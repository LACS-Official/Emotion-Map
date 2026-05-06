import React from 'react';

const EmotionMarker = ({ emotion }) => {
  const emotionConfig = {
    happy: { color: '#facc15', emoji: '😊' },
    stress: { color: '#ef4444', emoji: '😫' },
    sad: { color: '#a855f7', emoji: '😢' },
    calm: { color: '#3b82f6', emoji: '😌' },
  };

  const config = emotionConfig[emotion.type] || emotionConfig.happy;
  
  return (
    <div className="trae-browser-inspect-draggable emotion-marker">
      <div className="emotion-emoji">{config.emoji}</div>
      <div className="emotion-remark">{emotion.message || '记录心情'}</div>
      <style jsx>{`
        .emotion-marker {
          min-width: 100px;
          white-space: nowrap;
          background-color: white;
          text-align: center;
          padding: 25px 10px 12px;
          border-radius: 6px;
          box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 4px 0px;
          border: 2px solid ${config.color};
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .emotion-emoji {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .emotion-remark {
          font-size: 14px;
          color: #1e293b;
          font-weight: 500;
          line-height: 1.4;
        }
      `}</style>
    </div>
  );
};

export default EmotionMarker;