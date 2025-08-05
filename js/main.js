// Main application controller
class DashboardController {
    constructor() {
        this.currentChart = null;
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            // Load data first
            await dataLoader.loadData();
            
            // Initialize all chart modules
            this.initializeCharts();
            
            // Set up navigation
            this.setupNavigation();
            
            // Load default chart
            this.loadChart('views-category');
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to load data. Please refresh the page.');
        }
    }

    initializeCharts() {
        // Initialize all chart modules
        this.charts = {
            'views-category': new ViewsCategoryChart(),
            'views-likes-scatter': new ViewsLikesScatterChart(),
            'category-donut': new CategoryDonutChart(),
            'trending-line': new TrendingLineChart(),
            'engagement-heatmap': new EngagementHeatmapChart(),
            'channel-bubble': new ChannelBubbleChart(),
            'video-sankey': new VideoSankeyChart(),
            'category-treemap': new CategoryTreemapChart()
        };
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const chartType = e.target.dataset.chart;
                this.loadChart(chartType);
                
                // Update active button
                navButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    async loadChart(chartType) {
        const container = document.getElementById('chart-container');
        const infoPanel = document.getElementById('chart-info');
        
        // Show loading
        container.innerHTML = '<div id="loading">Loading chart...</div>';
        
        try {
            // Clear previous chart
            if (this.currentChart && this.currentChart.destroy) {
                this.currentChart.destroy();
            }
            
            // Create new chart
            if (this.charts[chartType]) {
                this.currentChart = this.charts[chartType];
                await this.currentChart.render(container);
                
                // Update info panel
                this.updateInfoPanel(chartType);
                
                // Add fade-in animation
                container.classList.add('fade-in');
                setTimeout(() => container.classList.remove('fade-in'), 500);
                
            } else {
                throw new Error(`Chart type ${chartType} not found`);
            }
            
        } catch (error) {
            console.error('Error loading chart:', error);
            this.showError('Failed to load chart. Please try again.');
        }
    }

    updateInfoPanel(chartType) {
        const infoPanel = document.getElementById('chart-info');
        const chartInfo = this.getChartInfo(chartType);
        
        infoPanel.innerHTML = `
            <h4>${chartInfo.title}</h4>
            <p><strong>Description:</strong> ${chartInfo.description}</p>
            <p><strong>Data Source:</strong> ${chartInfo.dataSource}</p>
            <p><strong>Interactions:</strong> ${chartInfo.interactions}</p>
            <p><strong>Key Insights:</strong> ${chartInfo.insights}</p>
        `;
    }

    getChartInfo(chartType) {
        const chartInfo = {
            'views-category': {
                title: 'Views by Category',
                description: 'Bar chart showing total views aggregated by video category. Helps identify which content types are most popular.',
                dataSource: 'Aggregated view counts by category_id',
                interactions: 'Hover for details, click to filter, animated transitions',
                insights: 'Music and Entertainment categories typically receive the highest view counts.'
            },
            'views-likes-scatter': {
                title: 'Views vs Likes Correlation',
                description: 'Scatter plot analyzing the relationship between video views and likes. Shows engagement patterns.',
                dataSource: 'Individual video views and likes data',
                interactions: 'Zoom, pan, hover tooltips, color by category',
                insights: 'Strong correlation between views and likes, with some outliers showing high engagement.'
            },
            'category-donut': {
                title: 'Category Distribution',
                description: 'Donut chart showing the percentage breakdown of videos across different categories.',
                dataSource: 'Video count by category',
                interactions: 'Click to explode segments, hover animations',
                insights: 'Entertainment and Music dominate the trending videos landscape.'
            },
            'trending-line': {
                title: 'Trending Over Time',
                description: 'Line chart showing how engagement metrics change over time across trending dates.',
                dataSource: 'Time series of aggregated metrics',
                interactions: 'Multi-line display, zoom, brush selection',
                insights: 'Seasonal patterns and trending spikes are visible in the data.'
            },
            'engagement-heatmap': {
                title: 'Engagement Heatmap',
                description: 'Heatmap comparing engagement rates across different categories and regions.',
                dataSource: 'Average engagement metrics by category and region',
                interactions: 'Color intensity, hover details, click to filter',
                insights: 'Regional preferences and category performance vary significantly.'
            },
            'channel-bubble': {
                title: 'Channel Performance',
                description: 'Bubble chart showing top channels by multiple performance metrics.',
                dataSource: 'Channel aggregated performance data',
                interactions: 'Size = views, color = category, hover = channel details',
                insights: 'Large channels dominate views, but smaller channels can have high engagement rates.'
            },
            'video-sankey': {
                title: 'Video Journey Flow',
                description: 'Sankey diagram showing the flow from category to channel to engagement metrics.',
                dataSource: 'Hierarchical relationship data',
                interactions: 'Interactive flow, hover to highlight paths',
                insights: 'Shows how content flows through different channels and categories.'
            },
            'category-treemap': {
                title: 'Category Treemap',
                description: 'Treemap showing nested structure of content categories and their relative sizes.',
                dataSource: 'Hierarchical category and channel data',
                interactions: 'Zoom into sections, hover for details',
                insights: 'Visual representation of content hierarchy and distribution.'
            }
        };
        
        return chartInfo[chartType] || {
            title: 'Unknown Chart',
            description: 'Chart information not available.',
            dataSource: 'Unknown',
            interactions: 'None',
            insights: 'No insights available.'
        };
    }

    showError(message) {
        const container = document.getElementById('chart-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #e74c3c;">
                <h3>Error</h3>
                <p>${message}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Reload Page
                </button>
            </div>
        `;
    }
}

// Utility functions
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function createTooltip() {
    const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0);
    
    return tooltip;
}

function showTooltip(tooltip, content, event) {
    tooltip.transition()
        .duration(200)
        .style('opacity', 0.9);
    
    tooltip.html(content)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 28) + 'px');
}

function hideTooltip(tooltip) {
    tooltip.transition()
        .duration(500)
        .style('opacity', 0);
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardController();
});