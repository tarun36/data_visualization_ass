import React from 'react';

const Overview = ({ data }) => {
  const getStats = () => {
    if (!data || !data.videoData) return null;
    
    const allVideos = Object.values(data.videoData).flat();
    const totalViews = allVideos.reduce((sum, video) => sum + video.views, 0);
    const totalLikes = allVideos.reduce((sum, video) => sum + video.likes, 0);
    const countries = Object.keys(data.videoData);
    const categories = [...new Set(allVideos.map(v => v.category_name))];

    return {
      totalVideos: allVideos.length,
      totalViews,
      totalLikes,
      countriesCount: countries.length,
      categoriesCount: categories.length,
      avgViewsPerVideo: totalViews / allVideos.length,
      avgLikesPerVideo: totalLikes / allVideos.length
    };
  };

  const stats = getStats();

  return (
    <div className="overview">
      <h2>Project Overview</h2>
      
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>{stats.totalVideos.toLocaleString()}</h3>
            <p>Total Videos</p>
          </div>
          <div className="stat-card">
            <h3>{(stats.totalViews/1e6).toFixed(1)}M</h3>
            <p>Total Views</p>
          </div>
          <div className="stat-card">
            <h3>{(stats.totalLikes/1e6).toFixed(1)}M</h3>
            <p>Total Likes</p>
          </div>
          <div className="stat-card">
            <h3>{stats.countriesCount}</h3>
            <p>Countries</p>
          </div>
          <div className="stat-card">
            <h3>{stats.categoriesCount}</h3>
            <p>Categories</p>
          </div>
        </div>
      )}
      
      <p>This project analyzes YouTube trending data from multiple countries including:</p>
      <ul>
        <li>Canada (CA)</li>
        <li>Germany (DE)</li>
        <li>France (FR)</li>
        <li>Great Britain (GB)</li>
        <li>India (IN)</li>
        <li>Japan (JP)</li>
        <li>South Korea (KR)</li>
        <li>Mexico (MX)</li>
        <li>Russia (RU)</li>
        <li>United States (US)</li>
      </ul>
      <p>Navigate through different visualizations using the buttons above.</p>
    </div>
  );
};

export default Overview;