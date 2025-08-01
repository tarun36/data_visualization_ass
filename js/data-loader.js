// Data Loader Module
class DataLoader {
    constructor() {
        this.countries = ['CA', 'DE', 'FR', 'GB', 'IN', 'JP', 'KR', 'MX', 'RU', 'US'];
        this.categories = {};
        this.videoData = {};
        this.isLoaded = false;
    }

    // Load category mapping for all countries
    async loadCategories() {
        const categoryPromises = this.countries.map(async (country) => {
            try {
                const response = await fetch(`data/${country}_category_id.json`);
                const data = await response.json();
                this.categories[country] = this.processCategoryData(data);
                return { country, success: true };
            } catch (error) {
                console.error(`Error loading categories for ${country}:`, error);
                return { country, success: false, error };
            }
        });

        await Promise.all(categoryPromises);
        console.log('Categories loaded:', this.categories);
    }

    // Process category data to create id-to-name mapping
    processCategoryData(data) {
        const categoryMap = {};
        if (data.items) {
            data.items.forEach(item => {
                categoryMap[item.id] = item.snippet.title;
            });
        }
        return categoryMap;
    }

    // Load video data for specific countries (limited for performance)
    async loadVideoData(countriesToLoad = ['US', 'CA', 'GB']) {
        const videoPromises = countriesToLoad.map(async (country) => {
            try {
                const response = await fetch(`data/${country}videos.csv`);
                const text = await response.text();
                this.videoData[country] = this.parseCSV(text, country);
                return { country, success: true, count: this.videoData[country].length };
            } catch (error) {
                console.error(`Error loading video data for ${country}:`, error);
                return { country, success: false, error };
            }
        });

        const results = await Promise.all(videoPromises);
        console.log('Video data loaded:', results);
        this.isLoaded = true;
        return results;
    }

    // Parse CSV data
    parseCSV(text, country) {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',');
        const data = [];

        // Process a subset for performance (first 1000 rows)
        const maxRows = Math.min(lines.length, 1001); // 1000 data rows + header
        
        for (let i = 1; i < maxRows; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length >= headers.length) {
                const row = {};
                headers.forEach((header, index) => {
                    row[header.trim()] = values[index] ? values[index].trim() : '';
                });
                
                // Add country information
                row.country = country;
                
                // Convert numeric fields
                row.views = parseInt(row.views) || 0;
                row.likes = parseInt(row.likes) || 0;
                row.dislikes = parseInt(row.dislikes) || 0;
                row.comment_count = parseInt(row.comment_count) || 0;
                row.category_id = parseInt(row.category_id) || 0;
                
                // Add category name
                row.category_name = this.categories[country] ? 
                    this.categories[country][row.category_id] || 'Unknown' : 'Unknown';
                
                // Parse trending date
                if (row.trending_date) {
                    row.trending_date_parsed = this.parseTrendingDate(row.trending_date);
                }
                
                data.push(row);
            }
        }
        
        return data;
    }

    // Parse CSV line handling quoted fields
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    }

    // Parse trending date format (e.g., "17.14.11")
    parseTrendingDate(dateStr) {
        try {
            const parts = dateStr.split('.');
            if (parts.length === 3) {
                const year = 2000 + parseInt(parts[0]);
                const day = parseInt(parts[1]);
                const month = parseInt(parts[2]);
                return new Date(year, month - 1, day);
            }
        } catch (error) {
            console.warn('Could not parse date:', dateStr);
        }
        return null;
    }

    // Get aggregated data for visualizations
    getViewsByCountry() {
        const result = {};
        Object.keys(this.videoData).forEach(country => {
            const totalViews = this.videoData[country].reduce((sum, video) => sum + video.views, 0);
            const avgViews = totalViews / this.videoData[country].length;
            result[country] = {
                totalViews,
                avgViews,
                videoCount: this.videoData[country].length
            };
        });
        return result;
    }

    // Get category distribution across all countries
    getCategoryDistribution() {
        const categoryCount = {};
        Object.values(this.videoData).flat().forEach(video => {
            const category = video.category_name;
            categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
        return categoryCount;
    }

    // Get views vs likes data for scatter plot
    getViewsVsLikes(sampleSize = 500) {
        const allVideos = Object.values(this.videoData).flat();
        // Sample data for performance
        const sampled = allVideos
            .filter(video => video.views > 0 && video.likes > 0)
            .sort(() => 0.5 - Math.random())
            .slice(0, sampleSize);
        
        return sampled.map(video => ({
            views: video.views,
            likes: video.likes,
            title: video.title,
            country: video.country,
            category: video.category_name
        }));
    }

    // Get timeline data
    getTimelineData() {
        const timelineData = {};
        Object.values(this.videoData).flat().forEach(video => {
            if (video.trending_date_parsed) {
                const dateKey = video.trending_date_parsed.toISOString().split('T')[0];
                if (!timelineData[dateKey]) {
                    timelineData[dateKey] = {
                        date: video.trending_date_parsed,
                        count: 0,
                        totalViews: 0
                    };
                }
                timelineData[dateKey].count++;
                timelineData[dateKey].totalViews += video.views;
            }
        });
        
        return Object.values(timelineData).sort((a, b) => a.date - b.date);
    }

    // Get overall engagement metrics
    getEngagementMetrics() {
        const allVideos = Object.values(this.videoData).flat();
        return {
            Likes: allVideos.reduce((sum, v) => sum + v.likes, 0),
            Dislikes: allVideos.reduce((sum, v) => sum + v.dislikes, 0),
            Comments: allVideos.reduce((sum, v) => sum + v.comment_count, 0)
        };
    }

    // Get top channels data for treemap
    getTopChannels(limit = 20) {
        const channelData = {};
        Object.values(this.videoData).flat().forEach(video => {
            const channel = video.channel_title;
            if (!channelData[channel]) {
                channelData[channel] = {
                    name: channel,
                    videoCount: 0,
                    totalViews: 0,
                    countries: new Set()
                };
            }
            channelData[channel].videoCount++;
            channelData[channel].totalViews += video.views;
            channelData[channel].countries.add(video.country);
        });

        return Object.values(channelData)
            .map(channel => ({
                ...channel,
                countries: Array.from(channel.countries)
            }))
            .sort((a, b) => b.totalViews - a.totalViews)
            .slice(0, limit);
    }

    // Initialize all data loading
    async init(countriesToLoad = ['US', 'CA', 'GB', 'DE', 'FR']) {
        try {
            console.log('Loading categories...');
            await this.loadCategories();
            
            console.log('Loading video data...');
            await this.loadVideoData(countriesToLoad);
            
            console.log('Data loading completed successfully');
            return true;
        } catch (error) {
            console.error('Error initializing data:', error);
            return false;
        }
    }
}

// Create global instance
window.dataLoader = new DataLoader();