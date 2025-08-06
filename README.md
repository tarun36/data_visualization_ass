# YouTube Trending Data Visualization

A comprehensive D3.js data visualization project analyzing YouTube trending videos across multiple countries. This project demonstrates advanced D3.js techniques and interactive data visualization concepts.

## 🎯 Project Overview

This project visualizes YouTube trending data from 10 countries, providing insights into:
- Video popularity patterns across different regions
- Category distribution and preferences
- Engagement metrics and correlations
- Temporal trends in trending videos
- Channel performance analysis

## 🌍 Countries Analyzed

- **CA** - Canada
- **DE** - Germany  
- **FR** - France
- **GB** - Great Britain
- **IN** - India
- **JP** - Japan
- **KR** - South Korea
- **MX** - Mexico
- **RU** - Russia
- **US** - United States

## 📊 Visualizations Implemented

### 1. **Bar Chart - Average Views by Country**
- Horizontal bar chart showing average views per video by country
- Interactive tooltips with detailed statistics
- Smooth animations and hover effects
- Uses D3 scales, axes, and transitions

### 2. **Pie Chart - Category Distribution**
- Interactive pie chart showing video category distribution
- Country-specific filtering
- Dynamic legend with category names
- Percentage labels on larger segments

### 3. **Scatter Plot - Views vs Likes Correlation**
- Scatter plot analyzing relationship between views and likes
- Trend line showing correlation
- Color-coded by country
- Correlation coefficient calculation
- Grid lines for better readability

### 4. **Timeline - Trending Videos Over Time**
- Line chart showing number of trending videos over time
- Country-specific filtering
- Interactive data points with tooltips
- Smooth curve interpolation

### 5. **Heatmap - Country Activity**
- Heatmap visualization of country vs category activity
- Color intensity represents activity levels
- Interactive cells with detailed information

### 6. **Treemap - Top Channels**
- Hierarchical treemap showing top channels by total views
- Channel size proportional to total views
- Interactive tooltips with channel statistics
- Color-coded by performance

### 7. **Donut Chart - Engagement Breakdown**
- Donut chart showing engagement metrics (likes, dislikes, comments)
- Interactive segments with tooltips
- Legend with metric descriptions

### 8. **Network Graph - Category Relationships** ⭐ **NEW**
- Force-directed network graph showing relationships between categories and countries
- Interactive nodes that can be dragged
- Link thickness represents relationship strength
- Real-time physics simulation
- Demonstrates advanced D3.js force simulation

## 🛠️ Technical Implementation

### D3.js Features Used

#### **Scales & Axes**
```javascript
// Linear scales for quantitative data
const xScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([0, width]);

// Band scales for categorical data
const yScale = d3.scaleBand()
    .domain(categories)
    .range([0, height])
    .padding(0.1);

// Time scales for temporal data
const timeScale = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);
```

#### **Shapes & Paths**
```javascript
// Line generator for time series
const line = d3.line()
    .x(d => xScale(d.date))
    .y(d => yScale(d.value))
    .curve(d3.curveMonotoneX);

// Arc generator for pie/donut charts
const arc = d3.arc()
    .innerRadius(radius * 0.5)
    .outerRadius(radius);
```

#### **Transitions & Animations**
```javascript
// Smooth transitions for data updates
selection.transition()
    .duration(1000)
    .attr('width', d => xScale(d.value));
```

#### **Force Simulation** (Network Graph)
```javascript
// Physics-based layout for network visualization
const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).distance(100))
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.size + 5));
```

### Data Processing

#### **CSV Parsing**
- Custom CSV parser handling quoted fields
- Data type conversion (strings to numbers)
- Date parsing for trending dates
- Category mapping from JSON files

#### **Data Aggregation**
- Country-level statistics calculation
- Category distribution analysis
- Engagement metrics computation
- Channel performance ranking

### Interactive Features

#### **Tooltips**
- Dynamic tooltip creation and positioning
- Rich content with formatted data
- Smooth fade in/out animations

#### **Filtering**
- Country-specific data filtering
- Real-time visualization updates
- Dropdown controls with country names

#### **Responsive Design**
- Window resize handling
- Debounced resize events
- Responsive chart containers

## 🚀 Setup & Installation

### Prerequisites
- Node.js (v14 or higher)
- Modern web browser with ES6 support

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Project2_Data_Visualization
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:3000`
   - The application will automatically load

### Available Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with auto-reload

## 📁 Project Structure

```
Project2_Data_Visualization/
├── index.html              # Main HTML file
├── css/
│   └── main.css           # Styles and responsive design
├── js/
│   ├── data-loader.js     # Data loading and processing
│   ├── visualizations.js  # D3.js visualization implementations
│   └── main.js           # Application logic and navigation
├── data/
│   ├── *.csv             # Video data for each country
│   └── *_category_id.json # Category mappings
├── package.json          # Project dependencies
└── README.md            # Project documentation
```

## 🎨 Design Features

### **Modern UI/UX**
- Clean, professional design
- Responsive layout for all screen sizes
- Smooth animations and transitions
- Intuitive navigation

### **Color Schemes**
- D3.js built-in color schemes (`d3.schemeCategory10`)
- Sequential color scales for heatmaps
- Consistent color coding across visualizations

### **Typography**
- Modern font stack (Segoe UI, Tahoma, Geneva, Verdana)
- Hierarchical text sizing
- Good contrast ratios for accessibility

## 📈 Performance Optimizations

### **Data Loading**
- Asynchronous data loading with Promise.all()
- Data sampling for large datasets
- Progressive loading with loading indicators

### **Rendering**
- Efficient D3.js selections and updates
- Debounced resize event handling
- Memory management for large datasets

### **User Experience**
- Loading states and error handling
- Responsive design for mobile devices
- Smooth animations without blocking UI

## 🔧 Customization

### **Adding New Visualizations**
1. Add visualization method to `Visualizations` class
2. Update navigation in `index.html`
3. Add case in `main.js` renderVisualization method
4. Add corresponding CSS styles

### **Modifying Data Sources**
1. Update `DataLoader` class methods
2. Modify CSV parsing logic if needed
3. Update data aggregation functions

### **Styling Changes**
- Modify `css/main.css` for visual changes
- Update color schemes in visualization methods
- Adjust responsive breakpoints as needed

## 🎓 Learning Outcomes

This project demonstrates mastery of:

### **D3.js Concepts**
- Scales and axes for data mapping
- Shape generators (line, arc, treemap)
- Transitions and animations
- Force simulation for network graphs
- Event handling and interactivity

### **Data Visualization Principles**
- Appropriate chart type selection
- Color theory and accessibility
- Interactive design patterns
- Responsive visualization design

### **Web Development**
- Modern JavaScript (ES6+)
- Asynchronous programming
- Error handling and user feedback
- Performance optimization

## 🐛 Troubleshooting

### **Common Issues**

1. **Data not loading**
   - Check browser console for CORS errors
   - Verify data files are in correct location
   - Ensure server is running on correct port

2. **Visualizations not rendering**
   - Check for JavaScript errors in console
   - Verify D3.js library is loaded
   - Check container dimensions

3. **Performance issues**
   - Reduce data sample size in `data-loader.js`
   - Check for memory leaks in force simulations
   - Optimize rendering loops

### **Browser Compatibility**
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Responsive design supported

## 📝 Future Enhancements

### **Potential Additions**
- Real-time data updates
- Advanced filtering options
- Export functionality (PNG, SVG, CSV)
- User preferences and settings
- Dark mode theme
- Accessibility improvements (ARIA labels, keyboard navigation)

### **Advanced D3.js Features**
- Zoom and pan interactions
- Brush selections for data filtering
- Geographic visualizations with D3-geo
- 3D visualizations with WebGL

## 📚 Resources

### **D3.js Documentation**
- [D3.js Official Documentation](https://d3js.org/)
- [D3.js API Reference](https://github.com/d3/d3/blob/main/API.md)
- [D3.js Examples](https://observablehq.com/@d3/gallery)

### **Data Visualization Best Practices**
- [Data Visualization Society](https://www.datavisualizationsociety.com/)
- [Flowing Data](https://flowingdata.com/)
- [Visualization of the Week](https://www.visualisingdata.com/)

---

**Created for Web Content Management Course**  
*Demonstrating advanced D3.js data visualization techniques and interactive web development skills.*