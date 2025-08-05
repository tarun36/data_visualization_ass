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
    if (!data) {
        console.warn('No data available for visualization');
        return;
    }
    
    // Check if chart container exists with retry logic
    let chartContainer = document.getElementById('chart');
    if (!chartContainer) {
        console.warn('Chart container not found, retrying...');
        // Wait a bit and try again
        setTimeout(() => {
            chartContainer = document.getElementById('chart');
            if (chartContainer) {
                console.log('✅ Chart container found on retry');
                updateVisualization(); // Retry the function
            } else {
                console.error('Chart container still not found after retry');
            }
        }, 100);
        return;
    }
    
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
    const chartContainer = document.getElementById('chart');
    if (!chartContainer) {
        console.error('Chart container not found');
        return;
    }
    
    const margin = {top: 40, right: 30, bottom: 60, left: 80};
    const width = chartContainer.clientWidth - margin.left - margin.right;
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
    
    // Enhanced color scale for better differentiation
    const colorScale = d3.scaleOrdinal()
        .domain(Object.values(categoryMap))
        .range([
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd',
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf',
            '#a6cee3', '#fb9a99', '#fdbf6f', '#cab2d6', '#ff9896'
        ]);
    
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
    
    // Add axis labels with better styling
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('x', width / 2)
        .attr('y', height + margin.bottom - 10)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .text('Hour of Day');
    
    svg.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('x', -height / 2)
        .attr('y', -margin.left + 20)
        .style('text-anchor', 'middle')
        .style('font-weight', 'bold')
        .style('font-size', '14px')
        .text('Average Views');
    
    // Add chart title
    const countryName = currentCountry === 'global' ? 'Global' : countryNames[currentCountry];
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', -10)
        .style('text-anchor', 'middle')
        .style('font-size', '16px')
        .style('font-weight', 'bold')
        .style('fill', '#2c3e50')
        .text(`Optimal Upload Times - ${countryName}`);
    
    // Create tooltip
    tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    // Add bars with enhanced styling
    svg.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.hour))
        .attr('y', d => yScale(d.avgViews))
        .attr('width', xScale.bandwidth() * 0.8) // Make bars slightly narrower for better separation
        .attr('height', d => height - yScale(d.avgViews))
        .attr('fill', d => colorScale(d.bestCategoryName))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1)
        .attr('rx', 3) // Rounded corners
        .on('mouseover', function(event, d) {
            const countryName = currentCountry === 'global' ? 'Global' : countryNames[currentCountry];
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(`
                <div style="font-weight: bold; margin-bottom: 5px;">${countryName}</div>
                <div style="margin-bottom: 3px;">🕐 <strong>Hour:</strong> ${d.hour}:00</div>
                <div style="margin-bottom: 3px;">📊 <strong>Avg Views:</strong> ${formatNumber(d.avgViews)}</div>
                <div style="margin-bottom: 3px;">📂 <strong>Best Category:</strong> ${d.bestCategoryName}</div>
                <div style="margin-bottom: 3px;">🎬 <strong>Videos:</strong> ${d.videoCount}</div>
                <div style="margin-top: 5px; padding-top: 5px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 11px; opacity: 0.8;">
                    💡 Bar color represents the best performing category for this hour
                </div>
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
        });
    
    // Add enhanced legend
    const legend = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width + 10}, 0)`);
    
    // Add legend title
    legend.append('text')
        .attr('x', 0)
        .attr('y', -10)
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .style('fill', '#2c3e50')
        .text('Categories');
    
    const uniqueCategories = [...new Set(data.map(d => d.bestCategoryName))];
    const legendItems = legend.selectAll('.legend-item')
        .data(uniqueCategories)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 25})`);
    
    legendItems.append('rect')
        .attr('width', 18)
        .attr('height', 18)
        .attr('fill', d => colorScale(d))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1)
        .attr('rx', 2);
    
    legendItems.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .style('font-size', '11px')
        .style('fill', '#2c3e50')
        .text(d => d.length > 20 ? d.substring(0, 20) + '...' : d);
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
    const uploadBtn = document.getElementById('upload-btn');
    const csvUpload = document.getElementById('csv-upload');
    const uploadStatus = document.getElementById('upload-status');
    
    countrySelect.addEventListener('change', function() {
        currentCountry = this.value;
        updateVisualization();
    });
    
    // File upload functionality
    uploadBtn.addEventListener('click', function() {
        csvUpload.click();
    });
    
    csvUpload.addEventListener('change', function(event) {
        const files = event.target.files;
        if (files.length > 0) {
            uploadStatus.textContent = `Processing ${files.length} file(s)...`;
            processUploadedFiles(files);
        }
    });
}

// Process uploaded CSV files
async function processUploadedFiles(files) {
    const uploadStatus = document.getElementById('upload-status');
    const uploadedData = {};
    
    try {
        for (let file of files) {
            const country = getCountryFromFilename(file.name);
            if (country) {
                const text = await file.text();
                const data = d3.csvParse(text, d => ({
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
                
                uploadedData[country] = data;
                console.log(`✅ Processed ${data.length} records from ${file.name}`);
            }
        }
        
        // Update global data with uploaded files
        Object.assign(allData, uploadedData);
        
        // Update data status
        dataStatus.loadedCountries = Object.keys(uploadedData);
        dataStatus.totalRecords = Object.values(allData).reduce((sum, data) => sum + data.length, 0);
        dataStatus.dataQuality = dataStatus.loadedCountries.length > 0 ? 'real' : 'sample';
        
        uploadStatus.textContent = `✅ Loaded ${Object.keys(uploadedData).length} file(s) successfully!`;
        
        // Reprocess and update visualization
        processData();
        updateVisualization();
        
    } catch (error) {
        console.error('Error processing uploaded files:', error);
        uploadStatus.textContent = '❌ Error processing files. Please check file format.';
    }
}

// Extract country code from filename
function getCountryFromFilename(filename) {
    const countryMap = {
        'USvideos.csv': 'US',
        'RUvideos.csv': 'RU',
        'MXvideos.csv': 'MX',
        'KRvideos.csv': 'KR',
        'JPvideos.csv': 'JP',
        'INvideos.csv': 'IN',
        'FRvideos.csv': 'FR',
        'GBvideos.csv': 'GB',
        'DEvideos.csv': 'DE',
        'CAvideos.csv': 'CA'
    };
    
    return countryMap[filename] || null;
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
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            await initializeApp();
        });
    } else {
        // DOM is already loaded, but wait a bit more to be safe
        setTimeout(async () => {
            await initializeApp();
        }, 100);
    }
}

async function initializeApp() {
    try {
        // Wait for DOM to be fully ready with multiple checks
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
            const chartContainer = document.getElementById('chart');
            const countrySelect = document.getElementById('country-select');
            
            if (chartContainer && countrySelect) {
                console.log('✅ All required elements found');
                break;
            }
            
            console.log(`⏳ Waiting for DOM elements... (attempt ${attempts + 1}/${maxAttempts})`);
            await new Promise(resolve => setTimeout(resolve, 200));
            attempts++;
        }
        
        // Final check
        const chartContainer = document.getElementById('chart');
        if (!chartContainer) {
            throw new Error('Chart container not found after multiple attempts. Please refresh the page.');
        }
        
        console.log('🚀 Starting application initialization...');
        debugDOMElements(); // Debug DOM elements
        setupEventListeners();
        await loadAllData();
        console.log('✅ Application initialized successfully!');
        console.log('📊 Chart container:', document.getElementById('chart') ? 'Found' : 'Missing');
        console.log('🎛️ Controls:', document.getElementById('country-select') ? 'Found' : 'Missing');
    } catch (error) {
        console.error('Error initializing application:', error);
        showError('Failed to initialize application. Please refresh the page.');
    }
}

// Show error message to user
function showError(message) {
    const chartSection = document.getElementById('chart-section');
    if (chartSection) {
        chartSection.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                <div style="font-size: 1.2rem; margin-bottom: 1rem;">❌ Error</div>
                <div style="color: #666;">${message}</div>
                <div style="margin-top: 1rem; font-size: 0.9rem; color: #999;">
                    Debug info: Chart section found: ${chartSection ? 'Yes' : 'No'}<br>
                    Chart container found: ${document.getElementById('chart') ? 'Yes' : 'No'}<br>
                    Document ready state: ${document.readyState}
                </div>
            </div>
        `;
    }
}

// Debug function to check DOM elements
function debugDOMElements() {
    console.log('🔍 Debugging DOM elements...');
    console.log('Document ready state:', document.readyState);
    console.log('Chart section:', document.getElementById('chart-section') ? 'Found' : 'Missing');
    console.log('Chart container:', document.getElementById('chart') ? 'Found' : 'Missing');
    console.log('Country select:', document.getElementById('country-select') ? 'Found' : 'Missing');
    console.log('All elements with ID "chart":', document.querySelectorAll('#chart').length);
}

// Alternative initialization method
function initWithWindowLoad() {
    console.log('🔄 Initializing with window load event...');
    window.addEventListener('load', async () => {
        console.log('🌐 Window loaded, starting application...');
        await initializeApp();
    });
}

// Start the application with multiple fallback methods
init();

// Also try window load as backup
if (document.readyState === 'complete') {
    console.log('📄 Document already complete, initializing...');
    setTimeout(initializeApp, 50);
} else {
    console.log('⏳ Document not complete, waiting for window load...');
    initWithWindowLoad();
}