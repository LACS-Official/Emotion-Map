import React, { useState, useEffect } from 'react';
import MapContainer from './components/MapContainer';
import NavBar from './components/NavBar';
import EmotionFilter from './components/EmotionFilter';
import DataPanel from './components/DataPanel';
import MoodInput from './components/MoodInput';
import ImageModal from './components/ImageModal';
import './App.css';

function App() {
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    // Clear any existing auth data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  return (
    <div className="app-container light">
      <NavBar />
      
      <main className="main-content">
        <MapContainer activeFilter={activeFilter} />
        
        <div className="ui-overlay">
          <div className="left-controls">
            <EmotionFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
          </div>
          
          <div className="right-panel">
            <DataPanel activeFilter={activeFilter} />
          </div>
          
          <div className="bottom-center">
            <MoodInput />
          </div>
        </div>
      </main>

      <ImageModal />
    </div>
  );
}

export default App;
