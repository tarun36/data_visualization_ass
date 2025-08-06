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

    // 8. Country Performance Heatmap - Better than Radar for Multi-Metric Comparison
    createCountryPerformanceHeatmap(data, container) {
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
                .text('No data available for country performance heatmap');
            return;
        }
        
        const containerRect = container.getBoundingClientRect();
        const width = containerRect.width;
        const height = containerRect.height;
        const margin = { top: 80, right: 60, bottom: 100, left: 120 };
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
            .text('Country Performance Matrix');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 45)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#7f8c8d')
            .text('Darker colors indicate better performance (hover for exact values)');

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Determine available metrics
        const sampleData = data[0];
        const possibleMetrics = {
            'avgViews': 'Avg Views',
            'avgLikes': 'Avg Likes',
            'avgComments': 'Avg Comments',
            'engagementRate': 'Engagement Rate',
            'totalVideos': 'Total Videos',
            'categoryDiversity': 'Category Diversity'
        };
        
        const availableMetrics = Object.keys(possibleMetrics).filter(metric => 
            sampleData && sampleData[metric] !== undefined
        );
        
        if (availableMetrics.length === 0) {
            chartGroup.append('text')
                .attr('x', chartWidth / 2)
                .attr('y', chartHeight / 2)
                .attr('text-anchor', 'middle')
                .style('font-size', '16px')
                .text('No valid metrics found');
            return;
        }

        const metrics = availableMetrics.slice(0, 6); // Limit for better visibility
        const countries = data.map(d => d.country);

        // Create scales
        const xScale = d3.scaleBand()
            .domain(metrics)
            .range([0, chartWidth])
            .padding(0.1);

        const yScale = d3.scaleBand()
            .domain(countries)
            .range([0, chartHeight])
            .padding(0.1);

        // Normalize data for each metric (0-1 scale for consistent coloring)
        const normalizedData = {};
        metrics.forEach(metric => {
            const values = data.map(d => d[metric]).filter(v => v !== undefined && v !== null && !isNaN(v));
            if (values.length > 0) {
                const min = d3.min(values);
                const max = d3.max(values);
                const range = max - min;
                
                normalizedData[metric] = {};
                data.forEach(countryData => {
                    const value = countryData[metric];
                    if (value !== undefined && value !== null && !isNaN(value)) {
                        normalizedData[metric][countryData.country] = range > 0 ? (value - min) / range : 0;
                    } else {
                        normalizedData[metric][countryData.country] = 0;
                    }
                });
            }
        });

        // Color scale for heatmap
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, 1]);

        // Create heatmap cells
        metrics.forEach(metric => {
            countries.forEach(country => {
                const normalizedValue = normalizedData[metric] ? normalizedData[metric][country] : 0;
                const actualValue = data.find(d => d.country === country)[metric];
                
                const cell = chartGroup.append('rect')
                    .attr('x', xScale(metric))
                    .attr('y', yScale(country))
                    .attr('width', xScale.bandwidth())
                    .attr('height', yScale.bandwidth())
                    .attr('fill', colorScale(normalizedValue))
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1)
                    .style('cursor', 'pointer')
                    .on('mouseover', (event) => {
                        // Highlight row and column
                        chartGroup.selectAll('rect')
                            .attr('opacity', 0.3);
                        chartGroup.selectAll(`rect[data-country="${country}"]`)
                            .attr('opacity', 1);
                        chartGroup.selectAll(`rect[data-metric="${metric}"]`)
                            .attr('opacity', 1);
                        d3.select(event.currentTarget).attr('opacity', 1);
                        
                        // Format value based on metric type
                        let formattedValue;
                        if (metric.includes('Views') || metric.includes('views')) {
                            formattedValue = d3.format('.2s')(actualValue) + ' views';
                        } else if (metric.includes('Likes') || metric.includes('likes') || metric.includes('Comments')) {
                            formattedValue = d3.format('.2s')(actualValue);
                        } else if (metric.includes('Rate') || metric.includes('rate')) {
                            formattedValue = d3.format('.2f')(actualValue) + '%';
                        } else {
                            formattedValue = d3.format('.2f')(actualValue);
                        }
                        
                        this.tooltip.transition().duration(200).style('opacity', 0.9);
                        this.tooltip.html(`
                            <div style="background: rgba(0,0,0,0.9); color: white; padding: 12px; border-radius: 5px; font-size: 12px;">
                                <strong style="color: #4CAF50;">${country}</strong><br/>
                                <span style="color: #FFF;">${possibleMetrics[metric]}:</span><br/>
                                <strong style="color: #FFD700; font-size: 14px;">${formattedValue}</strong><br/>
                                <span style="color: #87CEEB;">Relative Performance: ${(normalizedValue * 100).toFixed(1)}%</span>
                            </div>
                        `)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                    })
                    .on('mouseout', () => {
                        chartGroup.selectAll('rect').attr('opacity', 1);
                        this.tooltip.transition().duration(500).style('opacity', 0);
                    });
                
                // Add data attributes for highlighting
                cell.attr('data-country', country)
                    .attr('data-metric', metric);
            });
        });

        // Add X-axis (metrics)
        const xAxis = d3.axisBottom(xScale);
        chartGroup.append('g')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(xAxis)
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .text(d => possibleMetrics[d] || d);

        // Add Y-axis (countries)
        const yAxis = d3.axisLeft(yScale);
        chartGroup.append('g')
            .call(yAxis)
            .selectAll('text')
            .style('font-size', '11px')
            .style('font-weight', 'bold');

        // Add axis labels
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', margin.left / 2)
            .attr('x', -(height / 2))
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('Countries');

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('Performance Metrics');

        // Add color legend
        const legendWidth = 200;
        const legendHeight = 20;
        const legend = svg.append('g')
            .attr('transform', `translate(${width - legendWidth - 40}, ${margin.top - 40})`);

        // Create gradient for legend
        const gradient = svg.append('defs')
            .append('linearGradient')
            .attr('id', 'heatmap-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%');

        gradient.append('stop')
            .attr('offset', '0%')
            .attr('stop-color', colorScale(0));

        gradient.append('stop')
            .attr('offset', '100%')
            .attr('stop-color', colorScale(1));

        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#heatmap-gradient)')
            .attr('stroke', '#333')
            .attr('stroke-width', 1);

        legend.append('text')
            .attr('x', 0)
            .attr('y', -5)
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Low Performance');

        legend.append('text')
            .attr('x', legendWidth)
            .attr('y', -5)
            .attr('text-anchor', 'end')
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('High Performance');

        // Add instructions
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#999')
            .text('Hover over cells to see exact values and relative performance');
    }

}

// Create global instance
window.visualizations = new Visualizations();