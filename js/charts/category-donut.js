// Category Distribution - Interactive Donut Chart
class CategoryDonutChart {
    constructor() {
        this.svg = null;
        this.tooltip = null;
        this.pie = null;
        this.arc = null;
        this.data = null;
        this.selectedSegment = null;
    }

    async render(container) {
        // Clear container
        container.innerHTML = '';
        
        // Get data
        this.data = dataLoader.aggregateByCategory();
        
        // Sort by video count for better visualization
        this.data.sort((a, b) => b.videoCount - a.videoCount);
        
        // Create SVG
        const width = container.clientWidth - 100;
        const height = 500;
        const radius = Math.min(width, height) / 2 - 50;
        
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);
        
        // Create tooltip
        this.tooltip = createTooltip();
        
        // Create pie generator
        this.pie = d3.pie()
            .value(d => d.videoCount)
            .sort(null);
        
        // Create arc generator
        this.arc = d3.arc()
            .innerRadius(radius * 0.4)
            .outerRadius(radius);
        
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(this.data.map(d => d.category))
            .range(d3.schemeCategory10);
        
        // Create segments
        const segments = this.svg.selectAll('.segment')
            .data(this.pie(this.data))
            .enter()
            .append('g')
            .attr('class', 'segment')
            .style('cursor', 'pointer');
        
        // Add paths
        segments.append('path')
            .attr('d', this.arc)
            .attr('fill', d => colorScale(d.data.category))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('opacity', 0.8)
            .style('transition', 'all 0.3s ease')
            .on('mouseover', (event, d) => {
                this.highlightSegment(event, d);
            })
            .on('mouseout', (event, d) => {
                this.unhighlightSegment(event, d);
            })
            .on('click', (event, d) => {
                this.explodeSegment(d);
            });
        
        // Add labels
        segments.append('text')
            .attr('transform', d => `translate(${this.arc.centroid(d)})`)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#fff')
            .attr('font-weight', 'bold')
            .text(d => {
                const percentage = ((d.data.videoCount / d3.sum(this.data, d => d.videoCount)) * 100).toFixed(1);
                return percentage > 5 ? `${percentage}%` : '';
            });
        
        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('text-anchor', 'middle')
            .attr('y', -height / 2 + 30)
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#2d3436')
            .text('Video Category Distribution');
        
        // Add legend
        this.createLegend(colorScale);
        
        // Add center text
        this.createCenterText();
        
        // Add controls
        this.createControls();
        
        // Add statistics
        this.addStatistics();
    }

    highlightSegment(event, d) {
        d3.select(event.target)
            .attr('opacity', 1)
            .attr('stroke-width', 3);
        
        const content = `
            <strong>${d.data.category}</strong><br/>
            Videos: ${d.data.videoCount}<br/>
            Percentage: ${((d.data.videoCount / d3.sum(this.data, d => d.videoCount)) * 100).toFixed(1)}%<br/>
            Total Views: ${formatNumber(d.data.totalViews)}<br/>
            Avg Views: ${formatNumber(d.data.avgViews)}<br/>
            Engagement Rate: ${(d.data.engagementRate * 100).toFixed(2)}%
        `;
        
        showTooltip(this.tooltip, content, event);
    }

    unhighlightSegment(event, d) {
        if (this.selectedSegment !== d.data.category) {
            d3.select(event.target)
                .attr('opacity', 0.8)
                .attr('stroke-width', 2);
        }
        
        hideTooltip(this.tooltip);
    }

    explodeSegment(d) {
        if (this.selectedSegment === d.data.category) {
            // Unexplode
            this.selectedSegment = null;
            this.svg.selectAll('.segment path')
                .transition()
                .duration(300)
                .attr('d', this.arc);
        } else {
            // Explode
            this.selectedSegment = d.data.category;
            
            const explodedArc = d3.arc()
                .innerRadius(radius * 0.4)
                .outerRadius(radius + 20);
            
            this.svg.selectAll('.segment path')
                .transition()
                .duration(300)
                .attr('d', (segmentData, i) => {
                    if (segmentData.data.category === d.data.category) {
                        return explodedArc(segmentData);
                    }
                    return this.arc(segmentData);
                });
        }
        
        this.showExplodeMessage(d.data.category);
    }

    showExplodeMessage(category) {
        d3.select('.explode-message').remove();
        
        const message = d3.select('#chart-container')
            .append('div')
            .attr('class', 'explode-message')
            .style('position', 'absolute')
            .style('top', '20px')
            .style('left', '20px')
            .style('background', this.selectedSegment ? '#e74c3c' : '#00b894')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .text(this.selectedSegment ? `Exploded: ${category}` : `Unexploded: ${category}`);
    }

    createLegend(colorScale) {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.svg.attr('width') / 2 - 150}, ${this.svg.attr('height') / 2 - 100})`);
        
        const legendItems = legend.selectAll('.legend-item')
            .data(this.data.slice(0, 10)) // Show top 10
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(${Math.floor(i / 5) * 200}, ${(i % 5) * 20})`)
            .style('cursor', 'pointer');
        
        legendItems.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d => colorScale(d.category));
        
        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .attr('font-size', '10px')
            .text(d => d.category.length > 15 ? d.category.substring(0, 15) + '...' : d.category);
        
        // Add legend interactions
        legendItems.on('click', (event, d) => {
            const segmentData = this.pie(this.data).find(segment => segment.data.category === d.category);
            if (segmentData) {
                this.explodeSegment(segmentData);
            }
        });
    }

    createCenterText() {
        const totalVideos = d3.sum(this.data, d => d.videoCount);
        const totalViews = d3.sum(this.data, d => d.totalViews);
        
        this.svg.append('text')
            .attr('class', 'center-text')
            .attr('text-anchor', 'middle')
            .attr('y', -10)
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .attr('fill', '#2d3436')
            .text(`Total Videos`);
        
        this.svg.append('text')
            .attr('class', 'center-text')
            .attr('text-anchor', 'middle')
            .attr('y', 10)
            .attr('font-size', '14px')
            .attr('fill', '#636e72')
            .text(`${formatNumber(totalVideos)}`);
        
        this.svg.append('text')
            .attr('class', 'center-text')
            .attr('text-anchor', 'middle')
            .attr('y', 30)
            .attr('font-size', '12px')
            .attr('fill', '#636e72')
            .text(`${formatNumber(totalViews)} views`);
    }

    createControls() {
        const controls = d3.select('#chart-container')
            .append('div')
            .attr('class', 'controls')
            .style('position', 'absolute')
            .style('top', '20px')
            .style('right', '20px')
            .style('background', 'rgba(255, 255, 255, 0.9)')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '12px');
        
        controls.append('div')
            .text('Controls:')
            .style('font-weight', 'bold')
            .style('margin-bottom', '5px');
        
        controls.append('div')
            .text('• Hover for details')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Click to explode')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Click legend items');
    }

    addStatistics() {
        const topCategory = this.data[0];
        const totalVideos = d3.sum(this.data, d => d.videoCount);
        const avgVideosPerCategory = (totalVideos / this.data.length).toFixed(1);
        
        const stats = d3.select('#chart-container')
            .append('div')
            .attr('class', 'statistics')
            .style('position', 'absolute')
            .style('bottom', '20px')
            .style('left', '20px')
            .style('background', 'rgba(255, 255, 255, 0.9)')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '12px');
        
        stats.append('div')
            .text('Statistics:')
            .style('font-weight', 'bold')
            .style('margin-bottom', '5px');
        
        stats.append('div')
            .text(`Top Category: ${topCategory.category} (${topCategory.videoCount} videos)`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Categories: ${this.data.length}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Avg Videos/Category: ${avgVideosPerCategory}`);
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        d3.select('.controls').remove();
        d3.select('.statistics').remove();
        d3.select('.explode-message').remove();
    }
}