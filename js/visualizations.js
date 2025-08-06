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
        
        // Check if d3.sankey is available
        if (typeof d3.sankey !== 'function') {
            const svg = d3.select(container)
                .append('svg')
                .attr('width', 400)
                .attr('height', 300);
            
            svg.append('text')
                .attr('x', 200)
                .attr('y', 150)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .style('fill', 'red')
                .text('d3-sankey library not loaded. Please check the script import.');
            return;
        }
        
        // Validate input data
        if (!data || !data.nodes || !data.links || data.nodes.length === 0) {
            const svg = d3.select(container)
                .append('svg')
                .attr('width', 400)
                .attr('height', 300);
            
            svg.append('text')
                .attr('x', 200)
                .attr('y', 150)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text('No data available for Sankey diagram');
            return;
        }
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const margin = { top: 60, right: 150, bottom: 40, left: 150 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

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
            .text('Category Flow Analysis');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#7f8c8d')
            .text('Flow of videos from countries to categories (hover for details)');

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create Sankey layout with better spacing
        const sankey = d3.sankey()
            .nodeWidth(20)
            .nodePadding(15)
            .extent([[0, 0], [chartWidth, chartHeight]]);

        // Process data for Sankey - create deep copies to avoid mutation
        const sankeyData = {
            nodes: data.nodes.map(d => ({ 
                id: d.id, 
                name: d.name, 
                type: d.type 
            })),
            links: data.links.map(d => ({ 
                source: d.source, 
                target: d.target, 
                value: d.value 
            }))
        };

        // Create a map of node IDs to node objects for proper linking
        const nodeMap = new Map();
        sankeyData.nodes.forEach((node, index) => {
            node.index = index;
            nodeMap.set(node.id, node);
        });

        // Update links to reference actual node objects instead of strings
        const validLinks = [];
        sankeyData.links.forEach(link => {
            const sourceNode = nodeMap.get(link.source);
            const targetNode = nodeMap.get(link.target);
            
            if (sourceNode && targetNode && link.value > 0) {
                validLinks.push({
                    source: sourceNode,
                    target: targetNode,
                    value: link.value
                });
            } else {
                console.warn(`Skipping invalid link:`, link);
            }
        });

        sankeyData.links = validLinks;

        if (sankeyData.links.length === 0) {
            svg.append('text')
                .attr('text-anchor', 'middle')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .style('font-size', '16px')
                .text('No valid links found for Sankey diagram');
            return;
        }

        try {
            const { nodes, links } = sankey(sankeyData);

            // Create gradient definitions
            const defs = svg.append('defs');
            
            // Create gradients for links
            links.forEach((link, i) => {
                const gradient = defs.append('linearGradient')
                    .attr('id', `link-gradient-${i}`)
                    .attr('gradientUnits', 'userSpaceOnUse')
                    .attr('x1', link.source.x1)
                    .attr('x2', link.target.x0);

                gradient.append('stop')
                    .attr('offset', '0%')
                    .attr('stop-color', this.colorScale(link.source.index || 0))
                    .attr('stop-opacity', 0.7);

                gradient.append('stop')
                    .attr('offset', '100%')
                    .attr('stop-color', this.colorScale(link.target.index || 0))
                    .attr('stop-opacity', 0.7);
            });

            // Draw links with better interaction
            const linkGroup = chartGroup.append('g').attr('class', 'links');
            
            linkGroup.selectAll('path')
                .data(links)
                .enter().append('path')
                .attr('d', d3.sankeyLinkHorizontal())
                .attr('stroke', (d, i) => `url(#link-gradient-${i})`)
                .attr('stroke-width', d => Math.max(2, d.width))
                .attr('fill', 'none')
                .attr('opacity', 0.6)
                .style('cursor', 'pointer')
                .on('mouseover', (event, d) => {
                    // Highlight the link
                    d3.select(event.currentTarget).attr('opacity', 0.9);
                    
                    this.tooltip.transition().duration(200).style('opacity', 0.9);
                    const percentage = d.source.value ? ((d.value / d.source.value) * 100).toFixed(1) : '0.0';
                    const totalPercentage = links.reduce((sum, link) => sum + link.value, 0);
                    const globalPercentage = ((d.value / totalPercentage) * 100).toFixed(1);
                    
                    this.tooltip.html(`
                        <div style="background: rgba(0,0,0,0.9); color: white; padding: 10px; border-radius: 5px; font-size: 12px;">
                            <strong style="color: #4CAF50;">${d.source.name} → ${d.target.name}</strong><br/>
                            <span style="color: #FFF;">Videos: <strong>${d.value.toLocaleString()}</strong></span><br/>
                            <span style="color: #FFD700;">% of ${d.source.name}: <strong>${percentage}%</strong></span><br/>
                            <span style="color: #87CEEB;">% of Total Flow: <strong>${globalPercentage}%</strong></span>
                        </div>
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event, d) => {
                    // Reset link opacity
                    d3.select(event.currentTarget).attr('opacity', 0.6);
                    this.tooltip.transition().duration(500).style('opacity', 0);
                });

            // Draw nodes with better styling
            const nodeGroup = chartGroup.append('g').attr('class', 'nodes');
            
            const node = nodeGroup.selectAll('g')
                .data(nodes)
                .enter().append('g')
                .attr('class', 'node')
                .attr('transform', d => `translate(${d.x0},${d.y0})`);

            // Node rectangles with better styling
            node.append('rect')
                .attr('height', d => Math.max(1, d.y1 - d.y0))
                .attr('width', sankey.nodeWidth())
                .attr('fill', d => this.colorScale(d.index || 0))
                .attr('stroke', '#333')
                .attr('stroke-width', 1)
                .attr('rx', 3)
                .style('cursor', 'pointer')
                .on('mouseover', (event, d) => {
                    // Highlight connected links
                    linkGroup.selectAll('path')
                        .attr('opacity', link => 
                            (link.source === d || link.target === d) ? 0.9 : 0.2
                        );
                    
                    this.tooltip.transition().duration(200).style('opacity', 0.9);
                    const nodeType = d.type === 'country' ? 'Country' : 'Category';
                    this.tooltip.html(`
                        <div style="background: rgba(0,0,0,0.9); color: white; padding: 10px; border-radius: 5px; font-size: 12px;">
                            <strong style="color: #4CAF50;">${d.name}</strong><br/>
                            <span style="color: #FFF;">Type: <strong>${nodeType}</strong></span><br/>
                            <span style="color: #FFD700;">Total Videos: <strong>${d.value ? d.value.toLocaleString() : 'N/A'}</strong></span>
                        </div>
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', (event, d) => {
                    // Reset all links opacity
                    linkGroup.selectAll('path').attr('opacity', 0.6);
                    this.tooltip.transition().duration(500).style('opacity', 0);
                });

            // Add node labels with better positioning to avoid overlapping
            node.append('text')
                .attr('x', d => d.x0 < chartWidth / 2 ? sankey.nodeWidth() + 8 : -8)
                .attr('y', d => (d.y1 - d.y0) / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', d => d.x0 < chartWidth / 2 ? 'start' : 'end')
                .style('font-size', '11px')
                .style('font-weight', 'bold')
                .style('fill', '#2c3e50')
                .style('text-shadow', '1px 1px 2px rgba(255,255,255,0.8)')
                .text(d => {
                    // Truncate long names to prevent overlapping
                    const maxLength = 15;
                    return d.name.length > maxLength ? d.name.substring(0, maxLength) + '...' : d.name;
                });

            // Add value labels on nodes
            node.append('text')
                .attr('x', sankey.nodeWidth() / 2)
                .attr('y', d => (d.y1 - d.y0) / 2)
                .attr('dy', '0.35em')
                .attr('text-anchor', 'middle')
                .style('font-size', '9px')
                .style('font-weight', 'bold')
                .style('fill', 'white')
                .style('pointer-events', 'none')
                .text(d => d.value && d.value > 0 ? d3.format('.0s')(d.value) : '')
                .filter(d => (d.y1 - d.y0) > 20); // Only show if node is tall enough

            // Add legend for node types
            const legend = svg.append('g')
                .attr('transform', `translate(${width - 140}, 80)`);

            legend.append('text')
                .attr('x', 0)
                .attr('y', 0)
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('fill', '#2c3e50')
                .text('Legend:');

            const legendItems = [
                { type: 'Countries', side: 'left' },
                { type: 'Categories', side: 'right' }
            ];

            legendItems.forEach((item, i) => {
                const legendItem = legend.append('g')
                    .attr('transform', `translate(0, ${(i + 1) * 25})`);

                legendItem.append('rect')
                    .attr('width', 15)
                    .attr('height', 15)
                    .attr('fill', '#999')
                    .attr('rx', 2);

                legendItem.append('text')
                    .attr('x', 20)
                    .attr('y', 12)
                    .style('font-size', '12px')
                    .style('fill', '#2c3e50')
                    .text(`${item.type} (${item.side})`);
            });

        } catch (error) {
            console.error('Error creating Sankey diagram:', error);
            svg.append('text')
                .attr('text-anchor', 'middle')
                .attr('x', width / 2)
                .attr('y', height / 2)
                .style('font-size', '16px')
                .style('fill', 'red')
                .text('Error creating Sankey diagram. Check console for details.');
        }
    }

    // 8. Channel Success Timeline - Track Channel Growth Over Time
    createChannelSuccessTimeline(data, container) {
        this.clearVisualization(container);
        
        if (!data || data.length === 0) {
            const svg = d3.select(container)
                .append('svg')
                .attr('width', 400)
                .attr('height', 300);
            
            svg.append('text')
                .attr('x', 200)
                .attr('y', 150)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text('No channel timeline data available');
            return;
        }
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const margin = { top: 80, right: 200, bottom: 80, left: 80 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('📈 Channel Success Timeline');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#7f8c8d')
            .text('Track how channels grow and achieve viral success over time');

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Process data to create channel timelines
        const channelData = new Map();
        
        data.forEach(video => {
            const channelName = video.channel_title;
            const publishDate = new Date(video.publish_time);
            
            if (!channelData.has(channelName)) {
                channelData.set(channelName, []);
            }
            
            channelData.get(channelName).push({
                date: publishDate,
                views: video.views || 0,
                likes: video.likes || 0,
                comments: video.comment_count || 0,
                title: video.title,
                category: video.category_name,
                country: video.country
            });
        });

        // Sort videos by date for each channel and calculate cumulative metrics
        const processedChannels = [];
        channelData.forEach((videos, channelName) => {
            videos.sort((a, b) => a.date - b.date);
            
            let cumulativeViews = 0;
            let cumulativeVideos = 0;
            let totalLikes = 0;
            
            const timeline = videos.map(video => {
                cumulativeViews += video.views;
                cumulativeVideos += 1;
                totalLikes += video.likes;
                
                return {
                    date: video.date,
                    cumulativeViews,
                    cumulativeVideos,
                    totalLikes,
                    avgViewsPerVideo: cumulativeViews / cumulativeVideos,
                    latestVideo: video
                };
            });
            
            // Only include channels with multiple videos for meaningful timelines
            if (timeline.length >= 2) {
                processedChannels.push({
                    name: channelName,
                    timeline,
                    totalViews: cumulativeViews,
                    totalVideos: cumulativeVideos,
                    category: videos[0].category,
                    country: videos[0].country
                });
            }
        });

        // Sort by total views and take top channels
        processedChannels.sort((a, b) => b.totalViews - a.totalViews);
        const topChannels = processedChannels.slice(0, 8); // Show top 8 channels

        if (topChannels.length === 0) {
            chartGroup.append('text')
                .attr('x', chartWidth / 2)
                .attr('y', chartHeight / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text('No multi-video channels found for timeline');
            return;
        }

        // Create scales
        const allDates = topChannels.flatMap(channel => channel.timeline.map(d => d.date));
        const xScale = d3.scaleTime()
            .domain(d3.extent(allDates))
            .range([0, chartWidth]);

        const maxViews = d3.max(topChannels, channel => d3.max(channel.timeline, d => d.cumulativeViews));
        const yScale = d3.scaleLinear()
            .domain([0, maxViews])
            .range([chartHeight, 0]);

        // Color scale for channels
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        // Add grid
        const xAxisGrid = d3.axisBottom(xScale)
            .tickSize(-chartHeight)
            .tickFormat('');

        const yAxisGrid = d3.axisLeft(yScale)
            .tickSize(-chartWidth)
            .tickFormat('');

        chartGroup.append('g')
            .attr('class', 'grid')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(xAxisGrid)
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        chartGroup.append('g')
            .attr('class', 'grid')
            .call(yAxisGrid)
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0.3);

        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.date))
            .y(d => yScale(d.cumulativeViews))
            .curve(d3.curveMonotoneX);

        // Add area generator for growth visualization
        const area = d3.area()
            .x(d => xScale(d.date))
            .y0(chartHeight)
            .y1(d => yScale(d.cumulativeViews))
            .curve(d3.curveMonotoneX);

        // Create channel groups
        const channelGroups = chartGroup.selectAll('.channel-group')
            .data(topChannels)
            .enter().append('g')
            .attr('class', 'channel-group');

        let selectedChannel = null;

        // Add area fills (initially hidden)
        channelGroups.append('path')
            .attr('class', 'area')
            .attr('d', d => area(d.timeline))
            .attr('fill', (d, i) => colorScale(i))
            .attr('opacity', 0)
            .style('pointer-events', 'none');

        // Add timeline lines
        channelGroups.append('path')
            .attr('class', 'timeline-line')
            .attr('d', d => line(d.timeline))
            .attr('stroke', (d, i) => colorScale(i))
            .attr('stroke-width', 3)
            .attr('fill', 'none')
            .attr('opacity', 0.7)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                // Highlight this line
                d3.select(this)
                    .attr('stroke-width', 5)
                    .attr('opacity', 1);
                
                // Show area fill
                d3.select(this.parentNode).select('.area')
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.1);
            })
            .on('mouseout', function(event, d) {
                if (selectedChannel !== d) {
                    d3.select(this)
                        .attr('stroke-width', 3)
                        .attr('opacity', 0.7);
                    
                    d3.select(this.parentNode).select('.area')
                        .transition()
                        .duration(200)
                        .attr('opacity', 0);
                }
            })
            .on('click', function(event, d) {
                // Toggle selection
                if (selectedChannel === d) {
                    selectedChannel = null;
                    // Reset all lines
                    chartGroup.selectAll('.timeline-line')
                        .attr('stroke-width', 3)
                        .attr('opacity', 0.7);
                    chartGroup.selectAll('.area')
                        .attr('opacity', 0);
                    chartGroup.selectAll('.milestone')
                        .attr('opacity', 0.6);
                } else {
                    selectedChannel = d;
                    // Dim all other lines
                    chartGroup.selectAll('.timeline-line')
                        .attr('opacity', 0.2)
                        .attr('stroke-width', 2);
                    // Highlight selected line
                    d3.select(this)
                        .attr('opacity', 1)
                        .attr('stroke-width', 5);
                    // Show area for selected
                    d3.select(this.parentNode).select('.area')
                        .attr('opacity', 0.15);
                    // Highlight milestones for selected channel
                    chartGroup.selectAll('.milestone')
                        .attr('opacity', milestone => milestone.channel === d.name ? 1 : 0.1);
                }
            });

        // Add milestone points (major video releases)
        const milestones = [];
        topChannels.forEach(channel => {
            channel.timeline.forEach(point => {
                // Consider it a milestone if it's a significant jump in views
                const prevPoint = channel.timeline[channel.timeline.indexOf(point) - 1];
                if (prevPoint) {
                    const viewsGrowth = point.cumulativeViews - prevPoint.cumulativeViews;
                    if (viewsGrowth > maxViews * 0.1) { // 10% of max views
                        milestones.push({
                            ...point,
                            channel: channel.name,
                            channelIndex: topChannels.indexOf(channel),
                            growth: viewsGrowth
                        });
                    }
                }
            });
        });

        chartGroup.selectAll('.milestone')
            .data(milestones)
            .enter().append('circle')
            .attr('class', 'milestone')
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.cumulativeViews))
            .attr('r', 6)
            .attr('fill', d => colorScale(d.channelIndex))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .attr('opacity', 0.6)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                this.tooltip.transition().duration(200).style('opacity', 0.95);
                this.tooltip.html(`
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 10px; font-size: 12px; max-width: 280px;">
                        <div style="display: flex; align-items: center; margin-bottom: 10px;">
                            <span style="font-size: 24px; margin-right: 8px;">🚀</span>
                            <strong style="font-size: 14px; color: #FFD700;">Growth Milestone</strong>
                        </div>
                        
                        <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 5px; margin-bottom: 8px;">
                            <strong style="color: #FFD700;">${d.channel}</strong><br/>
                            <span style="color: #87CEEB; font-size: 10px;">"${d.latestVideo.title.length > 35 ? d.latestVideo.title.substring(0, 35) + '...' : d.latestVideo.title}"</span>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
                            <div><strong>📅 Date:</strong> ${d.date.toLocaleDateString()}</div>
                            <div><strong>📊 Total Views:</strong> ${d3.format('.2s')(d.cumulativeViews)}</div>
                            <div><strong>🎬 Videos:</strong> ${d.cumulativeVideos}</div>
                            <div><strong>📈 Growth:</strong> +${d3.format('.2s')(d.growth)}</div>
                        </div>
                        
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 10px; color: #87CEEB;">
                            Click channel line to focus • Hover for details
                        </div>
                    </div>
                `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 100) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.transition().duration(500).style('opacity', 0);
            });

        // Add axes
        const xAxis = d3.axisBottom(xScale)
            .tickFormat(d3.timeFormat('%b %Y'));
            
        const yAxis = d3.axisLeft(yScale)
            .tickFormat(d3.format('.2s'));

        chartGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(xAxis)
            .style('font-size', '11px')
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)');

        chartGroup.append('g')
            .call(yAxis)
            .style('font-size', '11px');

        // Add axis labels
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', margin.left / 2)
            .attr('x', -(height / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('📊 Cumulative Views');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('📅 Timeline');

        // Add interactive legend
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 180}, 80)`);

        legend.append('rect')
            .attr('x', -10)
            .attr('y', -15)
            .attr('width', 170)
            .attr('height', Math.min(topChannels.length * 25 + 50, 300))
            .attr('fill', 'rgba(255, 255, 255, 0.95)')
            .attr('stroke', '#ddd')
            .attr('rx', 8);

        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('📺 Top Channels:');

        topChannels.forEach((channel, i) => {
            const legendItem = legend.append('g')
                .attr('transform', `translate(0, ${(i + 1) * 25})`)
                .style('cursor', 'pointer')
                .on('click', () => {
                    // Simulate click on the corresponding line
                    const line = chartGroup.selectAll('.timeline-line').nodes()[i];
                    line.dispatchEvent(new Event('click'));
                });

            legendItem.append('line')
                .attr('x1', 0)
                .attr('x2', 20)
                .attr('y1', 0)
                .attr('y2', 0)
                .attr('stroke', colorScale(i))
                .attr('stroke-width', 3);

            legendItem.append('text')
                .attr('x', 25)
                .attr('y', 5)
                .style('font-size', '10px')
                .style('fill', '#2c3e50')
                .text(channel.name.length > 18 ? channel.name.substring(0, 18) + '...' : channel.name);

            legendItem.append('text')
                .attr('x', 25)
                .attr('y', 18)
                .style('font-size', '8px')
                .style('fill', '#7f8c8d')
                .text(`${d3.format('.1s')(channel.totalViews)} views • ${channel.totalVideos} videos`);
        });

        // Add instructions
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#999')
            .text('💡 Click channel lines to focus • Hover milestones for video details • Click legend to select channels');
    }

    // 9. Publishing Timing Heatmap - When to Publish for Success
    createPublishingTimingHeatmap(data, container) {
        this.clearVisualization(container);
        
        if (!data || !data.data || data.data.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 5px;">
                    <div style="text-align: center; color: #6c757d;">
                        <h4>No Timing Data Available</h4>
                        <p>Waiting for video data to load...</p>
                    </div>
                </div>
            `;
            return;
        }

        const margin = { top: 60, right: 80, bottom: 60, left: 80 };
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;
        
        const cellWidth = width / 24; // 24 hours
        const cellHeight = height / 7; // 7 days

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Color scale for success rate
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd)
            .domain([0, data.maxSuccess]);

        // Create heatmap cells
        const cells = chartGroup.selectAll('.timing-cell')
            .data(data.data)
            .enter().append('rect')
            .attr('class', 'timing-cell')
            .attr('x', d => d.hour * cellWidth)
            .attr('y', d => d.day * cellHeight)
            .attr('width', cellWidth - 1)
            .attr('height', cellHeight - 1)
            .attr('fill', d => d.count > 0 ? colorScale(d.successRate) : '#f0f0f0')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                this.tooltip.style('opacity', .9)
                    .html(`
                        <strong>${d.dayName} ${d.hour}:00</strong><br/>
                        Videos Published: ${d.count}<br/>
                        Avg Views: ${d.avgViews.toLocaleString()}<br/>
                        Avg Likes: ${d.avgLikes.toLocaleString()}<br/>
                        Success Score: ${(d.successRate * 100).toFixed(1)}%
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', () => {
                this.tooltip.style('opacity', 0);
            });

        // Add day labels (Y-axis)
        chartGroup.selectAll('.day-label')
            .data(data.days)
            .enter().append('text')
            .attr('class', 'day-label')
            .attr('x', -10)
            .attr('y', (d, i) => i * cellHeight + cellHeight/2)
            .attr('text-anchor', 'end')
            .attr('alignment-baseline', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => d.substring(0, 3)); // Mon, Tue, etc.

        // Add hour labels (X-axis)
        const hours = Array.from({length: 24}, (_, i) => i);
        chartGroup.selectAll('.hour-label')
            .data(hours)
            .enter().append('text')
            .attr('class', 'hour-label')
            .attr('x', d => d * cellWidth + cellWidth/2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#666')
            .text(d => d % 6 === 0 ? `${d}:00` : ''); // Show every 6 hours

        // Add title
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('📅 Publishing Timing Heatmap');

        // Add legend
        const legendWidth = 200;
        const legendHeight = 15;
        const legend = svg.append('g')
            .attr('transform', `translate(${width + margin.left - legendWidth}, ${margin.top + height + 35})`);

        const legendScale = d3.scaleLinear()
            .domain([0, data.maxSuccess])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(5)
            .tickFormat(d => `${(d * 100).toFixed(0)}%`);

        // Create gradient for legend
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'timing-legend-gradient');

        gradient.selectAll('stop')
            .data(d3.range(0, 1.01, 0.1))
            .enter().append('stop')
            .attr('offset', d => `${d * 100}%`)
            .attr('stop-color', d => colorScale(d * data.maxSuccess));

        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', 'url(#timing-legend-gradient)')
            .attr('stroke', '#333')
            .attr('stroke-width', 1);

        legend.append('g')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(legendAxis);

        legend.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .text('Success Rate');

        // Add instructions
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', height + margin.top + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#999')
            .text('💡 Hover cells to see publishing stats • Darker colors = better performance');
    }

    // 10. Tag Performance Network - Tag Relationships and Performance
    createTagPerformanceNetwork(data, container) {
        this.clearVisualization(container);
        
        if (!data || !data.nodes || data.nodes.length === 0) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background-color: #f8f9fa; border-radius: 5px;">
                    <div style="text-align: center; color: #6c757d;">
                        <h4>No Tag Data Available</h4>
                        <p>Waiting for video tag data to load...</p>
                    </div>
                </div>
            `;
            return;
        }

        const margin = { top: 40, right: 40, bottom: 60, left: 40 };
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width - margin.left - margin.right;
        const height = containerRect.height - margin.top - margin.bottom;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom);

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Color scale based on engagement
        const engagementExtent = d3.extent(data.nodes, d => d.engagement);
        const colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain(engagementExtent);

        // Size scale for nodes
        const sizeScale = d3.scaleSqrt()
            .domain(d3.extent(data.nodes, d => d.count))
            .range([5, 25]);

        // Create force simulation
        const simulation = d3.forceSimulation(data.nodes)
            .force('link', d3.forceLink(data.links).id(d => d.id).strength(0.1))
            .force('charge', d3.forceManyBody().strength(-100))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(d => sizeScale(d.count) + 2));

        // Create links
        const links = chartGroup.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(data.links)
            .enter().append('line')
            .attr('stroke', '#999')
            .attr('stroke-opacity', 0.3)
            .attr('stroke-width', d => Math.sqrt(d.value) * 2);

        // Create nodes
        const nodes = chartGroup.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(data.nodes)
            .enter().append('circle')
            .attr('r', d => sizeScale(d.count))
            .attr('fill', d => colorScale(d.engagement))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended))
            .on('mouseover', (event, d) => {
                this.tooltip.style('opacity', .9)
                    .html(`
                        <strong>${d.label}</strong><br/>
                        Frequency: ${d.count} videos<br/>
                        Avg Views: ${d.avgViews.toLocaleString()}<br/>
                        Avg Likes: ${d.avgLikes.toLocaleString()}<br/>
                        Engagement: ${(d.engagement * 100).toFixed(2)}%<br/>
                        Categories: ${d.categoryCount}
                    `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');

                // Highlight connected nodes
                const connectedNodes = new Set();
                data.links.forEach(link => {
                    if (link.source.id === d.id) connectedNodes.add(link.target.id);
                    if (link.target.id === d.id) connectedNodes.add(link.source.id);
                });

                nodes.style('opacity', node => 
                    node.id === d.id || connectedNodes.has(node.id) ? 1 : 0.3);
                links.style('opacity', link => 
                    link.source.id === d.id || link.target.id === d.id ? 0.8 : 0.1);
            })
            .on('mouseout', () => {
                this.tooltip.style('opacity', 0);
                nodes.style('opacity', 1);
                links.style('opacity', 0.3);
            });

        // Add labels for top nodes
        const topNodes = data.nodes.slice(0, 15); // Top 15 most frequent tags
        const labels = chartGroup.append('g')
            .attr('class', 'labels')
            .selectAll('text')
            .data(topNodes)
            .enter().append('text')
            .text(d => d.label.length > 12 ? d.label.substring(0, 12) + '...' : d.label)
            .style('font-size', '10px')
            .style('fill', '#333')
            .style('text-anchor', 'middle')
            .style('pointer-events', 'none');

        // Update positions on simulation tick
        simulation.on('tick', () => {
            links
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            nodes
                .attr('cx', d => Math.max(sizeScale(d.count), Math.min(width - sizeScale(d.count), d.x)))
                .attr('cy', d => Math.max(sizeScale(d.count), Math.min(height - sizeScale(d.count), d.y)));

            labels
                .attr('x', d => d.x)
                .attr('y', d => d.y - sizeScale(d.count) - 5);
        });

        // Drag functions
        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        // Add title
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text('🏷️ Tag Performance Network');

        // Add legend
        const legendData = [
            { label: 'Node Size', desc: 'Tag Frequency' },
            { label: 'Node Color', desc: 'Engagement Rate' },
            { label: 'Connections', desc: 'Tags Used Together' }
        ];

        const legend = svg.append('g')
            .attr('transform', `translate(20, ${height + margin.top + 10})`);

        legend.selectAll('.legend-item')
            .data(legendData)
            .enter().append('text')
            .attr('class', 'legend-item')
            .attr('x', (d, i) => i * 150)
            .attr('y', 0)
            .style('font-size', '11px')
            .style('fill', '#666')
            .text(d => `${d.label}: ${d.desc}`);

        // Add stats
        svg.append('text')
            .attr('x', (width + margin.left + margin.right) / 2)
            .attr('y', height + margin.top + margin.bottom - 10)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#999')
            .text(`💡 ${data.stats.filteredTags} tags • ${data.stats.connections} connections • Drag nodes to explore • Hover for details`);
    }

}

// Create global instance
window.visualizations = new Visualizations();