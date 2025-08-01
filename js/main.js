// Main Application Logic
class YouTubeDataVisualization {
    constructor() {
        this.currentVisualization = 'overview';
        this.dataLoader = window.dataLoader;
        this.visualizations = window.visualizations;
        this.isDataLoaded = false;
    }

    // Initialize the application
    async init() {
        this.setupEventListeners();
        this.showLoadingMessage();
        
        try {
            // Load data
            console.log('Initializing data loader...');
            const success = await this.dataLoader.init(['US', 'CA', 'GB', 'DE', 'FR']);
            
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
    }

    // Enable/disable navigation
    enableNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(button => {
            button.disabled = false;
            button.style.opacity = '1';
        });
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
                    const categoryData = this.dataLoader.getCategoryDistribution();
                    this.visualizations.createPieChart(categoryData, container);
                    break;

                case 'scatter':
                    const scatterData = this.dataLoader.getViewsVsLikes(300);
                    this.visualizations.createScatterPlot(scatterData, container);
                    break;

                case 'timeline':
                    const timelineData = this.dataLoader.getTimelineData();
                    this.visualizations.createTimeline(timelineData, container);
                    break;

                case 'heatmap':
                    const heatmapData = this.dataLoader.getViewsByCountry();
                    this.visualizations.createHeatmap(heatmapData, container);
                    break;

                case 'treemap':
                    const treemapData = this.dataLoader.getTopChannels(15);
                    this.visualizations.createTreemap(treemapData, container);
                    break;

                case 'engagement':
                    const engagementData = this.dataLoader.getEngagementMetrics();
                    this.visualizations.createDonutChart(engagementData, container);
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