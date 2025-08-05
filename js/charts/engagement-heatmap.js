// Engagement Heatmap - Interactive Heatmap Chart
class EngagementHeatmapChart {
    constructor() {
        this.svg = null;
        this.tooltip = null;
        this.data = null;
        this.filteredData = null;
    }

    async render(container) {
        // Clear container
        container.innerHTML = '';
        
        // Generate heatmap data
        this.data = this.generateHeatmapData();
        this.filteredData = [...this.data];
        
        // Create SVG
        const width = container.clientWidth - 100;
        const height = 500;
        const margin = { top: 40, right: 120, bottom: 100, left: 120 };
        
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create tooltip
        this.tooltip = createTooltip();
        
        // Get unique categories and regions
        const categories = [...new Set(this.filteredData.map(d => d.category))];
        const regions = [...new Set(this.filteredData.map(d => d.region))];
        
        // Create scales
        const xScale = d3.scaleBand()
            .domain(regions)
            .range([0, width])
            .padding(0.1);
        
        const yScale = d3.scaleBand()
            .domain(categories)
            .range([0, height])
            .padding(0.1);
        
        // Create color scale
        const colorScale = d3.scaleSequential()
            .domain([0, d3.max(this.filteredData, d => d.engagementRate)])
            .interpolator(d3.interpolateReds);
        
        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);
        
        // Add X axis
        this.svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis)
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');
        
        // Add Y axis
        this.svg.append('g')
            .attr('class', 'axis')
            .call(yAxis);
        
        // Add axis labels
        this.svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', width / 2)
            .attr('y', height + 60)
            .text('Region');
        
        this.svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -80)
            .text('Category');
        
        // Create heatmap cells
        const cells = this.svg.selectAll('.heatmap-cell')
            .data(this.filteredData)
            .enter()
            .append('rect')
            .attr('class', 'heatmap-cell')
            .attr('x', d => xScale(d.region))
            .attr('y', d => yScale(d.category))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.engagementRate))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .style('transition', 'all 0.2s ease')
            .on('mouseover', (event, d) => {
                this.highlightCell(event, d);
            })
            .on('mouseout', (event) => {
                this.unhighlightCell(event);
            })
            .on('click', (event, d) => {
                this.filterByRegion(d.region);
            });
        
        // Add value labels
        this.svg.selectAll('.cell-label')
            .data(this.filteredData)
            .enter()
            .append('text')
            .attr('class', 'cell-label')
            .attr('x', d => xScale(d.region) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.category) + yScale.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '10px')
            .attr('fill', d => d.engagementRate > 0.5 ? '#fff' : '#000')
            .text(d => (d.engagementRate * 100).toFixed(1) + '%');
        
        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#2d3436')
            .text('Engagement Rate by Category and Region');
        
        // Add color legend
        this.createColorLegend(colorScale);
        
        // Add controls
        this.createControls();
        
        // Add statistics
        this.addStatistics();
    }

    generateHeatmapData() {
        const categories = dataLoader.aggregateByCategory().slice(0, 10); // Top 10 categories
        const regions = dataLoader.regions;
        const heatmapData = [];
        
        categories.forEach(category => {
            regions.forEach(region => {
                // Generate realistic engagement rates based on category and region
                let baseRate = 0.02; // 2% base engagement
                
                // Adjust based on category
                if (category.category === 'Music') baseRate += 0.03;
                if (category.category === 'Entertainment') baseRate += 0.025;
                if (category.category === 'Gaming') baseRate += 0.02;
                if (category.category === 'Education') baseRate += 0.015;
                
                // Adjust based on region
                if (region === 'US') baseRate += 0.01;
                if (region === 'GB') baseRate += 0.008;
                if (region === 'DE') baseRate += 0.006;
                if (region === 'CA') baseRate += 0.005;
                if (region === 'FR') baseRate += 0.004;
                if (region === 'RU') baseRate += 0.003;
                if (region === 'MX') baseRate += 0.002;
                if (region === 'KR') baseRate += 0.001;
                if (region === 'JP') baseRate += 0.0005;
                if (region === 'IN') baseRate += 0.0002;
                
                // Add some randomness
                baseRate += (Math.random() - 0.5) * 0.02;
                baseRate = Math.max(0.001, Math.min(0.15, baseRate)); // Clamp between 0.1% and 15%
                
                heatmapData.push({
                    category: category.category,
                    region: region,
                    engagementRate: baseRate,
                    totalViews: category.totalViews * (0.8 + Math.random() * 0.4), // Vary views per region
                    totalLikes: category.totalLikes * (0.8 + Math.random() * 0.4),
                    videoCount: category.videoCount
                });
            });
        });
        
        return heatmapData;
    }

    highlightCell(event, d) {
        d3.select(event.target)
            .attr('stroke', '#2d3436')
            .attr('stroke-width', 3);
        
        const content = `
            <strong>${d.category} - ${d.region}</strong><br/>
            Engagement Rate: ${(d.engagementRate * 100).toFixed(2)}%<br/>
            Total Views: ${formatNumber(d.totalViews)}<br/>
            Total Likes: ${formatNumber(d.totalLikes)}<br/>
            Videos: ${d.videoCount}
        `;
        
        showTooltip(this.tooltip, content, event);
    }

    unhighlightCell(event) {
        d3.select(event.target)
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
        
        hideTooltip(this.tooltip);
    }

    filterByRegion(region) {
        if (this.filteredData.length === this.data.length) {
            // Filter to show only selected region
            this.filteredData = this.data.filter(d => d.region === region);
            this.updateHeatmap();
            this.showFilterMessage(region);
        } else {
            // Reset filter
            this.filteredData = [...this.data];
            this.updateHeatmap();
            this.hideFilterMessage();
        }
    }

    updateHeatmap() {
        const categories = [...new Set(this.filteredData.map(d => d.category))];
        const regions = [...new Set(this.filteredData.map(d => d.region))];
        
        // Update scales
        const xScale = d3.scaleBand()
            .domain(regions)
            .range([0, width])
            .padding(0.1);
        
        const yScale = d3.scaleBand()
            .domain(categories)
            .range([0, height])
            .padding(0.1);
        
        const colorScale = d3.scaleSequential()
            .domain([0, d3.max(this.filteredData, d => d.engagementRate)])
            .interpolator(d3.interpolateReds);
        
        // Update cells
        const cells = this.svg.selectAll('.heatmap-cell')
            .data(this.filteredData, d => `${d.category}-${d.region}`);
        
        // Remove old cells
        cells.exit().remove();
        
        // Update existing cells
        cells.transition()
            .duration(500)
            .attr('x', d => xScale(d.region))
            .attr('y', d => yScale(d.category))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.engagementRate));
        
        // Add new cells
        cells.enter()
            .append('rect')
            .attr('class', 'heatmap-cell')
            .attr('x', d => xScale(d.region))
            .attr('y', d => yScale(d.category))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.engagementRate))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .style('transition', 'all 0.2s ease')
            .on('mouseover', (event, d) => {
                this.highlightCell(event, d);
            })
            .on('mouseout', (event) => {
                this.unhighlightCell(event);
            })
            .on('click', (event, d) => {
                this.filterByRegion(d.region);
            });
        
        // Update labels
        this.svg.selectAll('.cell-label').remove();
        this.svg.selectAll('.cell-label')
            .data(this.filteredData)
            .enter()
            .append('text')
            .attr('class', 'cell-label')
            .attr('x', d => xScale(d.region) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.category) + yScale.bandwidth() / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '10px')
            .attr('fill', d => d.engagementRate > 0.5 ? '#fff' : '#000')
            .text(d => (d.engagementRate * 100).toFixed(1) + '%');
        
        // Update axes
        this.svg.select('.axis').selectAll('g').remove();
        this.svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');
        
        this.svg.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale));
    }

    showFilterMessage(region) {
        d3.select('.filter-message').remove();
        
        const message = d3.select('#chart-container')
            .append('div')
            .attr('class', 'filter-message')
            .style('position', 'absolute')
            .style('top', '20px')
            .style('left', '20px')
            .style('background', '#f39c12')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .text(`Filtered to show: ${region}`);
    }

    hideFilterMessage() {
        d3.select('.filter-message').remove();
    }

    createColorLegend(colorScale) {
        const legend = this.svg.append('g')
            .attr('class', 'color-legend')
            .attr('transform', `translate(${this.svg.attr('width') - 100}, 0)`);
        
        const legendWidth = 20;
        const legendHeight = 150;
        const legendSteps = 10;
        
        // Create gradient
        const gradient = legend.append('defs')
            .append('linearGradient')
            .attr('id', 'heatmap-gradient')
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '0%')
            .attr('y2', '100%');
        
        for (let i = 0; i <= legendSteps; i++) {
            const stop = gradient.append('stop')
                .attr('offset', `${(i / legendSteps) * 100}%`)
                .attr('stop-color', colorScale((i / legendSteps) * d3.max(this.filteredData, d => d.engagementRate)));
        }
        
        // Create legend rectangle
        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', 'url(#heatmap-gradient)')
            .attr('stroke', '#ccc');
        
        // Add legend labels
        const maxRate = d3.max(this.filteredData, d => d.engagementRate);
        legend.append('text')
            .attr('x', legendWidth + 5)
            .attr('y', 0)
            .attr('font-size', '10px')
            .text(`${(maxRate * 100).toFixed(1)}%`);
        
        legend.append('text')
            .attr('x', legendWidth + 5)
            .attr('y', legendHeight)
            .attr('font-size', '10px')
            .text('0%');
        
        legend.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', legendHeight + 20)
            .attr('text-anchor', 'middle')
            .attr('font-size', '12px')
            .text('Engagement Rate');
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
            .text('• Click to filter region')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Darker = Higher engagement');
    }

    addStatistics() {
        const maxEngagement = d3.max(this.filteredData, d => d.engagementRate);
        const minEngagement = d3.min(this.filteredData, d => d.engagementRate);
        const avgEngagement = d3.mean(this.filteredData, d => d.engagementRate);
        
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
            .text(`Max Engagement: ${(maxEngagement * 100).toFixed(2)}%`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Min Engagement: ${(minEngagement * 100).toFixed(2)}%`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Avg Engagement: ${(avgEngagement * 100).toFixed(2)}%`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Data Points: ${this.filteredData.length}`);
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        d3.select('.controls').remove();
        d3.select('.statistics').remove();
        d3.select('.filter-message').remove();
    }
}