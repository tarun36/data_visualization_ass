import React from 'react';
import './Navigation.css';

const Navigation = ({ currentView, onViewChange, disabled }) => {
  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'bar-chart', label: 'Views by Country' },
    { id: 'pie-chart', label: 'Category Distribution' },
    { id: 'timeline', label: 'Trending Timeline' },
    { id: 'scatter', label: 'Views vs Likes' },
    { id: 'category-deep-dive', label: 'Category Deep Dive' },
    { id: 'treemap', label: 'Channel Treemap' },
    { id: 'engagement', label: 'Engagement Breakdown' }
  ];

  return (
    <nav className="navigation">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-btn ${currentView === item.id ? 'active' : ''}`}
          onClick={() => onViewChange(item.id)}
          disabled={disabled && item.id !== 'overview'}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
};

export default Navigation;