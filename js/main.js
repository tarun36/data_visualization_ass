// Main Application Logic
class YouTubeDataVisualization {
    constructor() {
        this.currentVisualization = 'overview';
        this.dataLoader = new DataLoader();
        this.visualizations = new Visualizations();
        this.isDataLoaded = false;
    }

    // Initialize the application
    async init() {
        this.setupEventListeners();
        this.showLoadingMessage();
        
        try {
            // Load data
            console.log('Initializing data loader...');
            const success = await this.dataLoader.init(['US', 'CA', 'GB', 'DE', 'FR', 'IN', 'JP', 'KR', 'MX', 'RU']);
            
            if (success) {
                this.isDataLoaded = true;
                this.hideLoadingMessage();
                this.renderOverviewStats();
                console.log('Application initialized successfully');
                
                // Enable navigation buttons
                this.enableNavigation();
            } else {
                this.showErrorMessage('Failed to load data. Please check your data files.');
            }
        } catch (error) {
            console.error('Initialization error:', error);
            this.showErrorMessage(`Initialization failed: ${error.message}`);
        }
    }

    // Set up event listeners for navigation
    setupEventListeners() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const vizType = e.target.getAttribute('data-viz');
                this.switchVisualization(vizType);
            });
        });

        // Handle country filter dropdowns
        const countryFilter = document.getElementById('country-filter');
        if (countryFilter) {
            countryFilter.addEventListener('change', (e) => {
                if (this.currentVisualization === 'pie-chart') {
                    this.updatePieChartByCountry(e.target.value);
                }
            });
        }

        const timelineCountryFilter = document.getElementById('timeline-country-filter');
        if (timelineCountryFilter) {
            timelineCountryFilter.addEventListener('change', (e) => {
                if (this.currentVisualization === 'timeline') {
                    this.updateTimelineByCountry(e.target.value);
                }
            });
        }

        const scatterCountryFilter = document.getElementById('scatter-country-filter');
        if (scatterCountryFilter) {
            scatterCountryFilter.addEventListener('change', (e) => {
                if (this.currentVisualization === 'scatter') {
                    this.updateScatterByCountry(e.target.value);
                }
            });
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            if (this.isDataLoaded && this.currentVisualization !== 'overview') {
                // Debounce resize events
                clearTimeout(this.resizeTimeout);
                this.resizeTimeout = setTimeout(() => {
                    this.renderCurrentVisualization();
                }, 250);
            }
        });

        // Setup treemap event listeners
        this.setupTreemapEventListeners();
        
        // Setup engagement event listeners
        this.setupEngagementEventListeners();
        
        // Setup new chart event listeners
        this.setupTagEvolutionEventListeners();
    }

    // Enable/disable navigation
    enableNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
        });
        
        // Populate country filter dropdowns
        this.populateCountryFilter();
        this.populateTimelineCountryFilter();
        this.populateScatterCountryFilter();
        this.populateTreemapCountryFilter();
        this.populateEngagementFilters();

        // Re-render current visualization if it's the map
        if (this.currentVisualization === 'network') {
            const container = document.querySelector('#network .chart-container');
            if (container) {
                this.renderChoroplethMap(container);
            }
        }
    }

    disableNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            if (button.getAttribute('data-viz') !== 'overview') {
                button.disabled = true;
                button.style.opacity = '0.5';
            }
        });
    }

    // Switch between visualizations
    switchVisualization(vizType) {
        if (!this.isDataLoaded && vizType !== 'overview') {
            this.showErrorMessage('Data is still loading. Please wait...');
            return;
        }

        // Update active button
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-viz="${vizType}"]`).classList.add('active');

        // Hide all visualizations
        document.querySelectorAll('.visualization').forEach(viz => viz.classList.remove('active'));
        
        // Show selected visualization
        const targetViz = document.getElementById(vizType);
        targetViz.classList.add('active');

        this.currentVisualization = vizType;

        // Render the visualization if it's not overview
        if (vizType !== 'overview') {
            this.renderVisualization(vizType);
        }
    }

    // Render specific visualization
    renderVisualization(vizType) {
        const container = document.querySelector(`#${vizType} .chart-container`);
        if (!container) return;

        try {
            switch (vizType) {
                case 'bar-chart':
                    const viewsData = this.dataLoader.getViewsByCountry();
                    this.visualizations.createBarChart(viewsData, container);
                    break;

                case 'pie-chart':
                    const selectedCountry = document.getElementById('country-filter')?.value || 'all';
                    const categoryData = this.dataLoader.getCategoryDistributionByCountry(selectedCountry);
                    this.visualizations.createPieChart(categoryData, container, selectedCountry);
                    break;

                case 'scatter':
                    const selectedScatterCountry = document.getElementById('scatter-country-filter')?.value || 'all';
                    const scatterData = this.dataLoader.getViewsVsLikes(300, selectedScatterCountry);
                    this.visualizations.createScatterPlot(scatterData, container, selectedScatterCountry);
                    break;

                case 'timeline':
                    const selectedTimelineCountry = document.getElementById('timeline-country-filter')?.value || 'all';
                    const timelineData = this.dataLoader.getTimelineDataByCountry(selectedTimelineCountry);
                    this.visualizations.createTimeline(timelineData, container, selectedTimelineCountry);
                    break;

                case 'heatmap':
                    const heatmapData = this.dataLoader.getHeatmapData();
                    this.visualizations.createHeatmap(heatmapData, container);
                    break;

                case 'treemap':
                    this.renderTreemap(container);
                    break;

                case 'engagement':
                    this.renderEngagement(container);
                    break;

                case 'publishing-timing':
                    this.renderPublishingTiming(container);
                    break;

                case 'tag-evolution':
                    this.renderTagEvolution(container);
                    break;

                default:
                    console.warn(`Unknown visualization type: ${vizType}`);
            }
        } catch (error) {
            console.error(`Error rendering ${vizType}:`, error);
            this.showVisualizationError(container, `Error rendering visualization: ${error.message}`);
        }
    }

    // Re-render current visualization (for resize events)
    renderCurrentVisualization() {
        if (this.currentVisualization && this.currentVisualization !== 'overview') {
            this.renderVisualization(this.currentVisualization);
        }
    }

    // Populate country filter dropdown
    populateCountryFilter() {
        const countryFilter = document.getElementById('country-filter');
        if (!countryFilter || !this.isDataLoaded) return;

        // Clear existing options except "All Countries"
        const allOption = countryFilter.querySelector('option[value="all"]');
        countryFilter.innerHTML = '';
        countryFilter.appendChild(allOption);

        // Add country options
        const countries = this.dataLoader.getAvailableCountries();
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = this.getCountryDisplayName(country);
            countryFilter.appendChild(option);
        });
    }

    // Get display name for country code
    getCountryDisplayName(countryCode) {
        const countryNames = {
            'CA': 'Canada',
            'DE': 'Germany', 
            'FR': 'France',
            'GB': 'Great Britain',
            'IN': 'India',
            'JP': 'Japan',
            'KR': 'South Korea',
            'MX': 'Mexico',
            'RU': 'Russia',
            'US': 'United States'
        };
        return countryNames[countryCode] || countryCode;
    }

    // Update pie chart based on selected country
    updatePieChartByCountry(country) {
        const container = document.querySelector('#pie-chart .chart-container');
        if (!container) return;

        try {
            const categoryData = this.dataLoader.getCategoryDistributionByCountry(country);
            this.visualizations.createPieChart(categoryData, container, country);
        } catch (error) {
            console.error(`Error updating pie chart for country ${country}:`, error);
            this.showVisualizationError(container, `Error updating visualization: ${error.message}`);
        }
    }

    // Populate timeline country filter dropdown
    populateTimelineCountryFilter() {
        const timelineCountryFilter = document.getElementById('timeline-country-filter');
        if (!timelineCountryFilter || !this.isDataLoaded) return;

        // Clear existing options except "All Countries"
        const allOption = timelineCountryFilter.querySelector('option[value="all"]');
        timelineCountryFilter.innerHTML = '';
        timelineCountryFilter.appendChild(allOption);

        // Add country options
        const countries = this.dataLoader.getAvailableCountries();
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = this.getCountryDisplayName(country);
            timelineCountryFilter.appendChild(option);
        });
    }

    // Update timeline based on selected country
    updateTimelineByCountry(country) {
        const container = document.querySelector('#timeline .chart-container');
        if (!container) return;

        try {
            const timelineData = this.dataLoader.getTimelineDataByCountry(country);
            this.visualizations.createTimeline(timelineData, container, country);
        } catch (error) {
            console.error(`Error updating timeline for country ${country}:`, error);
            this.showVisualizationError(container, `Error updating visualization: ${error.message}`);
        }
    }

    // Populate scatter country filter dropdown
    populateScatterCountryFilter() {
        const scatterCountryFilter = document.getElementById('scatter-country-filter');
        if (!scatterCountryFilter || !this.isDataLoaded) return;

        // Clear existing options except "All Countries"
        const allOption = scatterCountryFilter.querySelector('option[value="all"]');
        scatterCountryFilter.innerHTML = '';
        scatterCountryFilter.appendChild(allOption);

        // Add country options
        const countries = this.dataLoader.getAvailableCountries();
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = this.getCountryDisplayName(country);
            scatterCountryFilter.appendChild(option);
        });
    }

    // Update scatter plot based on selected country
    updateScatterByCountry(country) {
        const container = document.querySelector('#scatter .chart-container');
        if (!container) return;

        try {
            const scatterData = this.dataLoader.getViewsVsLikes(300, country);
            this.visualizations.createScatterPlot(scatterData, container, country);
        } catch (error) {
            console.error(`Error updating scatter plot for country ${country}:`, error);
            this.showVisualizationError(container, `Error updating visualization: ${error.message}`);
        }
    }

    // Show loading message
    showLoadingMessage() {
        const container = document.querySelector('#overview');
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-message';
        loadingDiv.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <h3>Loading Data...</h3>
                <p>Please wait while we load the YouTube trending data.</p>
                <div style="margin: 20px auto; width: 50px; height: 50px; border: 3px solid #f3f3f3; border-top: 3px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
        container.appendChild(loadingDiv);
        this.disableNavigation();
    }

    // Hide loading message
    hideLoadingMessage() {
        const loadingDiv = document.getElementById('loading-message');
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }

    // Show error message
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="background-color: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px; margin: 20px; border: 1px solid #f5c6cb;">
                <strong>Error:</strong> ${message}
            </div>
        `;
        
        // Remove existing error messages
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Add new error message
        document.querySelector('.visualization-container').prepend(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }

    // Show visualization-specific error
    showVisualizationError(container, message) {
        container.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 5px;">
                <div style="text-align: center; color: #6c757d;">
                    <h4>Visualization Error</h4>
                    <p>${message}</p>
                    <button onclick="app.renderCurrentVisualization()" style="margin-top: 10px; padding: 8px 16px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    // Get application statistics
    getStats() {
        if (!this.isDataLoaded) return null;
        
        const allVideos = Object.values(this.dataLoader.videoData).flat();
        const totalViews = allVideos.reduce((sum, video) => sum + video.views, 0);
        const totalLikes = allVideos.reduce((sum, video) => sum + video.likes, 0);
        const countries = Object.keys(this.dataLoader.videoData);
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
    }

    // Render stats cards in overview section
    renderOverviewStats() {
        const stats = this.getStats();
        if (!stats) return;
        const overview = document.getElementById('overview');
        const existing = overview.querySelector('.stats-grid');
        if (existing) existing.remove();
        const grid = document.createElement('div');
        grid.className = 'stats-grid';
        grid.innerHTML = `
            <div class="stat-card">
                <h3>${stats.totalVideos.toLocaleString()}</h3>
                <p>Total Videos</p>
            </div>
            <div class="stat-card">
                <h3>${(stats.totalViews/1e6).toFixed(1)}M</h3>
                <p>Total Views</p>
            </div>
            <div class="stat-card">
                <h3>${(stats.totalLikes/1e6).toFixed(1)}M</h3>
                <p>Total Likes</p>
            </div>
            <div class="stat-card">
                <h3>${stats.countriesCount}</h3>
                <p>Countries</p>
            </div>
            <div class="stat-card">
                <h3>${stats.categoriesCount}</h3>
                <p>Categories</p>
            </div>
        `;
        overview.appendChild(grid);
    }

    // Render treemap with interactive controls
    renderTreemap(container) {
        try {
            // Update channel count display
            const totalChannels = this.dataLoader.getTotalChannelCount();
            const channelCountDisplay = document.getElementById('channel-count-display');
            if (channelCountDisplay) {
                channelCountDisplay.textContent = totalChannels.toLocaleString();
            }

            // Get current filter values
            const channelLimit = parseInt(document.getElementById('treemap-channel-limit')?.value || 25);
            const selectedCountry = document.getElementById('treemap-country-filter')?.value || 'all';

            // Get filtered data
            let treemapData;
            if (selectedCountry === 'all') {
                treemapData = this.dataLoader.getTopChannels(channelLimit);
            } else {
                treemapData = this.dataLoader.getChannelsByCountry(selectedCountry, channelLimit);
            }

            this.visualizations.createTreemap(treemapData, container);
        } catch (error) {
            console.error('Error rendering treemap:', error);
            this.showVisualizationError(container, `Error rendering treemap: ${error.message}`);
        }
    }

    // Populate treemap country filter dropdown
    populateTreemapCountryFilter() {
        const treemapCountryFilter = document.getElementById('treemap-country-filter');
        if (!treemapCountryFilter || !this.isDataLoaded) return;

        // Clear existing options except "All Countries"
        const allOption = treemapCountryFilter.querySelector('option[value="all"]');
        treemapCountryFilter.innerHTML = '';
        treemapCountryFilter.appendChild(allOption);

        // Add country options
        const countries = this.dataLoader.getAvailableCountries();
        countries.forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = this.getCountryDisplayName(country);
            treemapCountryFilter.appendChild(option);
        });
    }

    // Setup treemap event listeners
    setupTreemapEventListeners() {
        const channelLimitSelect = document.getElementById('treemap-channel-limit');
        const countryFilterSelect = document.getElementById('treemap-country-filter');

        if (channelLimitSelect) {
            channelLimitSelect.addEventListener('change', () => {
                const container = document.querySelector('#treemap .chart-container');
                if (container) {
                    this.renderTreemap(container);
                }
            });
        }

        if (countryFilterSelect) {
            countryFilterSelect.addEventListener('change', () => {
                const container = document.querySelector('#treemap .chart-container');
                if (container) {
                    this.renderTreemap(container);
                }
            });
        }
    }

    // Render engagement with filters
    renderEngagement(container) {
        try {
            // Get current filter values
            const selectedCountry = document.getElementById('engagement-country-filter')?.value || 'all';
            const selectedCategory = document.getElementById('engagement-category-filter')?.value || 'all';

            // Get filtered engagement data
            const engagementData = this.dataLoader.getFilteredEngagementMetrics(
                selectedCountry, 
                selectedCategory
            );

            this.visualizations.createDonutChart(engagementData, container);
        } catch (error) {
            console.error('Error rendering engagement:', error);
            this.showVisualizationError(container, `Error rendering engagement: ${error.message}`);
        }
    }

    // Populate engagement filter dropdowns
    populateEngagementFilters() {
        // Populate country filter
        const countryFilter = document.getElementById('engagement-country-filter');
        if (countryFilter && this.isDataLoaded) {
            const allOption = countryFilter.querySelector('option[value="all"]');
            countryFilter.innerHTML = '';
            countryFilter.appendChild(allOption);

            const countries = this.dataLoader.getAvailableCountries();
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = this.getCountryDisplayName(country);
                countryFilter.appendChild(option);
            });
        }

        // Populate category filter
        const categoryFilter = document.getElementById('engagement-category-filter');
        if (categoryFilter && this.isDataLoaded) {
            const allOption = categoryFilter.querySelector('option[value="all"]');
            categoryFilter.innerHTML = '';
            categoryFilter.appendChild(allOption);

            const categories = this.dataLoader.getAvailableCategories();
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }
    }

    // Setup engagement event listeners
    setupEngagementEventListeners() {
        const countryFilter = document.getElementById('engagement-country-filter');
        const categoryFilter = document.getElementById('engagement-category-filter');

        if (countryFilter) {
            countryFilter.addEventListener('change', () => {
                const container = document.querySelector('#engagement .chart-container');
                if (container) {
                    this.renderEngagement(container);
                }
            });
        }

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => {
                const container = document.querySelector('#engagement .chart-container');
                if (container) {
                    this.renderEngagement(container);
                }
            });
        }
    }

    // Render Publishing Timing Strategy
    renderPublishingTiming(container) {
        try {
            const timingData = this.dataLoader.getPublishingTimingData();
            this.visualizations.createPublishingTimingHeatmap(timingData, container);
        } catch (error) {
            console.error('Error rendering Publishing Timing Strategy:', error);
            this.showVisualizationError(container, `Error rendering Publishing Timing Strategy: ${error.message}`);
        }
    }

    // Render Tag Analysis Chart (supports multiple chart types)
    renderTagEvolution(container) {
        try {
            // Get current filter values
            const chartType = document.getElementById('tag-chart-type')?.value || 'racing-bars';
            const viewFilter = document.getElementById('tag-view-filter')?.value || 'overview';
            
            let tagData;
            
            // Get appropriate data based on chart type
            switch (chartType) {
                case 'racing-bars':
                    tagData = this.dataLoader.getTagRacingData(viewFilter);
                    break;
                case 'momentum-chart':
                    tagData = this.dataLoader.getTagMomentumData(viewFilter);
                    break;
                case 'flow-diagram':
                    tagData = this.dataLoader.getTagFlowData(viewFilter);
                    break;
                default:
                    tagData = this.dataLoader.getTagRacingData(viewFilter);
            }
            
            this.visualizations.createTagAnalysisChart(tagData, container, chartType);
        } catch (error) {
            console.error('Error rendering Tag Analysis Chart:', error);
            this.showVisualizationError(container, `Error rendering Tag Analysis Chart: ${error.message}`);
        }
    }

    // Setup tag analysis event listeners
    setupTagEvolutionEventListeners() {
        const chartTypeFilter = document.getElementById('tag-chart-type');
        const viewFilter = document.getElementById('tag-view-filter');
        
        // Chart type change handler
        if (chartTypeFilter) {
            chartTypeFilter.addEventListener('change', () => {
                const container = document.querySelector('#tag-evolution .chart-container');
                if (container) {
                    this.renderTagEvolution(container);
                }
            });
        }
        
        // View filter change handler  
        if (viewFilter) {
            viewFilter.addEventListener('change', () => {
                const container = document.querySelector('#tag-evolution .chart-container');
                if (container) {
                    this.renderTagEvolution(container);
                }
            });
        }
    }

}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new YouTubeDataVisualization();
    window.app.init();
});

// Utility function for debugging
window.getAppStats = () => {
    if (window.app && window.app.isDataLoaded) {
        const stats = window.app.getStats();
        console.table(stats);
        return stats;
    } else {
        console.log('App not initialized or data not loaded yet');
        return null;
    }
};