import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const EngagementChart = ({ data }) => {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
  
  const COLORS = ['#8884d8', '#ff7300', '#82ca9d'];

  const formatNumber = (value) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toString();
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p><strong>{payload[0].payload.name}</strong></p>
          <p>{formatNumber(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <h2>Engagement Breakdown</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
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

export default EngagementChart;