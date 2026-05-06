import React, { useState, useEffect } from 'react';
import { X, ZoomIn, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ImageModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState('');

  useEffect(() => {
    // Expose global function for the map's HTML strings to call
    window.showImageFull = (url) => {
      setImgSrc(url);
      setIsOpen(true);
    };

    return () => {
      delete window.showImageFull;
    };
  }, []);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imgSrc;
    link.download = `emotion-map-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="image-modal-overlay"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="image-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-toolbar">
              <button onClick={handleDownload} title="下载图片">
                <Download size={20} />
              </button>
              <button onClick={() => setIsOpen(false)} title="关闭">
                <X size={20} />
              </button>
            </div>
            
            <div className="image-wrapper">
              <img src={imgSrc} alt="Full size" />
            </div>
          </motion.div>

          <style dangerouslySetInnerHTML={{ __html: `
            .image-modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.85);
              backdrop-filter: blur(8px);
              z-index: 9999;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .image-modal-content {
              position: relative;
              max-width: 90vw;
              max-height: 90vh;
              background: #fff;
              border-radius: 20px;
              overflow: hidden;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            }
            .modal-toolbar {
              position: absolute;
              top: 15px;
              right: 15px;
              display: flex;
              gap: 10px;
              z-index: 10;
            }
            .modal-toolbar button {
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.9);
              border: none;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              color: #1e293b;
              transition: all 0.2s;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .modal-toolbar button:hover {
              transform: scale(1.1);
              background: #fff;
            }
            .image-wrapper {
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f8fafc;
            }
            .image-wrapper img {
              max-width: 100%;
              max-height: 85vh;
              object-fit: contain;
              display: block;
            }
          `}} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageModal;
