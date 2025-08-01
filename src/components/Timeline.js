import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Timeline = ({ data }) => {
  const chartData = data.map(item => ({
    date: item.date.toLocaleDateString(),
    count: item.count,
    totalViews: item.totalViews
  }));

  const formatNumber = (value) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p><strong>Date: {label}</strong></p>
          <p>Trending Videos: {payload[0].value}</p>
          <p>Total Views: {formatNumber(payload[0].payload.totalViews)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2>Trending Videos Timeline</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 80, left: 70 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis label={{ value: 'Number of Trending Videos', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#3498db" 
              strokeWidth={2}
              dot={{ fill: '#e74c3c', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <style jsx>{`
        .custom-tooltip {
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 10px;
          border-radius: 5px;
          font-size: 12px;
        }
      `}</style>
    </div>
  );
};

export default Timeline;