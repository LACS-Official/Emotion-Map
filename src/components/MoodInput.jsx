import React, { useState, useEffect, useRef } from 'react';
import { Send, MapPin, ChevronUp, ChevronDown, Image as ImageIcon, X, Lock, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const emotions = [
  { id: 'happy', label: '快乐', emoji: '😊', color: '#facc15' },
  { id: 'stress', label: '压力', emoji: '😫', color: '#ef4444' },
  { id: 'sad', label: '悲伤', emoji: '😢', color: '#a855f7' },
  { id: 'calm', label: '平静', emoji: '😌', color: '#3b82f6' },
];

const MoodInput = () => {
  const [mood, setMood] = useState('');
  const [selectedEmotion, setSelectedEmotion] = useState(emotions[0]);
  const [location, setLocation] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const fileInputRef = useRef(null);
  const searchService = useRef(null);
  const geocoder = useRef(null);

  // Removed automatic location request on mount to comply with browser security policies
  // User should click the locate button to trigger handleLocate

  const handleLocate = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newLoc = { lat: latitude, lng: longitude };
          setLocation(newLoc);
          updateAddress(newLoc);
          window.dispatchEvent(new CustomEvent('center-map', { 
            detail: newLoc 
          }));
          setIsLocating(false);
        },
        (err) => {
          console.warn('Location failed:', err);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  const updateAddress = (loc) => {
    if (window.TMap && window.TMap.service) {
      if (!geocoder.current) {
        geocoder.current = new window.TMap.service.Geocoder();
      }
      geocoder.current.getAddress({
        location: new window.TMap.LatLng(loc.lat, loc.lng)
      }).then(result => {
        if (result.status === 0 && result.result) {
          setAddress(`${result.result.address} (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);
        } else {
          setAddress(`未知地点 (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);
        }
      }).catch(err => {
        console.warn('Reverse geocoding failed:', err);
        setAddress(`定位服务异常 (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);
      });
    } else {
      setAddress(`正在获取地址... (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    setIsSearching(true);
    if (window.TMap && window.TMap.service) {
      if (!searchService.current) {
        searchService.current = new window.TMap.service.Suggestion();
      }
      searchService.current.getSuggestions({ 
        keyword: query, 
        region: '全国' 
      }).then(result => {
        if (result.status === 0 && result.data) {
          const formatted = result.data.map(item => ({
            title: item.title,
            address: item.address,
            location: item.location
          }));
          setSuggestions(formatted);
        }
        setIsSearching(false);
      }).catch(err => {
        console.warn('Search service failed:', err);
        setIsSearching(false);
      });
    } else {
      setIsSearching(false);
    }
  };

  const selectSuggestion = (s) => {
    const loc = { lat: s.location.lat, lng: s.location.lng };
    setLocation(loc);
    setAddress(s.address + ' ' + s.title);
    setSearchQuery('');
    setSuggestions([]);
    window.dispatchEvent(new CustomEvent('center-map', { detail: loc }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSend = async () => {
    if (!mood.trim() && !image) return;

    setIsSending(true);
    const formData = new FormData();
    formData.append('message', mood);
    formData.append('type', selectedEmotion.id);
    formData.append('lat', location?.lat || 39.984120);
    formData.append('lng', location?.lng || 116.307484);
    if (image) formData.append('image', image);

    try {
      const response = await fetch('http://localhost:10001/api/mood', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        setMood('');
        setImage(null);
        setImagePreview(null);
        setIsExpanded(false);
        window.dispatchEvent(new CustomEvent('mood-added'));
      } else {
        const data = await response.json();
        alert(data.error || '发送失败');
      }
    } catch (err) {
      console.error('Failed to send mood:', err);
      alert('服务器连接失败');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div 
      className={`mood-input-wrapper ${isExpanded ? 'expanded' : ''}`}
    >
      <div className="input-row">
        <button className="emotion-btn" onClick={() => setIsExpanded(!isExpanded)}>
          {selectedEmotion.emoji}
        </button>
        
        <input 
          type="text" 
          placeholder="分享你此刻的心情..."
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          disabled={isSending}
        />

        <div className="action-btns">
          <button 
            className={`icon-btn locate-trigger ${isLocating ? 'pulsing' : ''}`} 
            onClick={handleLocate}
            title="获取定位"
            disabled={isSending}
          >
            <Crosshair size={20} color="#3b82f6" />
          </button>

          <input 
            type="file" 
            accept="image/*" 
            style={{ display: 'none' }} 
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button className="icon-btn" onClick={() => fileInputRef.current.click()}>
            <ImageIcon size={20} color={image ? "#3b82f6" : "#64748b"} />
          </button>
          
          <button className="send-btn" onClick={handleSend} disabled={isSending}>
            <Send size={18} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="expanded-panel"
          >
            <div className="emotion-list">
              {emotions.map(e => (
                <button 
                  key={e.id}
                  className={`emotion-item ${selectedEmotion.id === e.id ? 'active' : ''}`}
                  onClick={() => setSelectedEmotion(e)}
                >
                  <span className="emoji">{e.emoji}</span>
                  <span className="label">{e.label}</span>
                </button>
              ))}
            </div>

            <div className="location-section">
              <div className="search-box">
                <MapPin size={16} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="搜索地点或长按地图选择位置..." 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {isSearching && <div className="search-loader"></div>}
              </div>
              
              {suggestions.length > 0 && (
                <div className="suggestion-list">
                  {suggestions.map((s, idx) => (
                    <div key={idx} className="suggestion-item" onClick={() => selectSuggestion(s)}>
                      <div className="s-title">{s.title}</div>
                      <div className="s-address">{s.address}</div>
                    </div>
                  ))}
                </div>
              )}

              {address && (
                <div className="current-address">
                  <MapPin size={12} />
                  <span>{address}</span>
                </div>
              )}
            </div>

            {imagePreview && (
              <div className="image-preview-box">
                <img src={imagePreview} alt="preview" />
                <button className="remove-img" onClick={() => { setImage(null); setImagePreview(null); }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .mood-input-wrapper {
          width: 600px;
          background: white;
          border-radius: 24px;
          box-shadow: 0 15px 45px rgba(0,0,0,0.12);
          border: 1px solid rgba(0,0,0,0.08);
          position: relative;
          padding: 10px;
          overflow: hidden;
        }
        .lock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(4px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .lock-content {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #3b82f6;
          font-weight: 700;
          font-size: 1.05rem;
          padding: 12px 24px;
          background: #eff6ff;
          border-radius: 50px;
          border: 1px solid rgba(59, 130, 246, 0.2);
        }
        .input-row { display: flex; align-items: center; gap: 12px; padding: 4px 12px; }
        .emotion-btn { 
          font-size: 1.6rem; 
          background: #f8fafc; 
          border: 1px solid #e2e8f0; 
          width: 48px; 
          height: 48px; 
          border-radius: 14px; 
          cursor: pointer; 
          transition: all 0.2s;
        }
        .emotion-btn:hover { background: #f1f5f9; transform: scale(1.05); }
        input { 
          flex: 1; 
          border: none; 
          outline: none; 
          font-size: 1.05rem; 
          padding: 12px 0;
          color: #1e293b;
          font-weight: 500;
        }
        input::placeholder { color: #94a3b8; }
        .action-btns { display: flex; align-items: center; gap: 8px; }
        .icon-btn { 
          background: none; 
          border: none; 
          padding: 10px; 
          cursor: pointer; 
          border-radius: 12px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .icon-btn:hover { background: #f1f5f9; }
        .icon-btn.pulsing { animation: pulse-icon 1.5s infinite; }
        @keyframes pulse-icon { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.5; } 100% { transform: scale(1); opacity: 1; } }

        .send-btn {
          background: #3b82f6;
          color: white;
          border: none;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        .send-btn:hover { background: #2563eb; transform: scale(1.05); box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4); }
        .send-btn:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

        .expanded-panel { padding: 18px 12px; border-top: 1px solid #f1f5f9; margin-top: 8px; }
        .emotion-list { display: flex; gap: 15px; margin-bottom: 15px; }
        .emotion-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px;
          border-radius: 14px;
          background: #f8fafc;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
        }
        .emotion-item:hover { background: #f1f5f9; }
        .emotion-item.active { background: #eff6ff; border-color: #3b82f6; }
        .emotion-item .emoji { font-size: 1.4rem; }
        .emotion-item .label { font-size: 0.8rem; font-weight: 700; color: #64748b; }
        .emotion-item.active .label { color: #3b82f6; }

        .image-preview-box { position: relative; width: 120px; height: 120px; border-radius: 14px; overflow: hidden; margin-top: 12px; border: 2px solid #e2e8f0; }
        .image-preview-box img { width: 100%; height: 100%; object-fit: cover; }
        .remove-img {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.6);
          color: white;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .location-section { margin-top: 15px; border-top: 1px solid #f1f5f9; padding-top: 15px; }
        .search-box { 
          display: flex; 
          align-items: center; 
          gap: 10px; 
          background: #f8fafc; 
          border-radius: 12px; 
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          position: relative;
        }
        .search-box input { padding: 0; font-size: 0.9rem; background: transparent; }
        .search-icon { color: #94a3b8; }
        .search-loader {
          width: 16px;
          height: 16px;
          border: 2px solid #e2e8f0;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        .suggestion-list {
          margin-top: 8px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
        .suggestion-item {
          padding: 10px 15px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #f1f5f9;
        }
        .suggestion-item:last-child { border-bottom: none; }
        .suggestion-item:hover { background: #f8fafc; }
        .s-title { font-size: 0.9rem; font-weight: 700; color: #1e293b; }
        .s-address { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

        .current-address {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 10px;
          color: #3b82f6;
          font-size: 0.8rem;
          font-weight: 500;
          padding: 0 4px;
        }
      `}} />
    </motion.div>
  );
};

export default MoodInput;
