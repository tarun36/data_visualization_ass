# YouTube Trending Data Visualization

## Project Overview

This project creates interactive data visualizations using D3.js to analyze YouTube trending video data across multiple countries. The project fulfills the requirements for the Data Visualization assignment using the YouTube trending dataset.

## Dataset

The project uses YouTube trending video data from 10 countries:
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

Each country has:
- A CSV file with video data (views, likes, categories, channels, etc.)
- A JSON file with category ID mappings

## Features

### 6 Interactive Visualizations

1. **Bar Chart - Average Views by Country**
   - Shows average video views across different countries
   - Interactive tooltips with detailed statistics
   - Horizontal bar chart with country comparison

2. **Pie Chart - Video Category Distribution**
   - Displays the distribution of video categories across all data
   - Shows top 8 categories with percentages
   - Interactive legend and hover effects

3. **Scatter Plot - Views vs Likes Correlation**
   - Plots relationship between video views and likes
   - Uses logarithmic scales for better visualization
   - Color-coded by country
   - Interactive tooltips with video details

4. **Timeline - Trending Videos Over Time**
   - Shows the number of trending videos over time
   - Line chart with interactive data points
   - Displays trending patterns and peaks

5. **Heatmap - Country Activity by Category**
   - Matrix visualization showing activity levels
   - Countries vs video categories
   - Color intensity represents activity levels

6. **Treemap - Top Channels**
   - Hierarchical visualization of top YouTube channels
   - Rectangle size represents total views
   - Interactive tooltips with channel statistics

## Technical Implementation

### Technologies Used
- **HTML5** - Structure and markup
- **CSS3** - Styling and responsive design
- **JavaScript (ES6+)** - Application logic and interactivity
- **D3.js v7** - Data visualization library

### Architecture

```
Project2_Data_Visualization/
├── index.html              # Main HTML file with navigation
├── css/
│   └── main.css            # Styles and responsive design
├── js/
│   ├── data-loader.js      # Data loading and processing
│   ├── visualizations.js  # D3.js visualization functions
│   └── main.js            # Main application logic
├── data/                  # YouTube trending data
│   ├── *videos.csv        # Video data for each country
│   └── *_category_id.json # Category mappings
├── images/                # Project images (if any)
├── docs/                  # Documentation
└── README.md              # Project documentation
```

### Key Features

- **Responsive Design**: Works on desktop and mobile devices
- **Interactive Navigation**: Smooth transitions between visualizations
- **Data Processing**: Efficient handling of large CSV datasets
- **Error Handling**: Graceful error handling and user feedback
- **Performance Optimization**: Data sampling for better performance
- **Accessibility**: Proper labels, legends, and tooltips

## Team Member Contributions

*[To be filled in by team members]*

### Member 1: [Name]
- **Visualizations Created**: [List 2+ visualizations]
- **Responsibilities**: [Description of work]

### Member 2: [Name]
- **Visualizations Created**: [List 2+ visualizations]  
- **Responsibilities**: [Description of work]

### Member 3: [Name] *(if applicable)*
- **Visualizations Created**: [List 2+ visualizations]
- **Responsibilities**: [Description of work]

## Setup Instructions

1. **Clone/Download** the project files
2. **Data Setup**: Ensure all data files are in the `data/` directory
3. **Local Server**: Run a local web server (required for loading CSV files)
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (if http-server is installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
4. **Open Browser**: Navigate to `http://localhost:8000`

## Data Processing

The application automatically:
- Loads category mappings from JSON files
- Parses CSV data with proper field types
- Handles data cleaning and validation
- Creates derived fields (category names, parsed dates)
- Optimizes performance by sampling large datasets

## Browser Compatibility

- **Chrome** (recommended)
- **Firefox**
- **Safari**
- **Edge**

*Note: Requires modern browser with ES6+ support*

## Future Enhancements

- Add more visualization types (Sankey diagrams, force-directed graphs)
- Implement data filtering and search capabilities
- Add real-time data updates via YouTube API
- Export visualizations as images/PDFs
- Add more interactive features (brushing, linking)

## Course Information

- **Course**: Web Content Management
- **Project**: Data Visualization Assignment
- **Semester**: [Current Semester]
- **Institution**: Conestoga College

## License

This project is created for educational purposes as part of a college assignment.