// Video Journey - Interactive Sankey Diagram
class VideoSankeyChart {
    constructor() {
        this.svg = null;
        this.tooltip = null;
        this.sankey = null;
        this.data = null;
    }

    async render(container) {
        // Clear container
        container.innerHTML = '';
        
        // Generate Sankey data
        this.data = this.generateSankeyData();
        
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
        
        // Create Sankey generator
        this.sankey = d3.sankey()
            .nodeWidth(15)
            .nodePadding(10)
            .extent([[1, 1], [width - 1, height - 5]]);
        
        // Generate Sankey layout
        const { nodes, links } = this.sankey(this.data);
        
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(nodes.map(d => d.id))
            .range(d3.schemeCategory10);
        
        // Create links
        const link = this.svg.append('g')
            .selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.sankeyLinkHorizontal())
            .attr('stroke', d => d3.schemeCategory10[d.source.index % 10])
            .attr('stroke-width', d => Math.max(1, d.width))
            .attr('fill', 'none')
            .attr('opacity', 0.3)
            .style('cursor', 'pointer')
            .on('mouseover', (event, d) => {
                this.highlightLink(event, d);
            })
            .on('mouseout', (event) => {
                this.unhighlightLink(event);
            });
        
        // Create nodes
        const node = this.svg.append('g')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .style('cursor', 'pointer');
        
        // Add node rectangles
        node.append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => d.y1 - d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => colorScale(d.id))
            .attr('stroke', '#000')
            .attr('opacity', 0.8)
            .on('mouseover', (event, d) => {
                this.highlightNode(event, d);
            })
            .on('mouseout', (event) => {
                this.unhighlightNode(event);
            });
        
        // Add node labels
        node.append('text')
            .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
            .attr('y', d => (d.y1 + d.y0) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
            .attr('font-size', '10px')
            .text(d => d.id.length > 15 ? d.id.substring(0, 15) + '...' : d.id);
        
        // Add value labels on links
        link.append('title')
            .text(d => `${d.source.id} → ${d.target.id}\nValue: ${formatNumber(d.value)}`);
        
        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#2d3436')
            .text('Video Content Flow Analysis');
        
        // Add legend
        this.createLegend();
        
        // Add controls
        this.createControls();
        
        // Add statistics
        this.addStatistics();
    }

    generateSankeyData() {
        const categories = dataLoader.aggregateByCategory().slice(0, 8); // Top 8 categories
        const channels = dataLoader.getTopChannels(15); // Top 15 channels
        const engagementLevels = ['High', 'Medium', 'Low'];
        
        const nodes = [];
        const links = [];
        
        // Add category nodes
        categories.forEach(category => {
            nodes.push({
                id: category.category,
                type: 'category',
                value: category.totalViews
            });
        });
        
        // Add channel nodes
        channels.forEach(channel => {
            nodes.push({
                id: channel.channel,
                type: 'channel',
                value: channel.totalViews
            });
        });
        
        // Add engagement level nodes
        engagementLevels.forEach(level => {
            nodes.push({
                id: level,
                type: 'engagement',
                value: 0
            });
        });
        
        // Create links from categories to channels
        categories.forEach(category => {
            const categoryChannels = channels.filter(channel => 
                channel.categories.includes(category.category)
            );
            
            categoryChannels.forEach(channel => {
                const value = Math.min(category.totalViews, channel.totalViews) * 0.1;
                links.push({
                    source: category.category,
                    target: channel.channel,
                    value: value
                });
            });
        });
        
        // Create links from channels to engagement levels
        channels.forEach(channel => {
            let engagementLevel;
            if (channel.engagementRate > 0.05) {
                engagementLevel = 'High';
            } else if (channel.engagementRate > 0.02) {
                engagementLevel = 'Medium';
            } else {
                engagementLevel = 'Low';
            }
            
            links.push({
                source: channel.channel,
                target: engagementLevel,
                value: channel.totalViews * 0.1
            });
        });
        
        return { nodes, links };
    }

    highlightLink(event, d) {
        d3.select(event.target)
            .attr('opacity', 0.8)
            .attr('stroke-width', d => Math.max(3, d.width + 2));
        
        const content = `
            <strong>${d.source.id} → ${d.target.id}</strong><br/>
            Flow Value: ${formatNumber(d.value)}<br/>
            Source Type: ${d.source.type || 'category'}<br/>
            Target Type: ${d.target.type || 'channel'}
        `;
        
        showTooltip(this.tooltip, content, event);
    }

    unhighlightLink(event) {
        d3.select(event.target)
            .attr('opacity', 0.3)
            .attr('stroke-width', d => Math.max(1, d.width));
        
        hideTooltip(this.tooltip);
    }

    highlightNode(event, d) {
        d3.select(event.target)
            .attr('opacity', 1)
            .attr('stroke-width', 2);
        
        // Highlight connected links
        this.svg.selectAll('.link')
            .attr('opacity', link => 
                link.source.id === d.id || link.target.id === d.id ? 0.8 : 0.1
            );
        
        const content = `
            <strong>${d.id}</strong><br/>
            Type: ${d.type || 'node'}<br/>
            Value: ${formatNumber(d.value)}<br/>
            Position: ${d.x0.toFixed(0)}, ${d.y0.toFixed(0)}
        `;
        
        showTooltip(this.tooltip, content, event);
    }

    unhighlightNode(event) {
        d3.select(event.target)
            .attr('opacity', 0.8)
            .attr('stroke-width', 1);
        
        // Reset all links
        this.svg.selectAll('.link')
            .attr('opacity', 0.3);
        
        hideTooltip(this.tooltip);
    }

    createLegend() {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.svg.attr('width') - 100}, 0)`);
        
        const legendData = [
            { type: 'Category', color: '#1f77b4' },
            { type: 'Channel', color: '#ff7f0e' },
            { type: 'Engagement', color: '#2ca02c' }
        ];
        
        const legendItems = legend.selectAll('.legend-item')
            .data(legendData)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 25})`);
        
        legendItems.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d => d.color);
        
        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .attr('font-size', '10px')
            .text(d => d.type);
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
            .text('• Hover nodes to highlight')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Hover links for details')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Width = Flow value')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Color = Node type');
    }

    addStatistics() {
        const totalNodes = this.data.nodes.length;
        const totalLinks = this.data.links.length;
        const totalFlow = d3.sum(this.data.links, d => d.value);
        
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
            .text(`Nodes: ${totalNodes}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Links: ${totalLinks}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Total Flow: ${formatNumber(totalFlow)}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Avg Flow: ${formatNumber(totalFlow / totalLinks)}`);
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        d3.select('.controls').remove();
        d3.select('.statistics').remove();
    }
}