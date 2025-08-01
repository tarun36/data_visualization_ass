import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ScatterPlot = ({ data }) => {
  const [hoveredCountry, setHoveredCountry] = useState(null);
  
  // Group data by country for different series
  const groupedData = data.reduce((acc, item) => {
    if (!acc[item.country]) {
      acc[item.country] = [];
    }
    acc[item.country].push({
      x: item.views,
      y: item.likes,
      title: item.title,
      category: item.category
    });
    return acc;
  }, {});

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb', '#ff6b6b', '#4ecdc4'];
  const countries = Object.keys(groupedData);

  const formatNumber = (value) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.9)',
          color: 'white',
          padding: '12px',
          borderRadius: '8px',
          fontSize: '12px',
          maxWidth: '250px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <p style={{ fontWeight: 'bold', marginBottom: '8px', color: '#ffd700' }}>
            {data.title?.substring(0, 40)}...
          </p>
          <p style={{ margin: '4px 0' }}>
            <span style={{ color: '#82ca9d' }}>Views:</span> {formatNumber(data.x)}
          </p>
          <p style={{ margin: '4px 0' }}>
            <span style={{ color: '#ff7300' }}>Likes:</span> {formatNumber(data.y)}
          </p>
          <p style={{ margin: '4px 0', fontSize: '11px', color: '#ccc' }}>
            Category: {data.category}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2>Views vs Likes Correlation</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, bottom: 60, left: 70 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Views"
              tickFormatter={formatNumber}
              label={{ value: 'Views', position: 'insideBottom', offset: -10 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Likes"
              tickFormatter={formatNumber}
              label={{ value: 'Likes', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
              layout="horizontal"
              align="center"
              verticalAlign="bottom"
            />
            {countries.map((country, index) => (
              <Scatter
                key={country}
                name={country}
                data={groupedData[country]}
                fill={colors[index % colors.length]}
                fillOpacity={hoveredCountry === country ? 0.9 : 0.7}
                onMouseEnter={() => setHoveredCountry(country)}
                onMouseLeave={() => setHoveredCountry(null)}
              />
            ))}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <style jsx>{`
        .custom-tooltip {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-size: 12px;
          max-width: 200px;
        }
      `}</style>
    </div>
  );
};

export default ScatterPlot;