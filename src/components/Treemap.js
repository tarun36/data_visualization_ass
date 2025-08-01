import React from 'react';

const Treemap = ({ data }) => {
  const formatNumber = (value) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toString();
  };

  // Simple treemap layout calculation
  const calculateLayout = (data, width, height) => {
    const total = data.reduce((sum, item) => sum + item.totalViews, 0);
    let currentX = 0;
    let currentY = 0;
    const rowHeight = height / Math.ceil(Math.sqrt(data.length));
    
    return data.map((item, index) => {
      const area = (item.totalViews / total) * width * height;
      const itemWidth = Math.sqrt(area * (width / height));
      const itemHeight = area / itemWidth;
      
      if (currentX + itemWidth > width) {
        currentX = 0;
        currentY += rowHeight;
      }
      
      const rect = {
        x: currentX,
        y: currentY,
        width: Math.min(itemWidth, width - currentX),
        height: Math.min(itemHeight, height - currentY),
        data: item
      };
      
      currentX += rect.width;
      
      return rect;
    });
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0', '#ffb347', '#87ceeb'];
  const layout = calculateLayout(data, 800, 400);

  return (
    <div>
      <h2>Top Channels Treemap</h2>
      <div className="chart-container">
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          <svg width="100%" height="100%" viewBox="0 0 800 400">
            {layout.map((rect, index) => (
              <g key={index}>
                <rect
                  x={rect.x}
                  y={rect.y}
                  width={rect.width}
                  height={rect.height}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                  style={{ cursor: 'pointer' }}
                >
                  <title>
                    {rect.data.name}
                    {'\n'}Total Views: {formatNumber(rect.data.totalViews)}
                    {'\n'}Videos: {rect.data.videoCount}
                    {'\n'}Countries: {rect.data.countries.join(', ')}
                  </title>
                </rect>
                {rect.width > 60 && rect.height > 30 && (
                  <text
                    x={rect.x + 4}
                    y={rect.y + 16}
                    fill="white"
                    fontSize="11"
                    fontWeight="bold"
                  >
                    {rect.data.name.length > 12 ? 
                      rect.data.name.substring(0, 12) + '...' : 
                      rect.data.name}
                  </text>
                )}
                {rect.width > 80 && rect.height > 50 && (
                  <text
                    x={rect.x + 4}
                    y={rect.y + 32}
                    fill="white"
                    fontSize="10"
                  >
                    {formatNumber(rect.data.totalViews)}
                  </text>
                )}
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
};

export default Treemap;