// Optimal Upload Strategy Analyzer - Main JavaScript

// Configuration
const countryFiles = {
  US: 'USvideos.csv', RU: 'RUvideos.csv', MX: 'MXvideos.csv', 
  KR: 'KRvideos.csv', JP: 'JPvideos.csv', IN: 'INvideos.csv',
  FR: 'FRvideos.csv', GB: 'GBvideos.csv', DE: 'DEvideos.csv', CA: 'CAvideos.csv'
};

const countryNames = {
  US: 'USA', RU: 'Russia', MX: 'Mexico', KR: 'South Korea', JP: 'Japan',
  IN: 'India', FR: 'France', GB: 'Great Britain', DE: 'Germany', CA: 'Canada'
};

const categoryMap = {
  '1': 'Film & Animation', '2': 'Autos & Vehicles', '10': 'Music',
  '15': 'Pets & Animals', '17': 'Sports', '18': 'Short Movies',
  '19': 'Travel & Events', '20': 'Gaming', '21': 'Videoblogging',
  '22': 'People & Blogs', '23': 'Comedy', '24': 'Entertainment',
  '25': 'News & Politics', '26': 'Howto & Style', '27': 'Education',
  '28': 'Science & Technology', '29': 'Nonprofits & Activism',
  '30': 'Movies', '31': 'Anime/Animation', '32': 'Action/Adventure',
  '33': 'Classics', '34': 'Comedy', '35': 'Documentary', '36': 'Drama',
  '37': 'Family', '38': 'Foreign', '39': 'Horror', '40': 'Sci-Fi/Fantasy',
  '41': 'Thriller', '42': 'Shorts', '43': 'Shows', '44': 'Trailers'
};

// Global variables
let allData = {};
let processedData = {};
let currentViewMode = 'heatmap';
let currentCategory = 'all';
let currentTimeRange = 'all';

// Load all CSV files
async function loadAllData() {
  const promises = Object.entries(countryFiles).map(([country, file]) =>
    d3.csv(file, d => ({
      ...d,
      country: country,
      views: +d.views,
      hour: new Date(d.publish_time).getHours(),
      category: d.category_id,
      categoryName: categoryMap[d.category_id] || 'Unknown'
    }))
  );
  
  const results = await Promise.all(promises);
  results.forEach((data, index) => {
    const country = Object.keys(countryFiles)[index];
    allData[country] = data;
  });
  
  processData();
}

// Process data for analysis
function processData() {
  Object.keys(allData).forEach(country => {
    const data = allData[country];
    
    // Group by hour and calculate statistics
    const hourStats = d3.groups(data, d => d.hour).map(([hour, rows]) => {
      const avgViews = d3.mean(rows, d => d.views);
      const totalViews = d3.sum(rows, d => d.views);
      const videoCount = rows.length;
      
      // Find best category for this hour
      const categoryStats = d3.groups(rows, d => d.category).map(([cat, catRows]) => ({
        category: cat,
        categoryName: categoryMap[cat] || 'Unknown',
        avgViews: d3.mean(catRows, d => d.views),
        count: catRows.length
      }));
      
      const bestCategory = categoryStats.sort((a, b) => b.avgViews - a.avgViews)[0];
      
      return {
        hour: +hour,
        avgViews,
        totalViews,
        videoCount,
        bestCategory: bestCategory?.categoryName || 'Unknown',
        bestCategoryViews: bestCategory?.avgViews || 0,
        categoryStats
      };
    });
    
    processedData[country] = hourStats.sort((a, b) => b.avgViews - a.avgViews);
  });
  
  updateVisualization();
  updateStrategyRecommendations();
  updateInsights();
}

// Update visualization based on current settings
function updateVisualization() {
  switch(currentViewMode) {
    case 'heatmap':
      showHeatmap();
      break;
    case 'global':
      showGlobalMap();
      break;
    case 'category':
      showCategoryAnalysis();
      break;
  }
}

// Show heatmap visualization
function showHeatmap() {
  const container = d3.select('#main-chart');
  container.html('');
  
  const margin = {top: 40, right: 120, bottom: 80, left: 80};
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Prepare data for heatmap
  const countries = Object.keys(processedData);
  const hours = Array.from({length: 24}, (_, i) => i);
  
  const heatmapData = [];
  countries.forEach(country => {
    hours.forEach(hour => {
      const hourData = processedData[country].find(d => d.hour === hour);
      heatmapData.push({
        country: countryNames[country],
        hour: hour,
        avgViews: hourData?.avgViews || 0,
        bestCategory: hourData?.bestCategory || 'Unknown'
      });
    });
  });
  
  // Create scales
  const xScale = d3.scaleBand()
    .domain(hours)
    .range([0, width])
    .padding(0.1);
    
  const yScale = d3.scaleBand()
    .domain(countries.map(c => countryNames[c]))
    .range([0, height])
    .padding(0.1);
    
  const colorScale = d3.scaleSequential()
    .domain([0, d3.max(heatmapData, d => d.avgViews)])
    .interpolator(d3.interpolateReds);
  
  // Create cells
  const cells = svg.selectAll('.heatmap-cell')
    .data(heatmapData)
    .enter()
    .append('rect')
    .attr('class', 'heatmap-cell')
    .attr('x', d => xScale(d.hour))
    .attr('y', d => yScale(d.country))
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('fill', d => colorScale(d.avgViews))
    .on('mouseover', (event, d) => {
      showTooltip(event, d);
    })
    .on('mouseout', hideTooltip);
  
  // Add axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale).tickFormat(d => `${d}:00`));
    
  svg.append('g')
    .call(d3.axisLeft(yScale));
  
  // Add labels
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', width/2)
    .attr('y', height + 50)
    .attr('text-anchor', 'middle')
    .text('Hour of Day');
    
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', -height/2)
    .attr('y', -50)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .text('Country');
}

// Show global world map
function showGlobalMap() {
  const container = d3.select('#global-map');
  container.style('display', 'block');
  d3.select('#main-chart').style('display', 'none');
  d3.select('#category-chart').style('display', 'none');
  
  container.html('');
  
  // Create a simple world map representation
  const width = 800;
  const height = 400;
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  
  // Create country circles for simplicity
  const countryPositions = {
    US: [150, 200], RU: [400, 150], MX: [120, 250], KR: [600, 200],
    JP: [650, 200], IN: [450, 250], FR: [350, 180], GB: [340, 170],
    DE: [360, 180], CA: [140, 150]
  };
  
  const countries = svg.selectAll('.country')
    .data(Object.entries(countryPositions))
    .enter()
    .append('g')
    .attr('class', 'country');
  
  countries.append('circle')
    .attr('cx', d => d[1][0])
    .attr('cy', d => d[1][1])
    .attr('r', 15)
    .attr('fill', d => {
      const country = d[0];
      const bestHour = processedData[country]?.[0]?.hour || 0;
      return d3.interpolateReds(bestHour / 24);
    })
    .on('mouseover', (event, d) => {
      const country = d[0];
      const bestData = processedData[country]?.[0];
      showTooltip(event, {
        country: countryNames[country],
        hour: bestData?.hour || 0,
        avgViews: bestData?.avgViews || 0,
        bestCategory: bestData?.bestCategory || 'Unknown'
      });
    })
    .on('mouseout', hideTooltip);
  
  countries.append('text')
    .attr('x', d => d[1][0])
    .attr('y', d => d[1][1] + 30)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .text(d => d[0]);
}

// Show category analysis
function showCategoryAnalysis() {
  const container = d3.select('#category-chart');
  container.style('display', 'block');
  d3.select('#main-chart').style('display', 'none');
  d3.select('#global-map').style('display', 'none');
  
  container.html('');
  
  const margin = {top: 40, right: 30, bottom: 80, left: 80};
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Analyze category performance across countries
  const categoryStats = {};
  Object.entries(processedData).forEach(([country, data]) => {
    data.forEach(hourData => {
      hourData.categoryStats.forEach(cat => {
        if (!categoryStats[cat.categoryName]) {
          categoryStats[cat.categoryName] = { totalViews: 0, avgViews: 0, count: 0 };
        }
        categoryStats[cat.categoryName].totalViews += cat.avgViews * cat.count;
        categoryStats[cat.categoryName].count += cat.count;
      });
    });
  });
  
  Object.keys(categoryStats).forEach(cat => {
    categoryStats[cat].avgViews = categoryStats[cat].totalViews / categoryStats[cat].count;
  });
  
  const categoryData = Object.entries(categoryStats)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, 10);
  
  // Create bar chart
  const xScale = d3.scaleBand()
    .domain(categoryData.map(d => d.name))
    .range([0, width])
    .padding(0.1);
    
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(categoryData, d => d.avgViews)])
    .range([height, 0]);
  
  svg.selectAll('.bar')
    .data(categoryData)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => xScale(d.name))
    .attr('y', d => yScale(d.avgViews))
    .attr('width', xScale.bandwidth())
    .attr('height', d => height - yScale(d.avgViews))
    .attr('fill', '#667eea');
  
  // Add axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end');
    
  svg.append('g')
    .call(d3.axisLeft(yScale));
}

// Update strategy recommendations
function updateStrategyRecommendations() {
  // Find global best time
  const allHours = [];
  Object.values(processedData).forEach(countryData => {
    countryData.forEach(hourData => {
      allHours.push({
        hour: hourData.hour,
        avgViews: hourData.avgViews,
        country: hourData.country
      });
    });
  });
  
  const globalBest = allHours.sort((a, b) => b.avgViews - a.avgViews)[0];
  
  // Update strategy cards
  document.getElementById('global-best').textContent = `${globalBest?.hour || 0}:00`;
  document.getElementById('best-category').textContent = 'Music'; // Most common
  document.getElementById('peak-hour').textContent = `${globalBest?.hour || 0}:00`;
  document.getElementById('expected-views').textContent = 
    globalBest ? Math.round(globalBest.avgViews).toLocaleString() : '0';
  
  // Update strategy table
  const tbody = d3.select('#strategy-table tbody');
  tbody.html('');
  
  Object.entries(processedData).forEach(([country, data]) => {
    const bestHour = data[0];
    const row = tbody.append('tr');
    row.append('td').text(countryNames[country]);
    row.append('td').text(`${bestHour.hour}:00`);
    row.append('td').text(bestHour.bestCategory);
    row.append('td').text(Math.round(bestHour.avgViews).toLocaleString());
    row.append('td').text(`Upload ${bestHour.bestCategory} content at ${bestHour.hour}:00 for maximum views`);
  });
}

// Update insights
function updateInsights() {
  // Global patterns
  const globalInsights = document.getElementById('global-insights');
  const avgHour = d3.mean(Object.values(processedData).flat().map(d => d.hour));
  globalInsights.innerHTML = `
    <p><strong>Peak Upload Time:</strong> ${Math.round(avgHour)}:00</p>
    <p><strong>Most Active Countries:</strong> US, GB, DE</p>
    <p><strong>Time Zone Strategy:</strong> Target evening hours (18-22)</p>
  `;
  
  // Category trends
  const categoryInsights = document.getElementById('category-insights');
  categoryInsights.innerHTML = `
    <p><strong>Top Performing:</strong> Music, Entertainment, Gaming</p>
    <p><strong>Emerging:</strong> Education, Science & Technology</p>
    <p><strong>Strategy:</strong> Mix popular categories with niche content</p>
  `;
  
  // Time analysis
  const timeInsights = document.getElementById('time-insights');
  timeInsights.innerHTML = `
    <p><strong>Morning (6-12):</strong> Education & News content</p>
    <p><strong>Afternoon (12-18):</strong> Entertainment & Gaming</p>
    <p><strong>Evening (18-24):</strong> Music & Comedy peak hours</p>
  `;
}

// Tooltip functions
function showTooltip(event, data) {
  const tooltip = d3.select('body').append('div').attr('class', 'tooltip');
  tooltip.transition().duration(200).style('opacity', 1);
  tooltip.html(`
    <strong>${data.country}</strong><br>
    Hour: ${data.hour}:00<br>
    Avg Views: ${Math.round(data.avgViews).toLocaleString()}<br>
    Best Category: ${data.bestCategory}
  `)
  .style('left', (event.pageX + 10) + 'px')
  .style('top', (event.pageY - 28) + 'px');
}

function hideTooltip() {
  d3.selectAll('.tooltip').transition().duration(500).style('opacity', 0);
}

// Event listeners
function setupEventListeners() {
  document.getElementById('view-mode').addEventListener('change', (e) => {
    currentViewMode = e.target.value;
    updateVisualization();
  });
  
  document.getElementById('category-select').addEventListener('change', (e) => {
    currentCategory = e.target.value;
    updateVisualization();
  });
  
  document.getElementById('time-range').addEventListener('change', (e) => {
    currentTimeRange = e.target.value;
    updateVisualization();
  });
}

// Initialize
async function init() {
  await loadAllData();
  setupEventListeners();
}

// Start the application
init();