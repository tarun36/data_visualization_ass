// Views vs Likes - Interactive Scatter Plot
class ViewsLikesScatterChart {
    constructor() {
        this.svg = null;
        this.tooltip = null;
        this.zoom = null;
        this.data = null;
    }

    async render(container) {
        // Clear container
        container.innerHTML = '';
        
        // Get data (sample of videos for better visualization)
        this.data = dataLoader.data.slice(0, 200); // Use first 200 videos
        
        // Create SVG
        const width = container.clientWidth - 100;
        const height = 500;
        const margin = { top: 40, right: 120, bottom: 80, left: 80 };
        
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create tooltip
        this.tooltip = createTooltip();
        
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.views)])
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.likes)])
            .range([height, 0]);
        
        // Create color scale by category
        const categories = [...new Set(this.data.map(d => dataLoader.getCategoryName(d.category_id)))];
        const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(d3.schemeCategory10);
        
        // Create axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d => formatNumber(d));
        const yAxis = d3.axisLeft(yScale).tickFormat(d => formatNumber(d));
        
        // Add X axis
        this.svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);
        
        // Add Y axis
        this.svg.append('g')
            .attr('class', 'axis')
            .call(yAxis);
        
        // Add axis labels
        this.svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', height + 50)
            .text('Total Views');
        
        this.svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -50)
            .text('Total Likes');
        
        // Create zoom behavior
        this.zoom = d3.zoom()
            .scaleExtent([0.5, 10])
            .on('zoom', (event) => {
                const newXScale = event.transform.rescaleX(xScale);
                const newYScale = event.transform.rescaleY(yScale);
                
                // Update axes
                this.svg.select('.axis').selectAll('g').remove();
                this.svg.append('g')
                    .attr('class', 'axis')
                    .attr('transform', `translate(0,${height})`)
                    .call(d3.axisBottom(newXScale).tickFormat(d => formatNumber(d)));
                
                this.svg.append('g')
                    .attr('class', 'axis')
                    .call(d3.axisLeft(newYScale).tickFormat(d => formatNumber(d)));
                
                // Update circles
                this.svg.selectAll('.circle')
                    .attr('cx', d => newXScale(d.views))
                    .attr('cy', d => newYScale(d.likes));
            });
        
        // Apply zoom to SVG
        d3.select(container).select('svg').call(this.zoom);
        
        // Create circles
        const circles = this.svg.selectAll('.circle')
            .data(this.data)
            .enter()
            .append('circle')
            .attr('class', 'circle')
            .attr('cx', d => xScale(d.views))
            .attr('cy', d => yScale(d.likes))
            .attr('r', 4)
            .attr('fill', d => colorScale(dataLoader.getCategoryName(d.category_id)))
            .attr('opacity', 0.7)
            .style('cursor', 'pointer')
            .style('transition', 'all 0.2s ease');
        
        // Add hover effects
        circles.on('mouseover', (event, d) => {
            d3.select(event.target)
                .attr('r', 6)
                .attr('opacity', 1)
                .attr('stroke', '#2d3436')
                .attr('stroke-width', 2);
            
            const content = `
                <strong>${d.title}</strong><br/>
                Channel: ${d.channel_title}<br/>
                Category: ${dataLoader.getCategoryName(d.category_id)}<br/>
                Views: ${formatNumber(d.views)}<br/>
                Likes: ${formatNumber(d.likes)}<br/>
                Engagement Rate: ${((d.likes / d.views) * 100).toFixed(2)}%
            `;
            
            showTooltip(this.tooltip, content, event);
        })
        .on('mouseout', (event) => {
            d3.select(event.target)
                .attr('r', 4)
                .attr('opacity', 0.7)
                .attr('stroke', 'none');
            
            hideTooltip(this.tooltip);
        })
        .on('click', (event, d) => {
            this.highlightCategory(dataLoader.getCategoryName(d.category_id));
        });
        
        // Add trend line
        this.addTrendLine(xScale, yScale);
        
        // Add legend
        this.createLegend(colorScale, categories);
        
        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#2d3436')
            .text('Views vs Likes Correlation');
        
        // Add controls
        this.createControls();
        
        // Add correlation info
        this.addCorrelationInfo();
    }

    addTrendLine(xScale, yScale) {
        // Calculate linear regression
        const n = this.data.length;
        const sumX = d3.sum(this.data, d => d.views);
        const sumY = d3.sum(this.data, d => d.likes);
        const sumXY = d3.sum(this.data, d => d.views * d.likes);
        const sumX2 = d3.sum(this.data, d => d.views * d.views);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Create trend line
        const line = d3.line()
            .x(d => d.x)
            .y(d => d.y);
        
        const trendData = [
            { x: 0, y: intercept },
            { x: d3.max(this.data, d => d.views), y: slope * d3.max(this.data, d => d.views) + intercept }
        ];
        
        this.svg.append('path')
            .datum(trendData)
            .attr('class', 'trend-line')
            .attr('d', line)
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('fill', 'none');
        
        // Add trend line label
        this.svg.append('text')
            .attr('x', width * 0.7)
            .attr('y', height * 0.2)
            .attr('font-size', '12px')
            .attr('fill', '#e74c3c')
            .text(`Trend Line (R² = ${this.calculateRSquared(slope, intercept).toFixed(3)})`);
    }

    calculateRSquared(slope, intercept) {
        const yMean = d3.mean(this.data, d => d.likes);
        const ssRes = d3.sum(this.data, d => Math.pow(d.likes - (slope * d.views + intercept), 2));
        const ssTot = d3.sum(this.data, d => Math.pow(d.likes - yMean, 2));
        return 1 - (ssRes / ssTot);
    }

    createLegend(colorScale, categories) {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.svg.attr('width') - 100}, 0)`);
        
        const legendItems = legend.selectAll('.legend-item')
            .data(categories.slice(0, 8)) // Show top 8 categories
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .style('cursor', 'pointer');
        
        legendItems.append('circle')
            .attr('r', 6)
            .attr('fill', d => colorScale(d));
        
        legendItems.append('text')
            .attr('x', 15)
            .attr('y', 4)
            .attr('font-size', '10px')
            .text(d => d.length > 12 ? d.substring(0, 12) + '...' : d);
        
        // Add legend interactions
        legendItems.on('click', (event, category) => {
            this.highlightCategory(category);
        });
    }

    createControls() {
        const controls = d3.select('#chart-container')
            .append('div')
            .attr('class', 'controls')
            .style('position', 'absolute')
            .style('top', '20px')
            .style('left', '20px')
            .style('background', 'rgba(255, 255, 255, 0.9)')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '12px');
        
        controls.append('div')
            .text('Controls:')
            .style('font-weight', 'bold')
            .style('margin-bottom', '5px');
        
        controls.append('div')
            .text('• Scroll to zoom')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Drag to pan')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Click points to filter')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Click legend to highlight');
    }

    addCorrelationInfo() {
        const correlation = this.calculateCorrelation();
        
        const info = d3.select('#chart-container')
            .append('div')
            .attr('class', 'correlation-info')
            .style('position', 'absolute')
            .style('top', '20px')
            .style('right', '20px')
            .style('background', 'rgba(255, 255, 255, 0.9)')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '12px');
        
        info.append('div')
            .text('Correlation Analysis:')
            .style('font-weight', 'bold')
            .style('margin-bottom', '5px');
        
        info.append('div')
            .text(`Correlation: ${correlation.toFixed(3)}`)
            .style('margin-bottom', '2px');
        
        info.append('div')
            .text(`Strength: ${this.getCorrelationStrength(correlation)}`)
            .style('margin-bottom', '2px');
        
        info.append('div')
            .text(`Sample Size: ${this.data.length} videos`);
    }

    calculateCorrelation() {
        const n = this.data.length;
        const sumX = d3.sum(this.data, d => d.views);
        const sumY = d3.sum(this.data, d => d.likes);
        const sumXY = d3.sum(this.data, d => d.views * d.likes);
        const sumX2 = d3.sum(this.data, d => d.views * d.views);
        const sumY2 = d3.sum(this.data, d => d.likes * d.likes);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return numerator / denominator;
    }

    getCorrelationStrength(correlation) {
        const abs = Math.abs(correlation);
        if (abs >= 0.8) return 'Very Strong';
        if (abs >= 0.6) return 'Strong';
        if (abs >= 0.4) return 'Moderate';
        if (abs >= 0.2) return 'Weak';
        return 'Very Weak';
    }

    highlightCategory(category) {
        // Reset all circles
        this.svg.selectAll('.circle')
            .attr('opacity', 0.7)
            .attr('r', 4);
        
        // Highlight selected category
        this.svg.selectAll('.circle')
            .filter(d => dataLoader.getCategoryName(d.category_id) === category)
            .attr('opacity', 1)
            .attr('r', 6)
            .attr('stroke', '#2d3436')
            .attr('stroke-width', 2);
        
        // Show highlight message
        this.showHighlightMessage(category);
    }

    showHighlightMessage(category) {
        d3.select('.highlight-message').remove();
        
        const message = d3.select('#chart-container')
            .append('div')
            .attr('class', 'highlight-message')
            .style('position', 'absolute')
            .style('top', '120px')
            .style('left', '20px')
            .style('background', '#00b894')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .text(`Highlighted: ${category}`);
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        d3.select('.controls').remove();
        d3.select('.correlation-info').remove();
        d3.select('.highlight-message').remove();
    }
}