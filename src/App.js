import React, { useState, useEffect } from 'react';
import './App.css';
import DataLoader from './utils/DataLoader';
import Navigation from './components/Navigation';
import Overview from './components/Overview';
import BarChart from './components/BarChart';
import PieChart from './components/PieChart';
import ScatterPlot from './components/ScatterPlot';
import Timeline from './components/Timeline';
import CategoryDeepDive from './components/CategoryDeepDive';
import Treemap from './components/Treemap';
import EngagementChart from './components/EngagementChart';

function App() {
  const [currentView, setCurrentView] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const dataLoader = new DataLoader();
        await dataLoader.init(['US', 'CA', 'GB', 'DE', 'FR', 'IN', 'JP', 'KR', 'MX', 'RU']);
        setData(dataLoader);
        setLoading(false);
      } catch (err) {
        setError('Failed to load data: ' + err.message);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const renderVisualization = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <h3>Loading Data...</h3>
          <p>Please wait while we load the YouTube trending data.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      );
    }

    switch (currentView) {
      case 'overview':
        return <Overview data={data} />;
      case 'bar-chart':
        return <BarChart data={data.getViewsByCountry()} />;
      case 'pie-chart':
        return <PieChart data={data.getCategoryDistribution()} />;
      case 'scatter':
        return <ScatterPlot data={data.getViewsVsLikes(300)} />;
      case 'timeline':
        return <Timeline data={data.getTimelineData()} />;
      case 'category-deep-dive':
        return <CategoryDeepDive data={data} />;
      case 'treemap':
        return <Treemap data={data.getTopChannels(15)} />;
      case 'engagement':
        return <EngagementChart data={data.getEngagementMetrics()} />;
      default:
        return <Overview data={data} />;
    }
  };

  return (
    <div className="app">
      <div className="container">
        <header>
          <h1>YouTube Trending Data Visualization</h1>
          <p>Interactive visualizations of YouTube trending videos across different countries</p>
        </header>

        <Navigation 
          currentView={currentView} 
          onViewChange={setCurrentView}
          disabled={loading}
        />

        <main className="visualization-container">
          {renderVisualization()}
        </main>

        <footer>
          <p>&copy; 2024 Data Visualization Project - Web Content Management (React Version)</p>
        </footer>
      </div>
    </div>
  );
}

export default App;