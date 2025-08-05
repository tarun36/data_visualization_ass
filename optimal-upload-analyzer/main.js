// Country file mappings
const countryFiles = {
    'US': 'USvideos.csv',
    'RU': 'RUvideos.csv',
    'MX': 'MXvideos.csv',
    'KR': 'KRvideos.csv',
    'JP': 'JPvideos.csv',
    'IN': 'INvideos.csv',
    'FR': 'FRvideos.csv',
    'GB': 'GBvideos.csv',
    'DE': 'DEvideos.csv',
    'CA': 'CAvideos.csv'
};

const countryNames = {
    'US': 'United States',
    'RU': 'Russia',
    'MX': 'Mexico',
    'KR': 'South Korea',
    'JP': 'Japan',
    'IN': 'India',
    'FR': 'France',
    'GB': 'United Kingdom',
    'DE': 'Germany',
    'CA': 'Canada'
};

// Category mapping (you can replace this with your actual category_map.json)
const categoryMap = {
    1: 'Film & Animation',
    2: 'Autos & Vehicles',
    10: 'Music',
    15: 'Pets & Animals',
    17: 'Sports',
    19: 'Travel & Events',
    20: 'Gaming',
    22: 'People & Blogs',
    23: 'Comedy',
    24: 'Entertainment',
    25: 'News & Politics',
    26: 'Howto & Style',
    27: 'Education',
    28: 'Science & Technology',
    29: 'Nonprofits & Activism'
};

// Global variables
let allData = {};
let processedData = {};
let currentCountry = 'global';
let tooltip = null;
let dataStatus = {
    loadedCountries: [],
    sampleDataCountries: [],
    totalRecords: 0,
    dataQuality: 'unknown'
};

// Load all CSV files
async function loadAllData() {
    console.log('Loading data from all countries...');
    
    // Show loading state
    showLoadingState();
    
    // Reset data status
    dataStatus = {
        loadedCountries: [],
        sampleDataCountries: [],
        totalRecords: 0,
        dataQuality: 'unknown'
    };
    
    try {
        // Load data for each country
        for (const [country, filename] of Object.entries(countryFiles)) {
            try {
                const data = await d3.csv(filename, d => ({
                    video_id: d.video_id,
                    trending_date: d.trending_date,
                    title: d.title,
                    channel_title: d.channel_title,
                    category_id: +d.category_id,
                    publish_time: d.publish_time,
                    tags: d.tags,
                    views: +d.views,
                    likes: +d.likes,
                    dislikes: +d.dislikes,
                    comment_count: +d.comment_count,
                    comments_disabled: d.comments_disabled,
                    ratings_disabled: d.ratings_disabled,
                    video_error_or_removed: d.video_error_or_removed,
                    description: d.description
                }));
                
                allData[country] = data;
                dataStatus.loadedCountries.push(country);
                dataStatus.totalRecords += data.length;
                console.log(`✅ Loaded ${data.length} records for ${country}`);
            } catch (error) {
                console.warn(`⚠️ Could not load ${filename}, using sample data for ${country}`);
                allData[country] = generateSampleData(country);
                dataStatus.sampleDataCountries.push(country);
                dataStatus.totalRecords += allData[country].length;
            }
        }
        
        // Determine data quality
        if (dataStatus.loadedCountries.length === 0) {
            dataStatus.dataQuality = 'sample';
        } else if (dataStatus.sampleDataCountries.length === 0) {
            dataStatus.dataQuality = 'real';
        } else {
            dataStatus.dataQuality = 'mixed';
        }
        
        processData();
        updateVisualization();
        updateDataInfo();
        
    } catch (error) {
        console.error('Error loading data:', error);
        // Generate sample data if files are not available
        generateAllSampleData();
        dataStatus.sampleDataCountries = Object.keys(countryFiles);
        dataStatus.dataQuality = 'sample';
        dataStatus.totalRecords = Object.values(allData).reduce((sum, data) => sum + data.length, 0);
        processData();
        updateVisualization();
        updateDataInfo();
    }
}

// Generate sample data for testing
function generateSampleData(country) {
    const sampleData = [];
    const hours = Array.from({length: 24}, (_, i) => i);
    const categories = Object.keys(categoryMap).map(Number);
    
    for (let i = 0; i < 100; i++) {
        const hour = hours[Math.floor(Math.random() * hours.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        // Create realistic view patterns (higher views in evening hours)
        let baseViews = 100000;
        if (hour >= 18 && hour <= 22) baseViews = 300000; // Evening peak
        else if (hour >= 12 && hour <= 16) baseViews = 200000; // Afternoon
        else if (hour >= 6 && hour <= 10) baseViews = 150000; // Morning
        
        // Add some randomness
        baseViews += Math.random() * 100000;
        
        sampleData.push({
            video_id: `sample_${country}_${i}`,
            trending_date: '2023-01-01',
            title: `Sample Video ${i}`,
            channel_title: `Sample Channel ${i}`,
            category_id: category,
            publish_time: `2023-01-01T${hour.toString().padStart(2, '0')}:00:00.000Z`,
            tags: 'sample',
            views: Math.floor(baseViews),
            likes: Math.floor(baseViews * 0.05),
            dislikes: Math.floor(baseViews * 0.01),
            comment_count: Math.floor(baseViews * 0.02),
            comments_disabled: 'False',
            ratings_disabled: 'False',
            video_error_or_removed: 'False',
            description: 'Sample video description'
        });
    }
    
    return sampleData;
}

function generateAllSampleData() {
    for (const country of Object.keys(countryFiles)) {
        allData[country] = generateSampleData(country);
    }
}

// Process data to get optimal upload times
function processData() {
    processedData = {};
    
    // Process each country
    for (const country of Object.keys(countryFiles)) {
        const data = allData[country];
        const hourlyStats = {};
        
        // Initialize hourly stats
        for (let hour = 0; hour < 24; hour++) {
            hourlyStats[hour] = {
                totalViews: 0,
                videoCount: 0,
                categoryViews: {},
                avgViews: 0
            };
        }
        
        // Aggregate data by hour
        data.forEach(video => {
            const publishTime = new Date(video.publish_time);
            const hour = publishTime.getHours();
            const category = video.category_id;
            
            hourlyStats[hour].totalViews += video.views;
            hourlyStats[hour].videoCount += 1;
            
            if (!hourlyStats[hour].categoryViews[category]) {
                hourlyStats[hour].categoryViews[category] = 0;
            }
            hourlyStats[hour].categoryViews[category] += video.views;
        });
        
        // Calculate averages and find best category for each hour
        for (let hour = 0; hour < 24; hour++) {
            if (hourlyStats[hour].videoCount > 0) {
                hourlyStats[hour].avgViews = hourlyStats[hour].totalViews / hourlyStats[hour].videoCount;
                
                // Find best category for this hour
                const categories = Object.entries(hourlyStats[hour].categoryViews);
                if (categories.length > 0) {
                    const bestCategory = categories.reduce((a, b) => a[1] > b[1] ? a : b);
                    hourlyStats[hour].bestCategory = parseInt(bestCategory[0]);
                    hourlyStats[hour].bestCategoryViews = bestCategory[1];
                }
            }
        }
        
        processedData[country] = hourlyStats;
    }
    
    // Process global data (aggregate all countries)
    const globalStats = {};
    for (let hour = 0; hour < 24; hour++) {
        globalStats[hour] = {
            totalViews: 0,
            videoCount: 0,
            categoryViews: {},
            avgViews: 0
        };
    }
    
    // Aggregate all countries
    Object.values(processedData).forEach(countryStats => {
        for (let hour = 0; hour < 24; hour++) {
            globalStats[hour].totalViews += countryStats[hour].totalViews;
            globalStats[hour].videoCount += countryStats[hour].videoCount;
            
            Object.entries(countryStats[hour].categoryViews).forEach(([category, views]) => {
                if (!globalStats[hour].categoryViews[category]) {
                    globalStats[hour].categoryViews[category] = 0;
                }
                globalStats[hour].categoryViews[category] += views;
            });
        }
    });
    
    // Calculate global averages and best categories
    for (let hour = 0; hour < 24; hour++) {
        if (globalStats[hour].videoCount > 0) {
            globalStats[hour].avgViews = globalStats[hour].totalViews / globalStats[hour].videoCount;
            
            const categories = Object.entries(globalStats[hour].categoryViews);
            if (categories.length > 0) {
                const bestCategory = categories.reduce((a, b) => a[1] > b[1] ? a : b);
                globalStats[hour].bestCategory = parseInt(bestCategory[0]);
                globalStats[hour].bestCategoryViews = bestCategory[1];
            }
        }
    }
    
    processedData['global'] = globalStats;
}

// Update visualization based on selected country
function updateVisualization() {
    const data = processedData[currentCountry];
    if (!data) return;
    
    // Convert to array format for D3
    const chartData = [];
    for (let hour = 0; hour < 24; hour++) {
        if (data[hour].videoCount > 0) {
            chartData.push({
                hour: hour,
                avgViews: data[hour].avgViews,
                bestCategory: data[hour].bestCategory,
                bestCategoryName: categoryMap[data[hour].bestCategory] || 'Unknown',
                videoCount: data[hour].videoCount,
                totalViews: data[hour].totalViews
            });
        }
    }
    
    // Sort by average views for top 10
    const topTimes = chartData
        .sort((a, b) => b.avgViews - a.avgViews)
        .slice(0, 10);
    
    drawChart(chartData);
    updateTable(topTimes);
    updateStats(chartData);
    updateDataInfo();
}

// Draw the bar chart
function drawChart(data) {
    const margin = {top: 40, right: 30, bottom: 60, left: 80};
    const width = document.getElementById('chart').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    // Clear previous chart
    d3.select('#chart').selectAll('*').remove();
    
    const svg = d3.select('#chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.hour))
        .range([0, width])
        .padding(0.1);
    
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.avgViews)])
        .range([height, 0]);
    
    // Color scale for categories
    const colorScale = d3.scaleOrdinal()
        .domain(Object.values(categoryMap))
        .range(d3.schemeCategory10);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d => `${d}:00`);
    
    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d => formatNumber(d));
    
    // Add axes
    svg.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(xAxis);
    
    svg.append('g')
        .attr('class', 'axis')
        .call(yAxis);
    
    // Add axis labels
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .style('text-anchor', 'middle')
        .text('Hour of Day');
    
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 20)
        .style('text-anchor', 'middle')
        .text('Average Views');
    
    // Create tooltip
    tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    // Add bars
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.hour))
        .attr('y', d => yScale(d.avgViews))
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(d.avgViews))
        .attr('fill', d => colorScale(d.bestCategoryName))
        .on('mouseover', function(event, d) {
            const countryName = currentCountry === 'global' ? 'Global' : countryNames[currentCountry];
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(`
                <strong>${countryName}</strong><br/>
                Hour: ${d.hour}:00<br/>
                Avg Views: ${formatNumber(d.avgViews)}<br/>
                Best Category: ${d.bestCategoryName}<br/>
                Videos: ${d.videoCount}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Add legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 10}, 0)`);
    
    const uniqueCategories = [...new Set(data.map(d => d.bestCategoryName))];
    const legendItems = legend.selectAll('.legend-item')
        .data(uniqueCategories)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 20})`);
    
    legendItems.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d => colorScale(d));
    
    legendItems.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .text(d => d.length > 15 ? d.substring(0, 15) + '...' : d);
}

// Update the table with top times
function updateTable(topTimes) {
    const tbody = d3.select('#top-times-table tbody');
    tbody.selectAll('*').remove();
    
    const rows = tbody.selectAll('tr')
        .data(topTimes)
        .enter()
        .append('tr');
    
    rows.append('td').text((d, i) => i + 1);
    rows.append('td').text(d => `${d.hour}:00`);
    rows.append('td').text(d => formatNumber(d.avgViews));
    rows.append('td').text(d => d.bestCategoryName);
    rows.append('td').text(d => formatNumber(d.totalViews));
}

// Update statistics panel
function updateStats(data) {
    if (data.length === 0) return;
    
    const bestHour = data.reduce((a, b) => a.avgViews > b.avgViews ? a : b);
    const countryName = currentCountry === 'global' ? 'Global' : countryNames[currentCountry];
    
    document.getElementById('best-hour').textContent = `${bestHour.hour}:00`;
    document.getElementById('avg-views').textContent = formatNumber(bestHour.avgViews);
    document.getElementById('best-category').textContent = bestHour.bestCategoryName;
}

// Format numbers for display
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

// Setup event listeners
function setupEventListeners() {
    const countrySelect = document.getElementById('country-select');
    
    countrySelect.addEventListener('change', function() {
        currentCountry = this.value;
        updateVisualization();
    });
}

// Show loading state
function showLoadingState() {
    const chartSection = document.getElementById('chart-section');
    chartSection.innerHTML = `
        <div style="text-align: center; padding: 2rem;">
            <div style="font-size: 1.2rem; margin-bottom: 1rem;">🔄 Loading data...</div>
            <div style="color: #666;">Analyzing YouTube trending videos from 10 countries</div>
        </div>
    `;
}

// Update data information panel
function updateDataInfo() {
    const countryName = currentCountry === 'global' ? 'Global' : countryNames[currentCountry];
    const data = processedData[currentCountry];
    
    if (!data) return;
    
    // Calculate data completeness
    const totalHours = 24;
    const availableHours = Object.values(data).filter(hour => hour.videoCount > 0).length;
    const completeness = Math.round((availableHours / totalHours) * 100);
    
    // Create data info HTML
    let dataInfoHTML = `
        <div class="data-info">
            <h3>📊 Data Information</h3>
            <div class="data-stats">
                <div class="data-stat">
                    <span class="label">Region:</span>
                    <span class="value">${countryName}</span>
                </div>
                <div class="data-stat">
                    <span class="label">Data Quality:</span>
                    <span class="value ${dataStatus.dataQuality}">${getDataQualityLabel()}</span>
                </div>
                <div class="data-stat">
                    <span class="label">Total Records:</span>
                    <span class="value">${formatNumber(dataStatus.totalRecords)}</span>
                </div>
                <div class="data-stat">
                    <span class="label">Data Completeness:</span>
                    <span class="value">${completeness}% (${availableHours}/24 hours)</span>
                </div>
            </div>
            ${getDataQualityDetails()}
        </div>
    `;
    
    // Insert data info after chart section
    const chartSection = document.getElementById('chart-section');
    const existingInfo = chartSection.querySelector('.data-info');
    if (existingInfo) {
        existingInfo.remove();
    }
    
    const dataInfoDiv = document.createElement('div');
    dataInfoDiv.innerHTML = dataInfoHTML;
    chartSection.appendChild(dataInfoDiv);
}

// Get data quality label
function getDataQualityLabel() {
    switch (dataStatus.dataQuality) {
        case 'real': return '✅ Real Data';
        case 'sample': return '⚠️ Sample Data';
        case 'mixed': return '🔄 Mixed Data';
        default: return '❓ Unknown';
    }
}

// Get detailed data quality information
function getDataQualityDetails() {
    if (dataStatus.dataQuality === 'real') {
        return '<div class="data-note">✅ All data loaded from CSV files</div>';
    } else if (dataStatus.dataQuality === 'sample') {
        return `
            <div class="data-note warning">
                ⚠️ Using sample data - Place your CSV files in this directory for real analysis
                <br>Required files: ${Object.values(countryFiles).join(', ')}
            </div>
        `;
    } else {
        return `
            <div class="data-note mixed">
                🔄 Mixed data - Some countries use real data, others use sample data
                <br>Real data: ${dataStatus.loadedCountries.map(c => countryNames[c]).join(', ')}
                <br>Sample data: ${dataStatus.sampleDataCountries.map(c => countryNames[c]).join(', ')}
            </div>
        `;
    }
}

// Initialize the application
async function init() {
    console.log('Initializing Optimal Upload Time Analyzer...');
    
    setupEventListeners();
    await loadAllData();
    
    console.log('Application initialized successfully!');
}

// Start the application
init();