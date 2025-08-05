// Category Treemap - Interactive Treemap Chart
class CategoryTreemapChart {
    constructor() {
        this.svg = null;
        this.tooltip = null;
        this.treemap = null;
        this.data = null;
        this.currentNode = null;
    }

    async render(container) {
        // Clear container
        container.innerHTML = '';
        
        // Generate treemap data
        this.data = this.generateTreemapData();
        this.currentNode = this.data;
        
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
        
        // Create treemap generator
        this.treemap = d3.treemap()
            .size([width, height])
            .padding(1)
            .round(true);
        
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(this.data.children.map(d => d.name))
            .range(d3.schemeCategory10);
        
        // Generate treemap layout
        const root = d3.hierarchy(this.data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        
        this.treemap(root);
        
        // Create nodes
        const nodes = this.svg.selectAll('.treemap-node')
            .data(root.leaves())
            .enter()
            .append('g')
            .attr('class', 'treemap-node')
            .attr('transform', d => `translate(${d.x0},${d.y0})`)
            .style('cursor', 'pointer');
        
        // Add rectangles
        nodes.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => colorScale(d.parent.data.name))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8)
            .style('transition', 'all 0.2s ease')
            .on('mouseover', (event, d) => {
                this.highlightNode(event, d);
            })
            .on('mouseout', (event) => {
                this.unhighlightNode(event);
            })
            .on('click', (event, d) => {
                this.zoomToNode(d);
            });
        
        // Add labels
        nodes.append('text')
            .attr('x', 3)
            .attr('y', 18)
            .attr('font-size', '12px')
            .attr('fill', '#fff')
            .attr('font-weight', 'bold')
            .text(d => d.data.name.length > 15 ? d.data.name.substring(0, 15) + '...' : d.data.name);
        
        nodes.append('text')
            .attr('x', 3)
            .attr('y', 32)
            .attr('font-size', '10px')
            .attr('fill', '#fff')
            .text(d => formatNumber(d.value));
        
        // Add parent labels
        const parents = this.svg.selectAll('.parent-label')
            .data(root.descendants().filter(d => d.depth === 1))
            .enter()
            .append('text')
            .attr('class', 'parent-label')
            .attr('x', d => d.x0 + 5)
            .attr('y', d => d.y0 + 20)
            .attr('font-size', '14px')
            .attr('font-weight', 'bold')
            .attr('fill', '#2d3436')
            .text(d => d.data.name);
        
        // Add title
        this.svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', width / 2)
            .attr('y', -10)
            .attr('text-anchor', 'middle')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#2d3436')
            .text('Content Category Hierarchy');
        
        // Add legend
        this.createLegend(colorScale);
        
        // Add controls
        this.createControls();
        
        // Add statistics
        this.addStatistics();
    }

    generateTreemapData() {
        const categories = dataLoader.aggregateByCategory();
        
        // Group categories by main type
        const categoryGroups = {
            'Entertainment': ['Entertainment', 'Music', 'Comedy', 'Film & Animation'],
            'Education': ['Education', 'Science & Technology', 'Howto & Style'],
            'Gaming': ['Gaming'],
            'News': ['News & Politics'],
            'Sports': ['Sports'],
            'Lifestyle': ['People & Blogs', 'Travel & Events', 'Pets & Animals']
        };
        
        const treemapData = {
            name: 'YouTube Content',
            children: []
        };
        
        Object.entries(categoryGroups).forEach(([groupName, groupCategories]) => {
            const groupData = {
                name: groupName,
                children: []
            };
            
            groupCategories.forEach(categoryName => {
                const category = categories.find(c => c.category === categoryName);
                if (category) {
                    groupData.children.push({
                        name: categoryName,
                        value: category.totalViews,
                        category: category
                    });
                }
            });
            
            if (groupData.children.length > 0) {
                treemapData.children.push(groupData);
            }
        });
        
        return treemapData;
    }

    highlightNode(event, d) {
        d3.select(event.target)
            .attr('opacity', 1)
            .attr('stroke-width', 2)
            .attr('stroke', '#2d3436');
        
        const content = `
            <strong>${d.data.name}</strong><br/>
            Group: ${d.parent.data.name}<br/>
            Total Views: ${formatNumber(d.value)}<br/>
            Videos: ${d.data.category.videoCount}<br/>
            Avg Views: ${formatNumber(d.data.category.avgViews)}<br/>
            Engagement Rate: ${(d.data.category.engagementRate * 100).toFixed(2)}%
        `;
        
        showTooltip(this.tooltip, content, event);
    }

    unhighlightNode(event) {
        d3.select(event.target)
            .attr('opacity', 0.8)
            .attr('stroke-width', 1)
            .attr('stroke', '#fff');
        
        hideTooltip(this.tooltip);
    }

    zoomToNode(d) {
        if (d.depth === 0) {
            // Zoom out to root
            this.currentNode = this.data;
            this.updateTreemap();
        } else if (d.depth === 1) {
            // Zoom into group
            this.currentNode = d.data;
            this.updateTreemap();
        }
    }

    updateTreemap() {
        // Clear existing content
        this.svg.selectAll('.treemap-node').remove();
        this.svg.selectAll('.parent-label').remove();
        
        // Generate new layout
        const root = d3.hierarchy(this.currentNode)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        
        this.treemap(root);
        
        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain(this.currentNode.children ? this.currentNode.children.map(d => d.name) : [])
            .range(d3.schemeCategory10);
        
        // Create new nodes
        const nodes = this.svg.selectAll('.treemap-node')
            .data(root.leaves())
            .enter()
            .append('g')
            .attr('class', 'treemap-node')
            .attr('transform', d => `translate(${d.x0},${d.y0})`)
            .style('cursor', 'pointer');
        
        // Add rectangles
        nodes.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => colorScale(d.parent.data.name))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .attr('opacity', 0.8)
            .style('transition', 'all 0.2s ease')
            .on('mouseover', (event, d) => {
                this.highlightNode(event, d);
            })
            .on('mouseout', (event) => {
                this.unhighlightNode(event);
            })
            .on('click', (event, d) => {
                this.zoomToNode(d);
            });
        
        // Add labels
        nodes.append('text')
            .attr('x', 3)
            .attr('y', 18)
            .attr('font-size', '12px')
            .attr('fill', '#fff')
            .attr('font-weight', 'bold')
            .text(d => d.data.name.length > 15 ? d.data.name.substring(0, 15) + '...' : d.data.name);
        
        nodes.append('text')
            .attr('x', 3)
            .attr('y', 32)
            .attr('font-size', '10px')
            .attr('fill', '#fff')
            .text(d => formatNumber(d.value));
        
        // Add parent labels if zoomed in
        if (this.currentNode !== this.data) {
            const parents = this.svg.selectAll('.parent-label')
                .data(root.descendants().filter(d => d.depth === 1))
                .enter()
                .append('text')
                .attr('class', 'parent-label')
                .attr('x', d => d.x0 + 5)
                .attr('y', d => d.y0 + 20)
                .attr('font-size', '14px')
                .attr('font-weight', 'bold')
                .attr('fill', '#2d3436')
                .text(d => d.data.name);
        }
        
        // Update title
        this.svg.select('.chart-title')
            .text(this.currentNode === this.data ? 'Content Category Hierarchy' : `${this.currentNode.name} Categories`);
        
        // Show zoom message
        this.showZoomMessage();
    }

    showZoomMessage() {
        d3.select('.zoom-message').remove();
        
        const message = d3.select('#chart-container')
            .append('div')
            .attr('class', 'zoom-message')
            .style('position', 'absolute')
            .style('top', '20px')
            .style('left', '20px')
            .style('background', '#00b894')
            .style('color', 'white')
            .style('padding', '8px 12px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .text(this.currentNode === this.data ? 'Showing all categories' : `Zoomed into: ${this.currentNode.name}`);
    }

    createLegend(colorScale) {
        const legend = this.svg.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${this.svg.attr('width') - 100}, 0)`);
        
        const legendItems = legend.selectAll('.legend-item')
            .data(this.data.children)
            .enter()
            .append('g')
            .attr('class', 'legend-item')
            .attr('transform', (d, i) => `translate(0, ${i * 20})`)
            .style('cursor', 'pointer');
        
        legendItems.append('rect')
            .attr('width', 15)
            .attr('height', 15)
            .attr('fill', d => colorScale(d.name));
        
        legendItems.append('text')
            .attr('x', 20)
            .attr('y', 12)
            .attr('font-size', '10px')
            .text(d => d.name);
        
        // Add legend interactions
        legendItems.on('click', (event, d) => {
            this.zoomToGroup(d);
        });
    }

    zoomToGroup(group) {
        this.currentNode = group;
        this.updateTreemap();
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
            .text('• Click to zoom in')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Click legend to filter')
            .style('margin-bottom', '2px');
        
        controls.append('div')
            .text('• Size = Total Views');
    }

    addStatistics() {
        const totalViews = d3.sum(this.data.children, d => 
            d3.sum(d.children, child => child.value)
        );
        const totalCategories = d3.sum(this.data.children, d => d.children.length);
        const avgViews = totalViews / totalCategories;
        
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
            .text(`Categories: ${totalCategories}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Groups: ${this.data.children.length}`)
            .style('margin-bottom', '2px');
        
        stats.append('div')
            .text(`Avg Views: ${formatNumber(avgViews)}`);
    }

    destroy() {
        if (this.tooltip) {
            this.tooltip.remove();
        }
        d3.select('.controls').remove();
        d3.select('.statistics').remove();
        d3.select('.zoom-message').remove();
    }
}