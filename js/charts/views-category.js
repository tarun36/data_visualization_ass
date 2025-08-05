// Views by Category - Interactive Bar Chart
class ViewsCategoryChart {
    constructor() {
        this.svg = null;
        this.tooltip = null;
        this.filteredData = null;
        this.originalData = null;
    }

    async render(container) {
        // Clear container
        container.innerHTML = '';
        
        // Get data
        this.originalData = dataLoader.aggregateByCategory();
        this.filteredData = [...this.originalData];
        
        // Sort by total views
        this.filteredData.sort((a, b) => b.totalViews - a.totalViews);
        
        // Create SVG
        const width = container.clientWidth - 100;
        const height = 500;
        const margin = { top: 40, right: 120, bottom: 100, left: 80 };
        
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create tooltip
        this.tooltip = createTooltip();
        
        // Create scales
        const xScale = d3.scaleBand()
            .domain(this.filteredData.map(d => d.category))
            .range([0, width])
            .padding(0.1);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.filteredData, d => d.totalViews)])
            .range([height, 0]);
        
        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).tickFormat(d => formatNumber(d));
        
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
            .text('Video Category');
        
        this.svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -50)
            .text('Total Views');
        
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(this.filteredData.map(d => d.category))
            .range(d3.schemeCategory10);
        
        // Create bars
        const bars = this.svg.selectAll('.bar')
            .data(this.filteredData)
            .enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.category))
            .attr('y', height)
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', d => colorScale(d.category))
            .attr('opacity', 0.8)
            .style('cursor', 'pointer');
        
        // Animate bars
        bars.transition()
            .duration(1000)
            .delay((d, i) => i * 100)
            .attr('y', d => yScale(d.totalViews))
            .attr('height', d => height - yScale(d.totalViews));
        
        // Add hover effects
        bars.on('mouseover', (event, d) => {
            d3.select(event.target)
                .attr('opacity', 1)
                .attr('stroke', '#2d3436')
                .attr('stroke-width', 2);
            
            const content = `
                <strong>${d.category}</strong><br/>
                Total Views: ${formatNumber(d.totalViews)}<br/>
                Total Likes: ${formatNumber(d.totalLikes)}<br/>
                Total Videos: ${d.videoCount}<br/>
                Avg Views: ${formatNumber(d.avgViews)}<br/>
                Engagement Rate: ${(d.engagementRate * 100).toFixed(2)}%
            `;
            
            showTooltip(this.tooltip, content, event);
        })
        .on('mouseout', (event) => {
            d3.select(event.target)
                .attr('opacity', 0.8)
                .attr('stroke', 'none');
            
            hideTooltip(this.tooltip);
        })
        .on('click', (event, d) => {
            this.filterByCategory(d.category);
        });
        
        // Add value labels on bars
        this.svg.selectAll('.value-label')
            .data(this.filteredData)
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.totalViews) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#2d3436')
            .text(d => formatNumber(d.totalViews));
        
        // Add legend
        this.createLegend(colorScale);
        
        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#2d3436')
            .text('Total Views by Video Category');
        
        // Add reset button
        this.createResetButton();
    }

    createLegend(colorScale) {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.svg.attr('width') - 100}, 0)`);
        
        const legendItems = legend.selectAll('.legend-item')
            .data(this.filteredData.slice(0, 10)) // Show top 10
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`);
        
        legendItems.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d => colorScale(d.category));
        
        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .attr('font-size', '10px')
            .text(d => d.category.length > 15 ? d.category.substring(0, 15) + '...' : d.category);
    }

    createResetButton() {
        const resetButton = d3.select('#chart-container')
            .append('button')
            .attr('class', 'reset-btn')
            .style('position', 'absolute')
            .style('top', '20px')
            .style('right', '20px')
            .style('padding', '8px 16px')
            .style('background', '#00b894')
            .style('color', 'white')
            .style('border', 'none')
            .style('border-radius', '5px')
            .style('cursor', 'pointer')
            .style('font-size', '12px')
            .text('Reset Filter')
            .on('click', () => this.resetFilter());
    }

    filterByCategory(category) {
        // Filter data to show only selected category
        this.filteredData = this.originalData.filter(d => d.category === category);
        
        // Update chart with filtered data
        this.updateChart();
        
        // Show filtered message
        this.showFilterMessage(category);
    }

    resetFilter() {
        this.filteredData = [...this.originalData];
        this.filteredData.sort((a, b) => b.totalViews - a.totalViews);
        this.updateChart();
        this.hideFilterMessage();
    }

    updateChart() {
        const width = this.svg.attr('width') - 100;
        const height = 500;
        
        // Update scales
        const xScale = d3.scaleBand()
            .domain(this.filteredData.map(d => d.category))
            .range([0, width])
            .padding(0.1);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.filteredData, d => d.totalViews)])
            .range([height, 0]);
        
        // Update bars
        const bars = this.svg.selectAll('.bar')
            .data(this.filteredData, d => d.category);
        
        // Remove old bars
        bars.exit().remove();
        
        // Update existing bars
        bars.transition()
            .duration(500)
            .attr('x', d => xScale(d.category))
            .attr('y', d => yScale(d.totalViews))
            .attr('width', xScale.bandwidth())
            .attr('height', d => height - yScale(d.totalViews));
        
        // Add new bars
        bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d.category))
            .attr('y', height)
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', d => d3.schemeCategory10[this.originalData.findIndex(item => item.category === d.category) % 10])
            .attr('opacity', 0.8)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .attr('opacity', 1)
                    .attr('stroke', '#2d3436')
                    .attr('stroke-width', 2);
                
                const content = `
                    <strong>${d.category}</strong><br/>
                    Total Views: ${formatNumber(d.totalViews)}<br/>
                    Total Likes: ${formatNumber(d.totalLikes)}<br/>
                    Total Videos: ${d.videoCount}<br/>
                    Avg Views: ${formatNumber(d.avgViews)}<br/>
                    Engagement Rate: ${(d.engagementRate * 100).toFixed(2)}%
                `;
                
                showTooltip(this.tooltip, content, event);
            })
            .on('mouseout', (event) => {
                d3.select(event.target)
                    .attr('opacity', 0.8)
                    .attr('stroke', 'none');
                
                hideTooltip(this.tooltip);
            })
            .on('click', (event, d) => {
                this.filterByCategory(d.category);
            })
            .transition()
            .duration(500)
            .attr('y', d => yScale(d.totalViews))
            .attr('height', d => height - yScale(d.totalViews));
        
        // Update axes
        this.svg.select('.axis').remove();
        this.svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');
        
        // Update value labels
        this.svg.selectAll('.value-label').remove();
        this.svg.selectAll('.value-label')
            .data(this.filteredData)
            .enter()
            .append('text')
            .attr('class', 'value-label')
            .attr('x', d => xScale(d.category) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(d.totalViews) - 5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '10px')
            .attr('fill', '#2d3436')
            .text(d => formatNumber(d.totalViews));
    }

    showFilterMessage(category) {
        const message = d3.select('#chart-container')
            .append('div')
            .attr('class', 'filter-message')
            .style('position', 'absolute')
            .style('top', '60px')
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

    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        d3.select('.reset-btn').remove();
        d3.select('.filter-message').remove();
    }
}