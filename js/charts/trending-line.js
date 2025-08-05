// Trending Over Time - Interactive Line Chart
class TrendingLineChart {
    constructor() {
        this.svg = null;
        this.tooltip = null;
        this.zoom = null;
        this.brush = null;
        this.data = null;
        this.filteredData = null;
    }

    async render(container) {
        // Clear container
        container.innerHTML = '';
        
        // Get data
        this.data = dataLoader.getTimeSeriesData();
        this.filteredData = [...this.data];
        
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
        const xScale = d3.scaleTime()
            .domain(d3.extent(this.filteredData, d => d.date))
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.filteredData, d => Math.max(d.totalViews, d.totalLikes, d.totalDislikes))])
            .range([height, 0]);
        
        // Create line generators
        const viewsLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.totalViews))
            .curve(d3.curveMonotoneX);
        
        const likesLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.totalLikes))
            .curve(d3.curveMonotoneX);
        
        const dislikesLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.totalDislikes))
            .curve(d3.curveMonotoneX);
        
        // Create axes
        const xAxis = d3.axisBottom(xScale);
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
            .attr('y', height + 60)
            .text('Date');
        
        this.svg.append('text')
            .attr('class', 'axis-label')
            .attr('text-anchor', 'middle')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -50)
            .text('Total Count');
        
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(['Views', 'Likes', 'Dislikes'])
            .range(['#3498db', '#2ecc71', '#e74c3c']);
        
        // Add lines
        this.svg.append('path')
            .datum(this.filteredData)
            .attr('class', 'line views-line')
            .attr('d', viewsLine)
            .attr('stroke', colorScale('Views'))
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .style('opacity', 0.8);
        
        this.svg.append('path')
            .datum(this.filteredData)
            .attr('class', 'line likes-line')
            .attr('d', likesLine)
            .attr('stroke', colorScale('Likes'))
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .style('opacity', 0.8);
        
        this.svg.append('path')
            .datum(this.filteredData)
            .attr('class', 'line dislikes-line')
            .attr('d', dislikesLine)
            .attr('stroke', colorScale('Dislikes'))
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .style('opacity', 0.8);
        
        // Add data points
        const points = this.svg.selectAll('.point')
            .data(this.filteredData)
            .enter()
            .append('g')
            .attr('class', 'point')
            .style('cursor', 'pointer');
        
        // Views points
        points.append('circle')
            .attr('class', 'views-point')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.totalViews))
            .attr('r', 4)
            .attr('fill', colorScale('Views'))
            .attr('opacity', 0.7)
            .on('mouseover', (event, d) => {
                this.highlightPoint(event, d, 'Views', d.totalViews);
            })
            .on('mouseout', (event) => {
                this.unhighlightPoint(event);
            });
        
        // Likes points
        points.append('circle')
            .attr('class', 'likes-point')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.totalLikes))
            .attr('r', 4)
            .attr('fill', colorScale('Likes'))
            .attr('opacity', 0.7)
            .on('mouseover', (event, d) => {
                this.highlightPoint(event, d, 'Likes', d.totalLikes);
            })
            .on('mouseout', (event) => {
                this.unhighlightPoint(event);
            });
        
        // Dislikes points
        points.append('circle')
            .attr('class', 'dislikes-point')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.totalDislikes))
            .attr('r', 4)
            .attr('fill', colorScale('Dislikes'))
            .attr('opacity', 0.7)
            .on('mouseover', (event, d) => {
                this.highlightPoint(event, d, 'Dislikes', d.totalDislikes);
            })
            .on('mouseout', (event) => {
                this.unhighlightPoint(event);
            });
        
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
                    .call(d3.axisBottom(newXScale));
                
                this.svg.append('g')
                    .attr('class', 'axis')
                    .call(d3.axisLeft(newYScale).tickFormat(d => formatNumber(d)));
                
                // Update lines
                const newViewsLine = d3.line()
                    .x(d => newXScale(d.date))
                    .y(d => newYScale(d.totalViews))
                    .curve(d3.curveMonotoneX);
                
                const newLikesLine = d3.line()
                    .x(d => newXScale(d.date))
                    .y(d => newYScale(d.totalLikes))
                    .curve(d3.curveMonotoneX);
                
                const newDislikesLine = d3.line()
                    .x(d => newXScale(d.date))
                    .y(d => newYScale(d.totalDislikes))
                    .curve(d3.curveMonotoneX);
                
                this.svg.select('.views-line').attr('d', newViewsLine);
                this.svg.select('.likes-line').attr('d', newLikesLine);
                this.svg.select('.dislikes-line').attr('d', newDislikesLine);
                
                // Update points
                this.svg.selectAll('.views-point')
                    .attr('cx', d => newXScale(d.date))
                    .attr('cy', d => newYScale(d.totalViews));
                
                this.svg.selectAll('.likes-point')
                    .attr('cx', d => newXScale(d.date))
                    .attr('cy', d => newYScale(d.totalLikes));
                
                this.svg.selectAll('.dislikes-point')
                    .attr('cx', d => newXScale(d.date))
                    .attr('cy', d => newYScale(d.totalDislikes));
            });
        
        // Apply zoom to SVG
        d3.select(container).select('svg').call(this.zoom);
        
        // Create brush for selection
        this.brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on('end', (event) => {
                if (!event.selection) return;
                
                const [x0, x1] = event.selection;
                const newXScale = d3.scaleTime()
                    .domain([xScale.invert(x0), xScale.invert(x1)])
                    .range([0, width]);
                
                this.filteredData = this.data.filter(d => 
                    d.date >= xScale.invert(x0) && d.date <= xScale.invert(x1)
                );
                
                this.updateChart();
            });
        
        this.svg.append('g')
            .attr('class', 'brush')
            .call(this.brush);
        
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
            .text('Trending Metrics Over Time');
        
        // Add controls
        this.createControls();
        
        // Add statistics
        this.addStatistics();
    }

    highlightPoint(event, d, metric, value) {
        d3.select(event.target)
            .attr('r', 6)
            .attr('opacity', 1)
            .attr('stroke', '#2d3436')
            .attr('stroke-width', 2);
        
        const content = `
            <strong>${d.date.toLocaleDateString()}</strong><br/>
            ${metric}: ${formatNumber(value)}<br/>
            Total Views: ${formatNumber(d.totalViews)}<br/>
            Total Likes: ${formatNumber(d.totalLikes)}<br/>
            Total Dislikes: ${formatNumber(d.totalDislikes)}<br/>
            Videos: ${d.videoCount}
        `;
        
        showTooltip(this.tooltip, content, event);
    }

    unhighlightPoint(event) {
        d3.select(event.target)
            .attr('r', 4)
            .attr('opacity', 0.7)
            .attr('stroke', 'none');
        
        hideTooltip(this.tooltip);
    }

    updateChart() {
        // Update scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(this.filteredData, d => d.date))
            .range([0, width]);
        
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(this.filteredData, d => Math.max(d.totalViews, d.totalLikes, d.totalDislikes))])
            .range([height, 0]);
        
        // Update lines
        const viewsLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.totalViews))
            .curve(d3.curveMonotoneX);
        
        const likesLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.totalLikes))
            .curve(d3.curveMonotoneX);
        
        const dislikesLine = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.totalDislikes))
            .curve(d3.curveMonotoneX);
        
        // Update lines with transition
        this.svg.select('.views-line')
            .transition()
            .duration(500)
            .attr('d', viewsLine);
        
        this.svg.select('.likes-line')
            .transition()
            .duration(500)
            .attr('d', likesLine);
        
        this.svg.select('.dislikes-line')
            .transition()
            .duration(500)
            .attr('d', dislikesLine);
        
        // Update points
        this.svg.selectAll('.views-point')
            .data(this.filteredData)
            .transition()
            .duration(500)
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.totalViews));
        
        this.svg.selectAll('.likes-point')
            .data(this.filteredData)
            .transition()
            .duration(500)
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.totalLikes));
        
        this.svg.selectAll('.dislikes-point')
            .data(this.filteredData)
            .transition()
            .duration(500)
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.totalDislikes));
        
        // Update axes
        this.svg.select('.axis').selectAll('g').remove();
        this.svg.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));
        
        this.svg.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale).tickFormat(d => formatNumber(d)));
    }

    createLegend(colorScale) {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.svg.attr('width') - 100}, 0)`);
        
        const legendItems = legend.selectAll('.legend-item')
            .data(['Views', 'Likes', 'Dislikes'])
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`)
            .style('cursor', 'pointer');
        
        legendItems.append('line')
            .attr('x1', 0)
            .attr('x2', 20)
            .attr('y1', 0)
            .attr('y2', 0)
            .attr('stroke', d => colorScale(d))
            .attr('stroke-width', 3);
        
        legendItems.append('text')
            .attr('x', 25)
            .attr('y', 4)
            .attr('font-size', '12px')
            .text(d => d);
        
        // Add legend interactions
        legendItems.on('click', (event, metric) => {
            this.toggleLine(metric);
        });
    }

    toggleLine(metric) {
        const lineClass = `${metric.toLowerCase()}-line`;
        const currentOpacity = this.svg.select(`.${lineClass}`).style('opacity');
        
        this.svg.select(`.${lineClass}`)
            .transition()
            .duration(300)
            .style('opacity', currentOpacity === '0.8' ? '0.2' : '0.8');
        
        this.showToggleMessage(metric, currentOpacity === '0.8' ? 'hidden' : 'shown');
    }

    showToggleMessage(metric, action) {
        d3.select('.toggle-message').remove();
        
        const message = d3.select('#chart-container')
            .append('div')
            .attr('class', 'toggle-message')
            .style('position', 'absolute')
            .style('top', '20px')
            .style('left', '20px')
            .style('background', action === 'hidden' ? '#e74c3c' : '#00b894')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .text(`${metric} line ${action}`);
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
            .text('• Scroll to zoom')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Drag to pan')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Drag brush to select')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Click legend to toggle');
    }

    addStatistics() {
        const totalViews = d3.sum(this.filteredData, d => d.totalViews);
        const totalLikes = d3.sum(this.filteredData, d => d.totalLikes);
        const totalDislikes = d3.sum(this.filteredData, d => d.totalDislikes);
        const avgEngagement = ((totalLikes + totalDislikes) / totalViews * 100).toFixed(2);
        
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
            .text(`Total Views: ${formatNumber(totalViews)}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Total Likes: ${formatNumber(totalLikes)}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Total Dislikes: ${formatNumber(totalDislikes)}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Avg Engagement: ${avgEngagement}%`);
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        d3.select('.controls').remove();
        d3.select('.statistics').remove();
        d3.select('.toggle-message').remove();
    }
}