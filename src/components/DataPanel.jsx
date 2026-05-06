import React, { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { TrendingUp, Smile, AlertCircle, ChevronRight, ChevronLeft, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DataPanel = () => {
  const chartRef = useRef(null);
  const [stats, setStats] = useState([]);
  const [summary, setSummary] = useState({
    happiestArea: '朝阳区 蓝色港湾',
    mostStressedArea: '海淀区 中关村'
  });
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:10001/api/stats');
        const data = await response.json();
        setStats(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let myChart = null;
    let resizeTimer = null;
    let retryTimer = null;

    const handleResize = () => myChart?.resize();

    const initChart = () => {
      if (!chartRef.current || isCollapsed || stats.length === 0) return;
      
      if (chartRef.current.clientWidth === 0 || chartRef.current.clientHeight === 0) {
        retryTimer = setTimeout(initChart, 100);
        return;
      }

      myChart = echarts.init(chartRef.current);
      const option = {
        backgroundColor: 'transparent',
        grid: { left: '10%', right: '5%', bottom: '15%', top: '15%' },
        xAxis: {
          type: 'category',
          data: stats.map(d => d.type === 'happy' ? '快乐' : d.type === 'stress' ? '压力' : d.type === 'sad' ? '悲伤' : '平静'),
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#64748b', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { color: 'rgba(0,0,0,0.05)' } },
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        series: [
          {
            data: stats.map(d => d.count),
            type: 'bar',
            barWidth: '40%',
            itemStyle: {
              color: (params) => {
                const colors = { happy: '#facc15', stress: '#ef4444', sad: '#a855f7', calm: '#3b82f6' };
                return colors[stats[params.dataIndex].type] || '#3b82f6';
              },
              borderRadius: [6, 6, 0, 0]
            }
          }
        ]
      };
      myChart.setOption(option);
      window.addEventListener('resize', handleResize);
      resizeTimer = setTimeout(() => myChart?.resize(), 500);
    };

    initChart();

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      clearTimeout(retryTimer);
      if (myChart) {
        myChart.dispose();
      }
    };
  }, [stats, isCollapsed]);

  return (
    <motion.div 
      layout
      initial={false}
      animate={{ 
        width: isCollapsed ? '64px' : '380px',
        height: isCollapsed ? '64px' : 'auto'
      }}
      className={`data-panel glass light ${isCollapsed ? 'collapsed' : ''}`}
    >
      <div className="panel-header" onClick={() => setIsCollapsed(!isCollapsed)}>
        {isCollapsed ? <BarChart3 size={24} /> : <TrendingUp size={18} />}
        {!isCollapsed && <h2>情绪实时统计</h2>}
        <button className="toggle-btn">
          {isCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
      </div>
      
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="panel-content"
          >
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon happy">
                  <Smile size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">今日最快乐区域</span>
                  <span className="stat-value">{summary.happiestArea}</span>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon stress">
                  <AlertCircle size={20} />
                </div>
                <div className="stat-info">
                  <span className="stat-label">最有压力区域</span>
                  <span className="stat-value">{summary.mostStressedArea}</span>
                </div>
              </div>
            </div>
            
            <div className="chart-section">
              <h3>全城情绪分布 (实时)</h3>
              <div ref={chartRef} className="chart-container"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        .data-panel { 
          height: 100%; 
          padding: 24px; 
          display: flex; 
          flex-direction: column; 
          gap: 24px; 
          background: rgba(255, 255, 255, 0.7) !important; 
          color: #1e293b; 
          overflow: hidden;
          transition: padding 0.3s;
        }
        .data-panel.collapsed {
          padding: 18px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
        }
        .panel-header { display: flex; align-items: center; gap: 10px; color: #3b82f6; cursor: pointer; position: relative; }
        .panel-header h2 { font-size: 1.1rem; font-weight: 700; color: #1e293b; flex: 1; }
        .toggle-btn {
          background: #f1f5f9;
          border: none;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
        }
        .collapsed .toggle-btn {
          position: absolute;
          top: -10px;
          right: -10px;
          background: #3b82f6;
          color: white;
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        .toggle-btn:hover { background: #e2e8f0; }
        .panel-content { display: flex; flex-direction: column; gap: 24px; flex: 1; margin-top: 24px; }
        .stats-grid { display: flex; flex-direction: column; gap: 16px; }
        .stat-card { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          padding: 16px; 
          background: white; 
          border-radius: 16px; 
          border: 1px solid rgba(0, 0, 0, 0.05);
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
        .stat-icon { width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.happy { background: #fef9c3; color: #ca8a04; }
        .stat-icon.stress { background: #fee2e2; color: #dc2626; }
        .stat-info { display: flex; flex-direction: column; }
        .stat-label { font-size: 0.75rem; color: #64748b; margin-bottom: 4px; }
        .stat-value { font-size: 0.95rem; font-weight: 600; color: #1e293b; }
        .chart-section { flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .chart-section h3 { font-size: 0.85rem; color: #64748b; font-weight: 600; }
        .chart-container { flex: 1; min-height: 200px; width: 100%; }
      `}} />
    </motion.div>
  );
};

export default DataPanel;
