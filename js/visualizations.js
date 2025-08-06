// D3.js Visualizations Module
class Visualizations {
    constructor() {
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        this.tooltip = this.createTooltip();
    }

    // Create reusable tooltip
    createTooltip() {
        return d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }

    // Clear any existing visualization
    clearVisualization(container) {
        d3.select(container).selectAll('*').remove();
    }

    // 1. Bar Chart - Average Views by Country
    createBarChart(data, container) {
        this.clearVisualization(container);
        
        const margin = { top: 20, right: 30, bottom: 40, left: 80 };
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Prepare data
        const countries = Object.keys(data);
        const maxViews = d3.max(countries, d => data[d].avgViews);

        // Scales
        const xScale = d3.scaleLinear()
            .domain([0, maxViews])
            .range([0, width]);

        const yScale = d3.scaleBand()
            .domain(countries)
            .range([0, height])
            .padding(0.1);

        // Axes
        g.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format('.2s')));

        g.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale));

        // Bars
        g.selectAll('.bar')
            .data(countries)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', 0)
            .attr('y', d => yScale(d))
            .attr('width', 0)
            .attr('height', yScale.bandwidth())
            .attr('fill', (d, i) => this.colorScale(i))
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d}</strong><br/>
                    Avg Views: ${d3.format('.2s')(data[d].avgViews)}<br/>
                    Total Videos: ${data[d].videoCount}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            })
            .transition()
            .duration(1000)
            .attr('width', d => xScale(data[d].avgViews));

        // Labels
        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Country');

        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom})`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Average Views');
    }

    // 2. Pie Chart - Category Distribution
    createPieChart(data, container, selectedCountry = null) {
        this.clearVisualization(container);
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const radius = Math.min(width, height) / 2 - 30;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${width/2},${height/2})`);

        // Add title if country is selected
        if (selectedCountry && selectedCountry !== 'all') {
            const countryNames = {
                'CA': 'Canada', 'DE': 'Germany', 'FR': 'France', 'GB': 'Great Britain',
                'IN': 'India', 'JP': 'Japan', 'KR': 'South Korea', 'MX': 'Mexico',
                'RU': 'Russia', 'US': 'United States'
            };
            const countryName = countryNames[selectedCountry] || selectedCountry;
            
            svg.append('text')
                .attr('x', width / 2)
                .attr('y', 20)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', '#2c3e50')
                .text(`Category Distribution - ${countryName}`);
        }

        // Prepare data - all categories
        const sortedData = Object.entries(data)
            .sort((a, b) => b[1] - a[1]);

        const pie = d3.pie()
            .value(d => d[1])
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const arcs = g.selectAll('.arc')
            .data(pie(sortedData))
            .enter().append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('class', 'pie-slice')
            .attr('d', arc)
            .attr('fill', (d, i) => this.colorScale(i))
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.data[0]}</strong><br/>
                    Videos: ${d.data[1]}<br/>
                    Percentage: ${((d.endAngle - d.startAngle) / (2 * Math.PI) * 100).toFixed(1)}%
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Add labels
        arcs.append('text')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .attr('dy', '.35em')
            .style('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', 'white')
            .style('font-weight', 'bold')
            .text(d => {
                const percentage = (d.endAngle - d.startAngle) / (2 * Math.PI) * 100;
                return percentage > 3 ? `${percentage.toFixed(0)}%` : '';
            });

        // Legend - 2 columns for better layout with all categories
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(20, 20)`);

        const itemsPerColumn = Math.ceil(sortedData.length / 2);
        const legendItems = legend.selectAll('.legend-item')
            .data(sortedData)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => {
                const column = Math.floor(i / itemsPerColumn);
                const row = i % itemsPerColumn;
                return `translate(${column * 200}, ${row * 18})`;
            });

        legendItems.append('rect')
            .attr('width', 12)
            .attr('height', 12)
            .attr('fill', (d, i) => this.colorScale(i));

        legendItems.append('text')
            .attr('x', 18)
            .attr('y', 9)
            .style('font-size', '11px')
            .text(d => d[0].length > 20 ? d[0].substring(0, 20) + '...' : d[0]);
    }

    // 2b. Donut Chart - Engagement Metrics
    createDonutChart(data, container) {
        this.clearVisualization(container);
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const radius = Math.min(width, height) / 2 - 20;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        const pie = d3.pie()
            .value(d => d[1])
            .sort(null);

        const arc = d3.arc()
            .innerRadius(radius * 0.5)
            .outerRadius(radius);

        const arcs = g.selectAll('.arc')
            .data(pie(Object.entries(data)))
            .enter().append('g')
            .attr('class', 'arc');

        arcs.append('path')
            .attr('class', 'pie-slice')
            .attr('d', arc)
            .attr('fill', (d, i) => this.colorScale(i))
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.data[0]}</strong><br/>
                    ${d3.format('.2s')(d.data[1])}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(20, 20)`);

        legend.selectAll('.legend-item')
            .data(Object.entries(data))
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .each((d, i, nodes) => {
                const gNode = d3.select(nodes[i]);
                gNode.append('rect')
                    .attr('width', 15)
                    .attr('height', 15)
                    .attr('fill', this.colorScale(i));
                gNode.append('text')
                    .attr('x', 20)
                    .attr('y', 12)
                    .text(d[0]);
            });
    }

    // 3. Scatter Plot - Views vs Likes
    createScatterPlot(data, container, selectedCountry = null) {
        this.clearVisualization(container);
        
        const margin = { top: 40, right: 40, bottom: 60, left: 80 };
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add title if country is selected
        if (selectedCountry && selectedCountry !== 'all') {
            const countryNames = {
                'CA': 'Canada', 'DE': 'Germany', 'FR': 'France', 'GB': 'Great Britain',
                'IN': 'India', 'JP': 'Japan', 'KR': 'South Korea', 'MX': 'Mexico',
                'RU': 'Russia', 'US': 'United States'
            };
            const countryName = countryNames[selectedCountry] || selectedCountry;
            
            svg.append('text')
                .attr('x', (width + margin.left + margin.right) / 2)
                .attr('y', 15)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', '#2c3e50')
                .text(`Views vs Likes Correlation - ${countryName}`);
        }

        // Filter out extreme outliers for better visualization
        const filteredData = data.filter(d => d.views > 0 && d.likes > 0 && d.views < 1e8 && d.likes < 1e7);
        
        // Use linear scales with better formatting
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.views)])
            .range([0, width])
            .nice();

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => d.likes)])
            .range([height, 0])
            .nice();

        const colorByCountry = d3.scaleOrdinal(d3.schemeCategory10)
            .domain([...new Set(filteredData.map(d => d.country))]);

        // Add grid lines
        g.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale)
                .tickSize(-height)
                .tickFormat('')
            );

        g.append('g')
            .attr('class', 'grid')
            .call(d3.axisLeft(yScale)
                .tickSize(-width)
                .tickFormat('')
            );

        // Axes with better formatting
        g.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d => {
                if (d >= 1e6) return (d / 1e6).toFixed(1) + 'M';
                if (d >= 1e3) return (d / 1e3).toFixed(1) + 'K';
                return d;
            }));

        g.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale).tickFormat(d => {
                if (d >= 1e6) return (d / 1e6).toFixed(1) + 'M';
                if (d >= 1e3) return (d / 1e3).toFixed(1) + 'K';
                return d;
            }));

        // Add trend line
        const trendLine = d3.line()
            .x(d => xScale(d.views))
            .y(d => yScale(d.likes))
            .curve(d3.curveLinear);

        // Calculate trend line points
        const sortedData = filteredData.sort((a, b) => a.views - b.views);
        const trendPoints = sortedData.map(d => ({ views: d.views, likes: d.likes }));

        g.append('path')
            .datum(trendPoints)
            .attr('class', 'trend-line')
            .attr('fill', 'none')
            .attr('stroke', '#e74c3c')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5')
            .attr('d', trendLine);

        // Points with better styling
        g.selectAll('.dot')
            .data(filteredData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.views))
            .attr('cy', d => yScale(d.likes))
            .attr('r', 4)
            .attr('fill', d => colorByCountry(d.country))
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .attr('opacity', 0.7)
            .on('mouseover', (event, d) => {
                d3.select(event.target)
                    .attr('r', 6)
                    .attr('opacity', 1);
                
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.title.substring(0, 40)}...</strong><br/>
                    Views: ${d3.format(',')(d.views)}<br/>
                    Likes: ${d3.format(',')(d.likes)}<br/>
                    Country: ${d.country}<br/>
                    Category: ${d.category}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', (event) => {
                d3.select(event.target)
                    .attr('r', 4)
                    .attr('opacity', 0.7);
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Add correlation coefficient
        const correlation = this.calculateCorrelation(filteredData.map(d => d.views), filteredData.map(d => d.likes));
        
        g.append('text')
            .attr('x', width - 10)
            .attr('y', 30)
            .attr('text-anchor', 'end')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text(`Correlation: ${correlation.toFixed(3)}`);

        // Labels
        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .text('Views');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .style('font-size', '14px')
            .text('Likes');

        // Legend
        const legend = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${width + margin.left + 10}, 20)`);

        const countries = [...new Set(filteredData.map(d => d.country))];
        legend.selectAll('.legend-item')
            .data(countries)
            .enter().append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .each((d, i, nodes) => {
                const gNode = d3.select(nodes[i]);
                gNode.append('circle')
                    .attr('r', 4)
                    .attr('fill', colorByCountry(d));
                gNode.append('text')
                    .attr('x', 10)
                    .attr('y', 4)
                    .style('font-size', '12px')
                    .text(d);
            });
    }

    // Helper method to calculate correlation coefficient
    calculateCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumY2 = y.reduce((a, b) => a + b * b, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    // 4. Timeline - Trending Videos Over Time
    createTimeline(data, container, selectedCountry = null) {
        this.clearVisualization(container);
        
        const margin = { top: 20, right: 30, bottom: 60, left: 70 };
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add title if country is selected
        if (selectedCountry && selectedCountry !== 'all') {
            const countryNames = {
                'CA': 'Canada', 'DE': 'Germany', 'FR': 'France', 'GB': 'Great Britain',
                'IN': 'India', 'JP': 'Japan', 'KR': 'South Korea', 'MX': 'Mexico',
                'RU': 'Russia', 'US': 'United States'
            };
            const countryName = countryNames[selectedCountry] || selectedCountry;
            
            svg.append('text')
                .attr('x', (width + margin.left + margin.right) / 2)
                .attr('y', 15)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', '#2c3e50')
                .text(`Trending Videos Timeline - ${countryName}`);
        }

        // Scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.date))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.count)])
            .range([height, 0]);

        // Line generator
        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.count))
            .curve(d3.curveMonotoneX);

        // Axes
        g.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%m/%d')));

        g.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale));

        // Line
        g.append('path')
            .datum(data)
            .attr('fill', 'none')
            .attr('stroke', '#3498db')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Points
        g.selectAll('.dot')
            .data(data)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.count))
            .attr('r', 4)
            .attr('fill', '#e74c3c')
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>Date: ${d.date.toLocaleDateString()}</strong><br/>
                    Trending Videos: ${d.count}<br/>
                    Total Views: ${d3.format('.2s')(d.totalViews)}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Labels
        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Date');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Number of Trending Videos');
    }

    // 5. Heatmap - Country Activity
    createHeatmap(data, container) {
        this.clearVisualization(container);
        
        console.log('Heatmap data received:', data);
        
        // Validate data
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 5px;">
                    <div style="text-align: center; color: #6c757d;">
                        <h4>No Data Available</h4>
                        <p>Please wait for data to load or try refreshing the page.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const heatmapData = data.data;
        const categories = data.categories || [];
        const countries = data.countries || [];
        
        if (categories.length === 0 || countries.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 5px;">
                    <div style="text-align: center; color: #6c757d;">
                        <h4>No Categories or Countries Found</h4>
                        <p>Please check your data files.</p>
                    </div>
                </div>
            `;
            return;
        }
        
        const margin = { top: 50, right: 30, bottom: 50, left: 120 };
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Add title
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text(`Category Distribution by Country (${categories.length} Categories)`);

        const maxValue = d3.max(heatmapData, d => d.value) || 0;
        
        // Scales
        const xScale = d3.scaleBand()
            .domain(countries)
            .range([0, width])
            .padding(0.1);

        const yScale = d3.scaleBand()
            .domain(categories)
            .range([0, height])
            .padding(0.1);

        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, maxValue]);

        // Rectangles
        g.selectAll('.cell')
            .data(heatmapData)
            .enter().append('rect')
            .attr('class', 'cell')
            .attr('x', d => xScale(d.country))
            .attr('y', d => yScale(d.category))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.value))
            .attr('stroke', 'white')
            .attr('stroke-width', 1)
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.country} - ${d.category}</strong><br/>
                    Percentage: ${d.value.toFixed(1)}%<br/>
                    Videos: ${d.count} / ${d.totalVideos}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Axes
        g.append('g')
            .attr('class', 'axis')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale));

        g.append('g')
            .attr('class', 'axis')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '11px')
            .style('text-anchor', 'end')
            .attr('dx', '-8px')
            .attr('dy', '0.35em');

        // Labels
        g.append('text')
            .attr('transform', `translate(${width / 2}, ${height + margin.bottom - 10})`)
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Country');

        g.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - margin.left)
            .attr('x', 0 - (height / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Category');

        // Add color legend
        const legendWidth = 200;
        const legendHeight = 20;
        const legendX = width + margin.left + 10;
        const legendY = 50;

        const legendSvg = svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        // Create gradient for legend
        const defs = legendSvg.append('defs');
        const gradient = defs.append('linearGradient')
            .attr('id', 'heatmap-gradient')
            .attr('x1', '0%')
            .attr('y1', '0%')
            .attr('x2', '100%')
            .attr('y2', '0%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', d3.interpolateBlues(0));

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', d3.interpolateBlues(1));

        // Legend rectangle
        legendSvg.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#heatmap-gradient)')
            .attr('stroke', '#ccc');

        // Legend labels
        legendSvg.append('text')
            .attr('x', 0)
            .attr('y', legendHeight + 15)
            .style('font-size', '12px')
            .text('0%');

        legendSvg.append('text')
            .attr('x', legendWidth)
            .attr('y', legendHeight + 15)
            .attr('text-anchor', 'end')
            .style('font-size', '12px')
            .text(`${maxValue.toFixed(1)}%`);

        legendSvg.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', legendHeight + 15)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text('Category Percentage');
    }

    // 6. Treemap - Top Channels
    createTreemap(data, container) {
        this.clearVisualization(container);
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Validate data
        if (!data || !Array.isArray(data) || data.length === 0) {
            svg.append('text')
                .attr('text-anchor', 'middle')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .style('font-size', '16px')
                .text('No data available for treemap');
            return;
        }

        // Filter out invalid data
        const validData = data.filter(d => d && d.name && d.totalViews > 0);
        
        if (validData.length === 0) {
            svg.append('text')
                .attr('text-anchor', 'middle')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .style('font-size', '16px')
                .text('No valid data for treemap');
            return;
        }

        // Prepare data for treemap
        const root = d3.hierarchy({ children: validData })
            .sum(d => d.totalViews || 0)
            .sort((a, b) => b.value - a.value);

        const treemap = d3.treemap()
            .size([width, height])
            .padding(2);

        treemap(root);

        const leaves = svg.selectAll('.leaf')
            .data(root.leaves())
            .enter().append('g')
            .attr('class', 'leaf')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        leaves.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', (d, i) => this.colorScale(i))
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.data.name}</strong><br/>
                    Total Views: ${d3.format('.2s')(d.data.totalViews)}<br/>
                    Videos: ${d.data.videoCount}<br/>
                    Countries: ${d.data.countries.join(', ')}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        leaves.append('text')
            .attr('x', 4)
            .attr('y', 14)
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .text(d => {
                const rectWidth = d.x1 - d.x0;
                const name = d.data.name || 'Unknown';
                if (rectWidth > 60 && name) {
                    return name.length > 12 ? name.substring(0, 12) + '...' : name;
                }
                return '';
            });
    }

    // 7. Sankey Diagram - Category Flow Analysis
    createSankeyDiagram(data, container) {
        this.clearVisualization(container);
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Create Sankey layout
        const sankey = d3.sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .extent([[1, 1], [width - 1, height - 5]]);

        // Process data for Sankey
        const sankeyData = {
            nodes: data.nodes.map(d => ({ id: d.id, name: d.name, type: d.type })),
            links: data.links.map(d => ({ source: d.source, target: d.target, value: d.value }))
        };

        // Create a map of node IDs to node objects for proper linking
        const nodeMap = new Map();
        sankeyData.nodes.forEach(node => {
            nodeMap.set(node.id, node);
        });

        // Update links to reference actual node objects instead of strings
        sankeyData.links.forEach(link => {
            const sourceNode = nodeMap.get(link.source);
            const targetNode = nodeMap.get(link.target);
            
            if (sourceNode && targetNode) {
                link.source = sourceNode;
                link.target = targetNode;
            } else {
                console.warn(`Skipping link: source or target node not found`, link);
            }
        });

        // Filter out invalid links
        sankeyData.links = sankeyData.links.filter(link => 
            link.source && link.target && typeof link.source === 'object' && typeof link.target === 'object'
        );

        if (sankeyData.links.length === 0) {
            svg.append('text')
                .attr('text-anchor', 'middle')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .style('font-size', '16px')
                .text('No valid links found for Sankey diagram');
            return;
        }

        const { nodes, links } = sankey(sankeyData);

        // Create gradient definitions
        const defs = svg.append('defs');
        
        // Create gradients for links
        links.forEach((link, i) => {
            const gradient = defs.append('linearGradient')
                .attr('id', `link-${i}`)
                .attr('gradientUnits', 'userSpaceOnUse')
                .attr('x1', link.source.x1)
                .attr('x2', link.target.x0);

            gradient.append('stop')
                .attr('offset', '0%')
                .attr('stop-color', this.colorScale(link.source.index))
                .attr('stop-opacity', 0.6);

            gradient.append('stop')
                .attr('offset', '100%')
                .attr('stop-color', this.colorScale(link.target.index))
                .attr('stop-opacity', 0.6);
        });

        // Draw links
        svg.append('g')
            .selectAll('path')
            .data(links)
            .enter().append('path')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', (d, i) => `url(#link-${i})`)
            .attr('stroke-width', d => Math.max(1, d.width))
            .attr('fill', 'none')
            .attr('opacity', 0.7)
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.source.name} → ${d.target.name}</strong><br/>
                    Videos: ${d.value.toLocaleString()}<br/>
                    Percentage: ${((d.value / d.source.value1) * 100).toFixed(1)}% of ${d.source.name}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Draw nodes
        const node = svg.append('g')
            .selectAll('g')
            .data(nodes)
            .enter().append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);

        node.append('rect')
            .attr('height', d => d.y1 - d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', (d, i) => this.colorScale(i))
            .attr('stroke', '#000')
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.9);
                this.tooltip.html(`
                    <strong>${d.name}</strong><br/>
                    Type: ${d.type === 'country' ? 'Country' : 'Category'}<br/>
                    Total Videos: ${d.value1.toLocaleString()}<br/>
                    ${d.type === 'country' ? 'Distributed across categories' : 'Videos from all countries'}
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Add node labels
        node.append('text')
            .attr('x', d => d.x0 < width / 2 ? 6 : -6)
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text(d => d.name);

        // Add title and subtitle
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('Video Category Distribution by Country');
            
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 40)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#7f8c8d')
            .text('Shows how videos from each country are distributed across different categories');
    }

    // 8. Radar Chart - Country Performance Comparison
    createRadarChart(data, container) {
        this.clearVisualization(container);
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const radius = Math.min(width, height) / 2 - 100;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('Country Performance Comparison');

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);

        // Use only the most important metrics for clarity
        const metrics = ['avgViews', 'avgLikes', 'engagementRate'];
        const metricLabels = {
            'avgViews': 'Average Views',
            'avgLikes': 'Average Likes', 
            'engagementRate': 'Engagement Rate'
        };

        if (metrics.length === 0) {
            g.append('text')
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text('No data available for radar chart');
            return;
        }

        // Create angle scale
        const angleScale = d3.scalePoint()
            .domain(metrics)
            .range([0, 2 * Math.PI]);

        // Create radius scale for each metric
        const radiusScales = {};
        metrics.forEach(metric => {
            const values = data.map(d => d[metric]).filter(v => v !== undefined);
            if (values.length > 0) {
                radiusScales[metric] = d3.scaleLinear()
                    .domain([0, d3.max(values)])
                    .range([0, radius]);
            }
        });

        // Draw background circles
        const levels = 5;
        for (let i = 1; i <= levels; i++) {
            g.append('circle')
                .attr('r', (radius / levels) * i)
                .attr('fill', 'none')
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1);
        }

        // Draw axis lines
        metrics.forEach(metric => {
            const angle = angleScale(metric) - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            g.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', x)
                .attr('y2', y)
                .attr('stroke', '#ddd')
                .attr('stroke-width', 1);

            // Add metric labels
            const labelRadius = radius + 20;
            const labelX = Math.cos(angle) * labelRadius;
            const labelY = Math.sin(angle) * labelRadius;
            
            g.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .text(metricLabels[metric] || metric);
        });

        // Limit to top 5 countries to reduce clutter
        const topCountries = data.slice(0, 5);
        
        // Draw data polygons
        topCountries.forEach((countryData, i) => {
            const points = metrics.map(metric => {
                const angle = angleScale(metric) - Math.PI / 2;
                const value = countryData[metric] || 0;
                const r = radiusScales[metric] ? radiusScales[metric](value) : 0;
                return [Math.cos(angle) * r, Math.sin(angle) * r];
            });

            // Create polygon
            const polygon = g.append('polygon')
                .attr('points', points.map(p => p.join(',')).join(' '))
                .attr('fill', this.colorScale(i))
                .attr('fill-opacity', 0.3)
                .attr('stroke', this.colorScale(i))
                .attr('stroke-width', 2)
                .on('mouseover', (event, d) => {
                    this.tooltip.transition().duration(200).style('opacity', 0.9);
                    let tooltipContent = `<strong>${countryData.country}</strong><br/>`;
                    metrics.forEach(metric => {
                        const value = countryData[metric] || 0;
                        let formattedValue;
                        if (metric === 'avgViews') {
                            formattedValue = d3.format('.0s')(value) + ' views';
                        } else if (metric === 'avgLikes') {
                            formattedValue = d3.format('.0s')(value) + ' likes';
                        } else if (metric === 'engagementRate') {
                            formattedValue = d3.format('.1f')(value) + '%';
                        } else {
                            formattedValue = d3.format('.2f')(value);
                        }
                        tooltipContent += `${metricLabels[metric]}: ${formattedValue}<br/>`;
                    });
                    this.tooltip.html(tooltipContent)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', () => {
                    this.tooltip.transition().duration(500).style('opacity', 0);
                });

            // Add country label
            const centerX = points.reduce((sum, p) => sum + p[0], 0) / points.length;
            const centerY = points.reduce((sum, p) => sum + p[1], 0) / points.length;
            
            g.append('text')
                .attr('x', centerX)
                .attr('y', centerY)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', this.colorScale(i))
                .text(countryData.country);
        });

        // Add legend
        const legend = svg.append('g')
            .attr('transform', `translate(20, 60)`);

        legend.append('text')
            .attr('x', 0)
            .attr('y', -10)
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('Countries:');

        topCountries.forEach((countryData, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${i * 25})`);

            legendItem.append('rect')
                .attr('width', 15)
                .attr('height', 15)
                .attr('fill', this.colorScale(i));

            legendItem.append('text')
                .attr('x', 20)
                .attr('y', 12)
                .style('font-size', '12px')
                .text(countryData.country);
        });
    }

}

// Create global instance
window.visualizations = new Visualizations();