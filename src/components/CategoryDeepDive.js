import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const CategoryDeepDive = ({ data }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);

  const allCategories = [...new Set(Object.values(data.videoData).flat().map(v => v.category_name))];

  useEffect(() => {
    if (!selectedCategory && allCategories.length > 0) {
      setSelectedCategory(allCategories[0]);
    }
  }, [allCategories, selectedCategory]);

  useEffect(() => {
    setAnimationKey(prevKey => prevKey + 1);
  }, [selectedCategory]);

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const getCategoryData = () => {
    if (!selectedCategory) return { countryPerformance: [], topVideos: [] };

    const filteredVideos = Object.values(data.videoData).flat()
      .filter(video => video.category_name === selectedCategory);

    const countryPerformance = Object.keys(data.videoData).map(country => {
      const countryVideos = filteredVideos.filter(v => v.country === country);
      const totalViews = countryVideos.reduce((sum, v) => sum + v.views, 0);
      return { country, views: totalViews };
    }).sort((a, b) => b.views - a.views);

    const topVideos = filteredVideos.sort((a, b) => b.views - a.views).slice(0, 3);
    
    return { countryPerformance, topVideos };
  };

  const { countryPerformance, topVideos } = getCategoryData();

  const formatNumber = (value) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ffd700' }}>{label}</p>
          <p style={{ margin: '4px 0', color: '#82ca9d' }}>Views: {formatNumber(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2>Category Deep Dive Dashboard</h2>
      
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <select 
          value={selectedCategory || ''} 
          onChange={handleCategoryChange}
          style={{
            padding: '12px 20px',
            borderRadius: '10px',
            border: '1px solid #ccc',
            fontSize: '16px',
            minWidth: '250px',
            background: 'white'
          }}
        >
          {allCategories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              key={animationKey} 
              data={countryPerformance} 
              margin={{ top: 20, right: 30, bottom: 40, left: 40 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 126, 234, 0.1)" />
              <XAxis dataKey="country" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={formatNumber} tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="views" 
                fill="url(#colorGradient)" 
                radius={[4, 4, 0, 0]}
                animationDuration={1500}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.9}/>
                  <stop offset="95%" stopColor="#764ba2" stopOpacity={0.6}/>
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div>
          <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>Top 3 Videos</h3>
          {topVideos.map((video, index) => (
            <div key={index} style={{
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9ff 100%)',
              padding: '15px',
              borderRadius: '10px',
              marginBottom: '15px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
            }}>
              <p style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>
                {video.title.substring(0, 40)}...
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                <span>Views: {formatNumber(video.views)}</span>
                <span>Likes: {formatNumber(video.likes)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryDeepDive;