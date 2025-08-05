// main.js for Optimal Upload Time Analyzer

const countryFiles = {
  US: 'USvideos.csv',
  RU: 'RUvideos.csv',
  MX: 'MXvideos.csv',
  KR: 'KRvideos.csv',
  JP: 'JPvideos.csv',
  IN: 'INvideos.csv',
  FR: 'FRvideos.csv',
  GB: 'GBvideos.csv',
  DE: 'DEvideos.csv',
  CA: 'CAvideos.csv',
};

const countryNames = {
  US: 'USA', RU: 'Russia', MX: 'Mexico', KR: 'South Korea', JP: 'Japan',
  IN: 'India', FR: 'France', GB: 'Great Britain', DE: 'Germany', CA: 'Canada'
};

let allData = {}; // { country: [rows] }
let categoryMap = {};

// Load category mapping (should be a JSON file: {"10": "Music", ...})
function loadCategoryMap() {
  return d3.json('category_map.json').then(map => {
    categoryMap = map;
  });
}

// Load all CSVs
function loadAllCSVs() {
  const promises = Object.entries(countryFiles).map(([country, file]) =>
    d3.csv(file, d => ({
      ...d,
      views: +d.views,
      hour: new Date(d.publish_time).getHours(),
      category: d.category_id,
    })).then(rows => {
      allData[country] = rows;
    })
  );
  return Promise.all(promises);
}

// Process data for a country: returns [{hour, avgViews, bestCategory, bestCategoryViews}]
function getTopTimes(country) {
  const data = allData[country];
  if (!data) return [];
  // Group by hour
  const hourGroups = d3.groups(data, d => d.hour);
  const hourStats = hourGroups.map(([hour, rows]) => {
    // For each hour, find avg views and best category
    const avgViews = d3.mean(rows, d => d.views);
    // Find best category for this hour
    const catGroups = d3.groups(rows, d => d.category);
    const bestCat = catGroups.map(([cat, catRows]) => ({
      cat,
      avg: d3.mean(catRows, d => d.views),
      count: catRows.length
    }))
    .sort((a, b) => b.avg - a.avg)[0];
    return {
      hour: +hour,
      avgViews,
      bestCategory: bestCat ? (categoryMap[bestCat.cat] || bestCat.cat) : 'Unknown',
      bestCategoryViews: bestCat ? bestCat.avg : 0,
      count: rows.length
    };
  });
  // Sort by avgViews desc, take top 10
  return hourStats.sort((a, b) => b.avgViews - a.avgViews).slice(0, 10);
}

// Draw bar chart
function drawChart(topTimes) {
  d3.select('#chart').html('');
  const margin = {top: 30, right: 30, bottom: 50, left: 70};
  const width = 700 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;
  const svg = d3.select('#chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // X: hour
  const x = d3.scaleBand()
    .domain(topTimes.map(d => d.hour))
    .range([0, width])
    .padding(0.2);
  // Y: avgViews
  const y = d3.scaleLinear()
    .domain([0, d3.max(topTimes, d => d.avgViews) * 1.1])
    .range([height, 0]);

  // X axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d => `${d}:00`));
  // Y axis
  svg.append('g')
    .call(d3.axisLeft(y).ticks(6).tickFormat(d3.format('.2s')));

  // Axis labels
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', width/2)
    .attr('y', height+40)
    .attr('text-anchor', 'middle')
    .text('Hour of Day (Local)');
  svg.append('text')
    .attr('class', 'axis-label')
    .attr('x', -height/2)
    .attr('y', -50)
    .attr('transform', 'rotate(-90)')
    .attr('text-anchor', 'middle')
    .text('Average Views');

  // Tooltip
  const tooltip = d3.select('body').append('div').attr('class', 'tooltip');

  // Bars
  svg.selectAll('.bar')
    .data(topTimes)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.hour))
    .attr('y', d => y(d.avgViews))
    .attr('width', x.bandwidth())
    .attr('height', d => height - y(d.avgViews))
    .on('mouseover', (event, d) => {
      tooltip.transition().duration(100).style('opacity', 1);
      tooltip.html(
        `<strong>Hour:</strong> ${d.hour}:00<br>` +
        `<strong>Avg Views:</strong> ${Math.round(d.avgViews).toLocaleString()}<br>` +
        `<strong>Best Category:</strong> ${d.bestCategory}<br>` +
        `<strong>Best Cat Avg Views:</strong> ${Math.round(d.bestCategoryViews).toLocaleString()}<br>` +
        `<strong>Videos:</strong> ${d.count}`
      )
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 40) + 'px');
    })
    .on('mousemove', (event) => {
      tooltip.style('left', (event.pageX + 15) + 'px')
             .style('top', (event.pageY - 40) + 'px');
    })
    .on('mouseout', () => {
      tooltip.transition().duration(200).style('opacity', 0);
    });
}

// Draw table
function drawTable(topTimes) {
  const tbody = d3.select('#top-times-table tbody');
  tbody.html('');
  topTimes.forEach((d, i) => {
    const row = tbody.append('tr');
    row.append('td').text(i+1);
    row.append('td').text(`${d.hour}:00`);
    row.append('td').text(Math.round(d.avgViews).toLocaleString());
    row.append('td').text(d.bestCategory);
  });
}

// On country change
function updateCountry(country) {
  const topTimes = getTopTimes(country);
  drawChart(topTimes);
  drawTable(topTimes);
}

// Init
function init() {
  loadCategoryMap()
    .then(loadAllCSVs)
    .then(() => {
      // Initial country
      const select = document.getElementById('country-select');
      updateCountry(select.value);
      select.addEventListener('change', e => {
        updateCountry(e.target.value);
      });
    });
}

init();