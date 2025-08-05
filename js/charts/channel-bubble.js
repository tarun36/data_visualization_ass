// Channel Performance - Interactive Bubble Chart
class ChannelBubbleChart {
    constructor() {
        this.svg = null;
        this.tooltip = null;
        this.simulation = null;
        this.data = null;
        this.filteredData = null;
    }

    async render(container) {
        // Clear container
        container.innerHTML = '';
        
        // Get data
        this.data = dataLoader.getTopChannels(30); // Top 30 channels
        this.filteredData = [...this.data];
        
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
            .domain([0, d3.max(this.filteredData, d => d.totalViews)])
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.filteredData, d => d.engagementRate)])
            .range([height, 0]);
        
        const sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(this.filteredData, d => d.totalViews)])
            .range([5, 40]);
        
        // Create color scale by category
        const categories = [...new Set(this.filteredData.map(d => d.categories[0]))];
        const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(d3.schemeCategory10);
        
        // Create axes
        const xAxis = d3.axisBottom(xScale).tickFormat(d => formatNumber(d));
        const yAxis = d3.axisLeft(yScale).tickFormat(d => (d * 100).toFixed(1) + '%');
        
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
            .text('Engagement Rate (%)');
        
        // Create force simulation
        this.simulation = d3.forceSimulation(this.filteredData)
            .force('charge', d3.forceManyBody().strength(5))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => sizeScale(d.totalViews) + 2))
            .on('tick', () => {
                this.updateBubbles();
            });
        
        // Create bubbles
        const bubbles = this.svg.selectAll('.bubble')
            .data(this.filteredData)
            .enter()
            .append('g')
            .attr('class', 'bubble')
            .style('cursor', 'pointer');
        
        // Add circles
        bubbles.append('circle')
            .attr('class', 'bubble-circle')
            .attr('r', d => sizeScale(d.totalViews))
            .attr('fill', d => colorScale(d.categories[0]))
            .attr('opacity', 0.7)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('transition', 'all 0.2s ease')
            .on('mouseover', (event, d) => {
                this.highlightBubble(event, d);
            })
            .on('mouseout', (event) => {
                this.unhighlightBubble(event);
            })
            .on('click', (event, d) => {
                this.filterByCategory(d.categories[0]);
            });
        
        // Add labels
        bubbles.append('text')
            .attr('class', 'bubble-label')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#fff')
            .attr('font-weight', 'bold')
            .text(d => d.channel.length > 12 ? d.channel.substring(0, 12) + '...' : d.channel);
        
        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#2d3436')
            .text('Channel Performance Analysis');
        
        // Add legend
        this.createLegend(colorScale, categories);
        
        // Add controls
        this.createControls();
        
        // Add statistics
        this.addStatistics();
    }

    updateBubbles() {
        this.svg.selectAll('.bubble')
            .attr('transform', d => `translate(${d.x},${d.y})`);
    }

    highlightBubble(event, d) {
        d3.select(event.target)
            .attr('opacity', 1)
            .attr('stroke-width', 3)
            .attr('stroke', '#2d3436');
        
        const content = `
            <strong>${d.channel}</strong><br/>
            Category: ${d.categories.join(', ')}<br/>
            Total Views: ${formatNumber(d.totalViews)}<br/>
            Total Likes: ${formatNumber(d.totalLikes)}<br/>
            Videos: ${d.totalVideos}<br/>
            Engagement Rate: ${(d.engagementRate * 100).toFixed(2)}%<br/>
            Avg Views: ${formatNumber(d.avgViews)}
        `;
        
        showTooltip(this.tooltip, content, event);
    }

    unhighlightBubble(event) {
        d3.select(event.target)
            .attr('opacity', 0.7)
            .attr('stroke-width', 2)
            .attr('stroke', '#fff');
        
        hideTooltip(this.tooltip);
    }

    filterByCategory(category) {
        if (this.filteredData.length === this.data.length) {
            // Filter to show only selected category
            this.filteredData = this.data.filter(d => d.categories.includes(category));
            this.updateBubbleChart();
            this.showFilterMessage(category);
        } else {
            // Reset filter
            this.filteredData = [...this.data];
            this.updateBubbleChart();
            this.hideFilterMessage();
        }
    }

    updateBubbleChart() {
        // Update scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(this.filteredData, d => d.totalViews)])
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.filteredData, d => d.engagementRate)])
            .range([height, 0]);
        
        const sizeScale = d3.scaleSqrt()
            .domain([0, d3.max(this.filteredData, d => d.totalViews)])
            .range([5, 40]);
        
        const categories = [...new Set(this.filteredData.map(d => d.categories[0]))];
        const colorScale = d3.scaleOrdinal()
            .domain(categories)
            .range(d3.schemeCategory10);
        
        // Update simulation
        this.simulation.nodes(this.filteredData);
        this.simulation.alpha(1).restart();
        
        // Update bubbles
        const bubbles = this.svg.selectAll('.bubble')
            .data(this.filteredData, d => d.channel);
        
        // Remove old bubbles
        bubbles.exit().remove();
        
        // Update existing bubbles
        bubbles.select('.bubble-circle')
            .transition()
            .duration(500)
            .attr('r', d => sizeScale(d.totalViews))
            .attr('fill', d => colorScale(d.categories[0]));
        
        bubbles.select('.bubble-label')
            .transition()
            .duration(500)
            .text(d => d.channel.length > 12 ? d.channel.substring(0, 12) + '...' : d.channel);
        
        // Add new bubbles
        const newBubbles = bubbles.enter()
            .append('g')
            .attr('class', 'bubble')
            .style('cursor', 'pointer');
        
        newBubbles.append('circle')
            .attr('class', 'bubble-circle')
            .attr('r', d => sizeScale(d.totalViews))
            .attr('fill', d => colorScale(d.categories[0]))
            .attr('opacity', 0.7)
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('transition', 'all 0.2s ease')
            .on('mouseover', (event, d) => {
                this.highlightBubble(event, d);
            })
            .on('mouseout', (event) => {
                this.unhighlightBubble(event);
            })
            .on('click', (event, d) => {
                this.filterByCategory(d.categories[0]);
            });
        
        newBubbles.append('text')
            .attr('class', 'bubble-label')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#fff')
            .attr('font-weight', 'bold')
            .text(d => d.channel.length > 12 ? d.channel.substring(0, 12) + '...' : d.channel);
        
        // Update axes
        this.svg.select('.axis').selectAll('g').remove();
        this.svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d => formatNumber(d)));
        
        this.svg.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale).tickFormat(d => (d * 100).toFixed(1) + '%'));
    }

    showFilterMessage(category) {
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
            .text(`Filtered to show: ${category}`);
    }

    hideFilterMessage() {
        d3.select('.filter-message').remove();
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
            .attr('r', 8)
            .attr('fill', d => colorScale(d));
        
        legendItems.append('text')
            .attr('x', 15)
            .attr('y', 4)
            .attr('font-size', '10px')
            .text(d => d.length > 12 ? d.substring(0, 12) + '...' : d);
        
        // Add legend interactions
        legendItems.on('click', (event, category) => {
            this.filterByCategory(category);
        });
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
            .text('• Click to filter category')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Size = Total Views')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Color = Category');
    }

    addStatistics() {
        const topChannel = this.filteredData[0];
        const totalViews = d3.sum(this.filteredData, d => d.totalViews);
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
            .text(`Top Channel: ${topChannel.channel}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Total Views: ${formatNumber(totalViews)}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Avg Engagement: ${(avgEngagement * 100).toFixed(2)}%`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Channels: ${this.filteredData.length}`);
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        if (this.simulation) {
            this.simulation.stop();
        }
        d3.select('.controls').remove();
        d3.select('.statistics').remove();
        d3.select('.filter-message').remove();
    }
}