import React, { useEffect, useRef, useState } from 'react';

const MapContainer = ({ activeFilter }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const heatmapLayers = useRef({});
  const clusterLayer = useRef(null);
  const labelLayer = useRef(null);
  const infoWindow = useRef(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [emotions, setEmotions] = useState([]);
  const vizMode = 'heatmap';
  const mapStyle = 'style1';

  const emotionConfig = {
    happy: { color: '#facc15', emoji: '😊', gradient: { 0.2: 'rgba(250, 204, 21, 0)', 0.5: 'rgba(250, 204, 21, 0.5)', 1.0: '#facc15' } },
    stress: { color: '#ef4444', emoji: '😫', gradient: { 0.2: 'rgba(239, 68, 68, 0)', 0.5: 'rgba(239, 68, 68, 0.5)', 1.0: '#ef4444' } },
    sad: { color: '#a855f7', emoji: '😢', gradient: { 0.2: 'rgba(168, 85, 247, 0)', 0.5: 'rgba(168, 85, 247, 0.5)', 1.0: '#a855f7' } },
    calm: { color: '#3b82f6', emoji: '😌', gradient: { 0.2: 'rgba(59, 130, 246, 0)', 0.5: 'rgba(59, 130, 246, 0.5)', 1.0: '#3b82f6' } },
  };

  useEffect(() => {
    if (window.TMap) {
      setScriptLoaded(true);
      return;
    }
    const script = document.createElement('script');
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${import.meta.env.VITE_TMAP_KEY}&libraries=visual,service`;
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setScriptLoaded(true);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch (e) {} };
  }, []);

  const fetchEmotions = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/emotions?type=${activeFilter}`);
      const data = await response.json();
      const validData = data.map(item => ({
        ...item,
        lat: Number(item.lat),
        lng: Number(item.lng)
      })).filter(item => 
        !isNaN(item.lat) && 
        !isNaN(item.lng) && 
        item.lat >= -90 && item.lat <= 90 && 
        item.lng >= -180 && item.lng <= 180 &&
        item.lat !== 0 && item.lng !== 0
      );
      setEmotions(validData);
    } catch (err) {
      console.error('Failed to fetch emotions:', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmotions();
    }, 1000);
    const interval = setInterval(fetchEmotions, 10000);
    return () => {
        clearTimeout(timer);
        clearInterval(interval);
    };
  }, [activeFilter]);

  useEffect(() => {
    const handleMoodAdded = () => fetchEmotions();
    const handleCenterMap = (e) => {
      if (mapInstance.current && window.TMap && e.detail) {
        const { lat, lng } = e.detail;
        const TMap = window.TMap;
        try {
          if (TMap.LatLng) {
            const center = new TMap.LatLng(lat, lng);
            mapInstance.current.setCenter(center);
            mapInstance.current.setZoom(14);
          }
        } catch (err) { console.error(err); }
      }
    };

    window.addEventListener('mood-added', handleMoodAdded);
    window.addEventListener('center-map', handleCenterMap);
    return () => {
      window.removeEventListener('mood-added', handleMoodAdded);
      window.removeEventListener('center-map', handleCenterMap);
    };
  }, []);

  useEffect(() => {
    if (scriptLoaded && mapRef.current && !mapInstance.current && window.TMap) {
      try {
        const TMap = window.TMap;
        const center = new TMap.LatLng(39.984120, 116.307484);
        mapInstance.current = new TMap.Map(mapRef.current, {
          center: center,
          zoom: 12,
          mapStyleId: mapStyle,
          control: {
            zoom: {
              position: window.TMap?.constants?.CONTROL_POSITION?.BOTTOM_LEFT || 'BOTTOM_LEFT',
            }
          }
        });

        infoWindow.current = new TMap.InfoWindow({
          map: mapInstance.current,
          position: center,
          visible: false,
          offset: { x: 0, y: -30 }
        });

        mapInstance.current.on('click', (evt) => {
          if (labelLayer.current) {
            const label = labelLayer.current.getGeometryById(evt.geometryId);
            if (label) {
              const emotion = emotions.find(e => 'l' + e.id === evt.geometryId);
              if (emotion) {
                let content = `<div style="padding: 12px; min-width: 160px; font-family: sans-serif;">
                  <div style="font-weight: 700; color: #1e293b; margin-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 1.4rem;">${emotionConfig[emotion.type]?.emoji || '😊'}</span>
                    <span style="font-size: 14px;">${emotion.message || '记录心情'}</span>
                  </div>
                  ${emotion.image_url ? `<img src="http://localhost:3001${emotion.image_url}" style="width: 100%; border-radius: 10px; margin-top: 8px; border: 1px solid #e2e8f0; display: block;" />` : ''}
                  <div style="font-size: 11px; color: #94a3b8; margin-top: 10px; text-align: right; border-top: 1px solid #f1f5f9; padding-top: 6px;">${new Date(emotion.timestamp).toLocaleString()}</div>
                </div>`;
                infoWindow.current.setContent(content);
                infoWindow.current.setPosition(evt.latLng);
                infoWindow.current.open();
              }
            } else {
              infoWindow.current.close();
            }
          }
        });

      } catch (e) {
        console.error('Map initialization failed:', e);
      }
    }
  }, [scriptLoaded]);

  useEffect(() => {
    if (mapInstance.current && window.TMap) {
      const TMap = window.TMap;
      
      // Update Map Style - Safety check for method existence
      if (typeof mapInstance.current.setMapStyleId === 'function') {
        mapInstance.current.setMapStyleId(mapStyle);
      }
      
      try {
        if (TMap.visual && TMap.visual.Layer && TMap.visual.Layer.Heatmap) {
          const grouped = emotions.reduce((acc, curr) => {
            if (!acc[curr.type]) acc[curr.type] = [];
            acc[curr.type].push({ lat: curr.lat, lng: curr.lng, value: curr.intensity || 50 });
            return acc;
          }, {});

          Object.keys(emotionConfig).forEach(type => {
            if (!heatmapLayers.current[type]) {
              heatmapLayers.current[type] = new TMap.visual.Layer.Heatmap({
                map: mapInstance.current,
                radius: 35,
                gradientColor: emotionConfig[type].gradient
              });
            }
            if (vizMode === 'heatmap') {
              heatmapLayers.current[type].setData(grouped[type] || []);
              heatmapLayers.current[type].show();
            } else {
              heatmapLayers.current[type].hide();
            }
          });
        }

        // Cluster Implementation
        if (TMap.visual && TMap.visual.Layer && TMap.visual.Layer.Cluster) {
          if (!clusterLayer.current) {
            clusterLayer.current = new TMap.visual.Layer.Cluster({
              map: mapInstance.current,
              enableCluster: true,
              radius: 40,
              styles: {
                default: {
                  width: 50,
                  height: 50,
                  src: 'https://mapapi.qq.com/web/lbs/visual/img/cluster1.png',
                  textColor: '#ffffff'
                }
              }
            });
          }
          if (vizMode === 'cluster') {
            const clusterData = emotions.map(e => ({ lat: e.lat, lng: e.lng, value: 1 }));
            clusterLayer.current.setData(clusterData);
            clusterLayer.current.show();
          } else {
            clusterLayer.current.hide();
          }
        }
      } catch (e) {}

      try {
        if (TMap.MultiLabel) {
          const labels = emotions
            .filter(e => e.message || e.image_url)
            .map(e => {
              const lat = parseFloat(e.lat);
              const lng = parseFloat(e.lng);
              if (isNaN(lat) || isNaN(lng)) return null;
              
              return {
                id: 'l' + e.id,
                position: { lat, lng },
                content: `${emotionConfig[e.type]?.emoji || '😊'}\n${e.message || '记录'}`,
                styleId: 'labelStyle'
              };
            }).filter(l => l !== null);

          if (!labelLayer.current) {
            labelLayer.current = new TMap.MultiLabel({
              id: 'emotion-labels',
              map: mapInstance.current,
              styles: {
                labelStyle: new TMap.LabelStyle({
                  color: '#1e293b',
                  size: 15,
                  offset: { x: 0, y: -25 },
                  alignment: 'center',
                  padding: 12,
                  backgroundColor: '#ffffff',
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)'
                })
              },
              geometries: labels
            });
          } else {
            setTimeout(() => {
              if (labelLayer.current) {
                if (typeof labelLayer.current.setGeometries === 'function') {
                  labelLayer.current.setGeometries(labels);
                } else if (typeof labelLayer.current.setData === 'function') {
                  labelLayer.current.setData(labels);
                }
              }
            }, 0);
          }
        }
      } catch (e) {}
    }
  }, [emotions, scriptLoaded]);

  return (
    <div className="map-wrapper">
      <div ref={mapRef} className="map-instance">
        {!window.TMap && <div className="map-placeholder">正在加载地图引擎...</div>}
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .map-wrapper { position: absolute; inset: 0; z-index: 0; background: #f8fafc; overflow: hidden; }
        .map-instance { width: 100%; height: 100%; }
        .map-placeholder { display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b; font-size: 0.9rem; }
        .logo-text, .tmap-scale-control { display: none !important; }
        .tmap-infowindow { border-radius: 18px !important; box-shadow: 0 15px 40px rgba(0,0,0,0.15) !important; border: 1px solid #e2e8f0 !important; overflow: hidden; }
        .tmap-infowindow-content { padding: 0 !important; background: white !important; }
      `}} />
    </div>
  );
};

export default MapContainer;
