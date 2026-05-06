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
  const [vizMode, setVizMode] = useState('cluster'); // 默认使用聚合模式，可以看到具体备注
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
      const response = await fetch(`http://localhost:10001/api/emotions?type=${activeFilter}`);
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
                  ${emotion.image_url ? `<img src="http://localhost:10001${emotion.image_url}" style="width: 100%; border-radius: 10px; margin-top: 8px; border: 1px solid #e2e8f0; display: block;" />` : ''}
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
      
      if (typeof mapInstance.current.setMapStyleId === 'function') {
        mapInstance.current.setMapStyleId(mapStyle);
      }
      
      // Group emotions by location (5 decimal places)
      const grouped = emotions.reduce((acc, curr) => {
        const lat = Number(curr.lat);
        const lng = Number(curr.lng);
        if (isNaN(lat) || isNaN(lng)) return acc;
        
        const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
        if (!acc[key]) {
          acc[key] = {
            id: key,
            position: { lat, lng },
            items: [],
            counts: {}
          };
        }
        acc[key].items.push(curr);
        acc[key].counts[curr.type] = (acc[key].counts[curr.type] || 0) + 1;
        return acc;
      }, {});

      const groupedArray = Object.values(grouped).map(group => {
        const total = group.items.length;
        const sortedTypes = Object.entries(group.counts)
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => ({
            type,
            count,
            probability: Math.round((count / total) * 100)
          }));
        
        return {
          ...group,
          topType: sortedTypes[0].type,
          probability: sortedTypes[0].probability,
          sortedTypes,
          total
        };
      });

      try {
        if (TMap.visual && TMap.visual.Layer && TMap.visual.Layer.Heatmap) {
          const typeHeatmapData = emotions.reduce((acc, curr) => {
            if (!acc[curr.type]) acc[curr.type] = [];
            acc[curr.type].push({ 
              lat: Number(curr.lat), 
              lng: Number(curr.lng), 
              value: curr.intensity || 50 
            });
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
              heatmapLayers.current[type].setData(typeHeatmapData[type] || []);
              heatmapLayers.current[type].show();
            } else {
              heatmapLayers.current[type].hide();
            }
          });
        }

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
            const clusterData = emotions.map(e => ({ 
              lat: Number(e.lat), 
              lng: Number(e.lng), 
              value: 1 
            }));
            clusterLayer.current.setData(clusterData);
            clusterLayer.current.show();
          } else {
            clusterLayer.current.hide();
          }
        }
      } catch (e) {}

      try {
        if (TMap.MultiLabel) {
          const labels = groupedArray.map(group => {
            const hasImage = group.items.some(item => item.image_url);
            const emoji = emotionConfig[group.topType]?.emoji || '😊';
            let content = emoji;
            const latestMsg = group.items[group.items.length - 1].message;
            const displayMsg = latestMsg ? (latestMsg.length > 8 ? latestMsg.substring(0, 8) + '...' : latestMsg) : '记录';
            
            if (group.total > 1) {
              content += ` ${group.total}条: ${displayMsg}`;
            } else {
              content += ` ${displayMsg}`;
            }

            if (hasImage) {
              content += ' 🖼️';
            }

            return {
              id: 'g' + group.id,
              position: new TMap.LatLng(group.position.lat, group.position.lng),
              content: content,
              styleId: 'labelStyle'
            };
          });

          if (!labelLayer.current) {
            labelLayer.current = new TMap.MultiLabel({
              id: 'emotion-labels',
              map: mapInstance.current,
              styles: {
                labelStyle: new TMap.LabelStyle({
                  color: '#1e293b',
                  size: 14,
                  offset: { x: 0, y: -25 },
                  alignment: 'center',
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  borderWidth: 2,
                  borderColor: '#e2e8f0',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                  lineHeight: 1.4
                })
              },
              geometries: labels
            });
          } else {
            labelLayer.current.setGeometries(labels);
          }

          // Update click handler for grouped labels
          const handleClick = (evt) => {
            if (labelLayer.current) {
              const label = labelLayer.current.getGeometryById(evt.geometryId);
              if (label) {
                const groupKey = evt.geometryId.substring(1);
                const group = groupedArray.find(g => g.id === groupKey);
                if (group) {
                  let content = `<div style="padding: 16px; min-width: 240px; max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                    <div style="border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 12px;">
                      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                        <span style="font-weight: 800; color: #0f172a; font-size: 15px;">情绪分布</span>
                        <span style="background: #eff6ff; color: #3b82f6; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700;">${group.total} 条记录</span>
                      </div>
                      <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                        ${group.sortedTypes.map(t => `
                          <div style="display: flex; align-items: center; gap: 4px; background: #f8fafc; padding: 4px 8px; border-radius: 8px; border: 1px solid #e2e8f0;">
                            <span>${emotionConfig[t.type]?.emoji}</span>
                            <span style="font-size: 12px; font-weight: 600; color: #475569;">${t.probability}%</span>
                          </div>
                        `).join('')}
                      </div>
                    </div>
                    <div style="max-height: 200px; overflow-y: auto; padding-right: 4px;" class="custom-scroll">
                      ${group.items.map((item, idx) => `
                        <div style="margin-bottom: 12px; padding-bottom: 12px; border-bottom: ${idx === group.items.length - 1 ? 'none' : '1px dashed #f1f5f9'}">
                          <div style="display: flex; align-items: flex-start; gap: 10px;">
                            <span style="font-size: 1.2rem; margin-top: 2px;">${emotionConfig[item.type]?.emoji}</span>
                            <div style="flex: 1;">
                              <div style="font-size: 13px; color: #334155; line-height: 1.5; font-weight: 500;">${item.message || '分享了心情'}</div>
                              ${item.image_url ? `
                                <div style="margin-top: 8px; cursor: zoom-in;" onclick="window.showImageFull('http://localhost:10001${item.image_url}')">
                                  <img src="http://localhost:10001${item.image_url}" style="width: 100%; border-radius: 8px; border: 1px solid #e2e8f0; display: block; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'" />
                                </div>` : ''}
                              <div style="font-size: 10px; color: #94a3b8; margin-top: 6px;">${new Date(item.timestamp).toLocaleString()}</div>
                            </div>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>`;
                  infoWindow.current.setContent(content);
                  infoWindow.current.setPosition(evt.latLng);
                  infoWindow.current.open();
                }
              } else {
                infoWindow.current.close();
              }
            }
          };

          mapInstance.current.on('click', handleClick);
          return () => {
            if (mapInstance.current) {
              mapInstance.current.off('click', handleClick);
            }
          };
        }
      } catch (e) {
        console.error('Labels/InfoWindow update failed:', e);
      }
    }
  }, [emotions, scriptLoaded, vizMode]);

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
