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
    async loadVideoData(countriesToLoad = ['US', 'CA', 'GB', 'DE', 'FR', 'IN', 'JP', 'KR', 'MX', 'RU']) {
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
        // Check if this is a Git LFS pointer file
        if (text.includes('version https://git-lfs.github.com/spec/v1')) {
            console.warn(`CSV file for ${country} is a Git LFS pointer. Generating fallback data.`);
            return this.generateFallbackData(country);
        }
        
        const lines = text.trim().split('\n');
        
        // Additional check for empty or malformed CSV
        if (lines.length < 2) {
            console.warn(`CSV file for ${country} appears to be empty or malformed. Generating fallback data.`);
            return this.generateFallbackData(country);
        }
        
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
        
        return data.length > 0 ? data : this.generateFallbackData(country);
    }

    // Generate fallback data when real data is not available
    generateFallbackData(country) {
        const categories = ['Music', 'Entertainment', 'Gaming', 'News & Politics', 'Sports', 'Science & Technology'];
        const fallbackData = [];
        
        // Generate 50 sample videos per country
        for (let i = 0; i < 50; i++) {
            const categoryId = Math.floor(Math.random() * 6) + 1;
            const categoryName = categories[categoryId - 1];
            
            fallbackData.push({
                video_id: `${country}_video_${i}`,
                title: `Sample Video ${i + 1}`,
                channel_title: `Channel ${Math.floor(Math.random() * 20) + 1}`,
                category_id: categoryId,
                category_name: categoryName,
                views: Math.floor(Math.random() * 1000000) + 10000,
                likes: Math.floor(Math.random() * 50000) + 1000,
                dislikes: Math.floor(Math.random() * 5000) + 100,
                comment_count: Math.floor(Math.random() * 10000) + 500,
                country: country,
                trending_date: '17.14.11',
                trending_date_parsed: new Date(2017, 13, 11)
            });
        }
        
        console.log(`Generated ${fallbackData.length} fallback records for ${country}`);
        return fallbackData;
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

    // Get category distribution for a specific country
    getCategoryDistributionByCountry(country) {
        if (country === 'all') {
            return this.getCategoryDistribution();
        }
        
        const categoryCount = {};
        if (this.videoData[country]) {
            this.videoData[country].forEach(video => {
                const category = video.category_name;
                categoryCount[category] = (categoryCount[category] || 0) + 1;
            });
        }
        return categoryCount;
    }

    // Get list of available countries
    getAvailableCountries() {
        return Object.keys(this.videoData).sort();
    }

    // Get views vs likes data for scatter plot
    getViewsVsLikes(sampleSize = 500, country = 'all') {
        let videos;
        
        if (country === 'all') {
            videos = Object.values(this.videoData).flat();
        } else {
            videos = this.videoData[country] || [];
        }
        
        // Sample data for performance
        const sampled = videos
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

    // Get timeline data for a specific country
    getTimelineDataByCountry(country) {
        if (country === 'all') {
            return this.getTimelineData();
        }
        
        const timelineData = {};
        if (this.videoData[country]) {
            this.videoData[country].forEach(video => {
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
        }
        
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

    // Get filtered engagement metrics
    getFilteredEngagementMetrics(country = 'all', category = 'all') {
        let filteredVideos = Object.values(this.videoData).flat();

        // Filter by country
        if (country !== 'all') {
            filteredVideos = filteredVideos.filter(video => video.country === country);
        }

        // Filter by category
        if (category !== 'all') {
            filteredVideos = filteredVideos.filter(video => video.category_name === category);
        }

        return {
            Likes: filteredVideos.reduce((sum, v) => sum + v.likes, 0),
            Dislikes: filteredVideos.reduce((sum, v) => sum + v.dislikes, 0),
            Comments: filteredVideos.reduce((sum, v) => sum + v.comment_count, 0)
        };
    }

    // Get all available categories
    getAvailableCategories() {
        const categories = new Set();
        Object.values(this.videoData).flat().forEach(video => {
            if (video.category_name) {
                categories.add(video.category_name);
            }
        });
        return Array.from(categories).sort();
    }

    // Get top videos by views
    getTopVideosByViews(limit = 10) {
        const allVideos = Object.values(this.videoData).flat();
        return allVideos
            .sort((a, b) => b.views - a.views)
            .slice(0, limit)
            .map(video => ({
                title: video.title.length > 30 ? video.title.substring(0, 30) + '...' : video.title,
                views: video.views,
                likes: video.likes,
                comments: video.comment_count,
                channel: video.channel_title,
                country: video.country,
                category: video.category_name
            }));
    }

    // Get top channels by engagement
    getTopChannelsByEngagement(limit = 10) {
        const channelData = {};
        Object.values(this.videoData).flat().forEach(video => {
            const channel = video.channel_title;
            if (!channelData[channel]) {
                channelData[channel] = {
                    name: channel,
                    totalViews: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    videoCount: 0
                };
            }
            channelData[channel].totalViews += video.views;
            channelData[channel].totalLikes += video.likes;
            channelData[channel].totalComments += video.comment_count;
            channelData[channel].videoCount++;
        });

        return Object.values(channelData)
            .map(channel => ({
                name: channel.name.length > 20 ? channel.name.substring(0, 20) + '...' : channel.name,
                engagementScore: (channel.totalLikes / channel.totalViews) * 100,
                totalViews: channel.totalViews,
                totalLikes: channel.totalLikes,
                videoCount: channel.videoCount
            }))
            .sort((a, b) => b.engagementScore - a.engagementScore)
            .slice(0, limit);
    }

    // Get category performance data
    getCategoryPerformance() {
        const categories = this.getAvailableCategories();
        return categories.map(category => {
            const categoryVideos = Object.values(this.videoData).flat()
                .filter(video => video.category_name === category);
            
            if (categoryVideos.length > 0) {
                const totalViews = categoryVideos.reduce((sum, v) => sum + v.views, 0);
                const totalLikes = categoryVideos.reduce((sum, v) => sum + v.likes, 0);
                const totalComments = categoryVideos.reduce((sum, v) => sum + v.comment_count, 0);
                
                return {
                    category: category,
                    totalViews: totalViews,
                    totalLikes: totalLikes,
                    totalComments: totalComments,
                    videoCount: categoryVideos.length,
                    avgViews: totalViews / categoryVideos.length
                };
            }
            return null;
        }).filter(item => item !== null)
        .sort((a, b) => b.totalViews - a.totalViews);
    }

    // Get country performance data
    getCountryPerformance() {
        const countries = Object.keys(this.videoData);
        return countries.map(country => {
            const countryVideos = this.videoData[country] || [];
            if (countryVideos.length > 0) {
                const totalViews = countryVideos.reduce((sum, v) => sum + v.views, 0);
                const totalLikes = countryVideos.reduce((sum, v) => sum + v.likes, 0);
                const totalComments = countryVideos.reduce((sum, v) => sum + v.comment_count, 0);
                
                return {
                    country: country,
                    totalViews: totalViews,
                    totalLikes: totalLikes,
                    totalComments: totalComments,
                    videoCount: countryVideos.length,
                    avgViews: totalViews / countryVideos.length
                };
            }
            return null;
        }).filter(item => item !== null)
        .sort((a, b) => b.totalViews - a.totalViews);
    }

    // Get country video counts for choropleth map
    getCountryVideoCounts() {
        const countryCounts = {};
        Object.keys(this.videoData).forEach(country => {
            countryCounts[country] = this.videoData[country].length;
        });
        return countryCounts;
    }

    // Get country display names mapping
    getCountryDisplayNames() {
        return {
            'CA': 'Canada',
            'DE': 'Germany', 
            'FR': 'France',
            'GB': 'United Kingdom',
            'IN': 'India',
            'JP': 'Japan',
            'KR': 'South Korea',
            'MX': 'Mexico',
            'RU': 'Russia',
            'US': 'United States'
        };
    }

    // Get total number of unique channels
    getTotalChannelCount() {
        const uniqueChannels = new Set();
        Object.values(this.videoData).flat().forEach(video => {
            uniqueChannels.add(video.channel_title);
        });
        return uniqueChannels.size;
    }

    // Get all channels data (without limit)
    getAllChannels() {
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
            .sort((a, b) => b.totalViews - a.totalViews);
    }

    // Get top channels data for treemap
    getTopChannels(limit = 50) {
        const allChannels = this.getAllChannels();
        return allChannels.slice(0, limit);
    }

    // Get channels filtered by country
    getChannelsByCountry(country, limit = 50) {
        const allChannels = this.getAllChannels();
        return allChannels
            .filter(channel => channel.countries.includes(country))
            .slice(0, limit);
    }

    // Get heatmap data for category distribution by country
    getHeatmapData() {
        try {
            // Get all unique categories from all videos
            const allCategories = new Set();
            Object.values(this.videoData).flat().forEach(video => {
                if (video && video.category_name) {
                    allCategories.add(video.category_name);
                }
            });
            
            const categories = Array.from(allCategories).sort();
            const countries = Object.keys(this.videoData);
            
            // Create simple heatmap data structure
            const heatmapData = [];
            
            countries.forEach(country => {
                const countryVideos = this.videoData[country] || [];
                const categoryCounts = {};
                
                // Count videos per category
                countryVideos.forEach(video => {
                    if (video && video.category_name) {
                        categoryCounts[video.category_name] = (categoryCounts[video.category_name] || 0) + 1;
                    }
                });
                
                // Create data points for each category
                categories.forEach(category => {
                    const count = categoryCounts[category] || 0;
                    const totalVideos = countryVideos.length;
                    const percentage = totalVideos > 0 ? (count / totalVideos) * 100 : 0;
                    
                    heatmapData.push({
                        country: country,
                        category: category,
                        value: percentage,
                        count: count,
                        totalVideos: totalVideos
                    });
                });
            });
            
            return {
                data: heatmapData,
                categories: categories,
                countries: countries
            };
            
        } catch (error) {
            console.error('Error in getHeatmapData:', error);
            return {
                data: [],
                categories: [],
                countries: []
            };
        }
    }

    // Get Sankey diagram data
    getSankeyData(flowType = 'country-category') {
        try {
            const sankeyData = {
                nodes: [],
                links: []
            };

            if (flowType === 'country-category') {
                // Country → Category flow
                const countries = Object.keys(this.videoData);
                const categories = new Set();
                
                // Collect all categories
                Object.values(this.videoData).flat().forEach(video => {
                    if (video && video.category_name) {
                        categories.add(video.category_name);
                    }
                });

                const categoryArray = Array.from(categories);
                
                // Create nodes
                countries.forEach(country => {
                    sankeyData.nodes.push({
                        id: country,
                        name: this.getCountryDisplayName(country),
                        type: 'country'
                    });
                });
                
                categoryArray.forEach(category => {
                    sankeyData.nodes.push({
                        id: category,
                        name: category,
                        type: 'category'
                    });
                });

                // Create links
                countries.forEach(country => {
                    const countryVideos = this.videoData[country] || [];
                    const categoryCounts = {};
                    
                    countryVideos.forEach(video => {
                        if (video && video.category_name) {
                            categoryCounts[video.category_name] = (categoryCounts[video.category_name] || 0) + 1;
                        }
                    });

                    Object.entries(categoryCounts).forEach(([category, count]) => {
                        if (count > 0) { // Only add links with positive values
                            sankeyData.links.push({
                                source: country,
                                target: category,
                                value: count
                            });
                        }
                    });
                });
            } else if (flowType === 'category-engagement') {
                // Category → Engagement flow
                const categories = new Set();
                const engagementLevels = ['High', 'Medium', 'Low'];
                
                // Collect all categories
                Object.values(this.videoData).flat().forEach(video => {
                    if (video && video.category_name) {
                        categories.add(video.category_name);
                    }
                });

                const categoryArray = Array.from(categories);
                
                // Create nodes
                categoryArray.forEach(category => {
                    sankeyData.nodes.push({
                        id: category,
                        name: category,
                        type: 'category'
                    });
                });
                
                engagementLevels.forEach(level => {
                    sankeyData.nodes.push({
                        id: level,
                        name: level,
                        type: 'engagement'
                    });
                });

                // Create links based on engagement rates
                categoryArray.forEach(category => {
                    const categoryVideos = Object.values(this.videoData).flat().filter(video => 
                        video && video.category_name === category
                    );
                    
                    const totalVideos = categoryVideos.length;
                    if (totalVideos > 0) {
                        const avgEngagement = categoryVideos.reduce((sum, video) => 
                            sum + (video.likes + video.comment_count), 0
                        ) / totalVideos;
                        
                        let engagementLevel;
                        if (avgEngagement > 1000) engagementLevel = 'High';
                        else if (avgEngagement > 500) engagementLevel = 'Medium';
                        else engagementLevel = 'Low';
                        
                        if (totalVideos > 0) { // Only add links with positive values
                            sankeyData.links.push({
                                source: category,
                                target: engagementLevel,
                                value: totalVideos
                            });
                        }
                    }
                });
            } else if (flowType === 'country-engagement') {
                // Country → Engagement flow
                const countries = Object.keys(this.videoData);
                const engagementLevels = ['High', 'Medium', 'Low'];
                
                // Create nodes
                countries.forEach(country => {
                    sankeyData.nodes.push({
                        id: country,
                        name: this.getCountryDisplayName(country),
                        type: 'country'
                    });
                });
                
                engagementLevels.forEach(level => {
                    sankeyData.nodes.push({
                        id: level,
                        name: level,
                        type: 'engagement'
                    });
                });

                // Create links based on country engagement
                countries.forEach(country => {
                    const countryVideos = this.videoData[country] || [];
                    const totalVideos = countryVideos.length;
                    
                    if (totalVideos > 0) {
                        const avgEngagement = countryVideos.reduce((sum, video) => 
                            sum + (video.likes + video.comment_count), 0
                        ) / totalVideos;
                        
                        let engagementLevel;
                        if (avgEngagement > 1000) engagementLevel = 'High';
                        else if (avgEngagement > 500) engagementLevel = 'Medium';
                        else engagementLevel = 'Low';
                        
                        if (totalVideos > 0) { // Only add links with positive values
                            sankeyData.links.push({
                                source: country,
                                target: engagementLevel,
                                value: totalVideos
                            });
                        }
                    }
                });
            }

            // Validate data before returning
            if (sankeyData.nodes.length === 0 || sankeyData.links.length === 0) {
                console.warn('Sankey data is empty, returning fallback data');
                return {
                    nodes: [
                        { id: 'No Data', name: 'No Data', type: 'fallback' }
                    ],
                    links: []
                };
            }
            
            return sankeyData;
        } catch (error) {
            console.error('Error in getSankeyData:', error);
            return { nodes: [], links: [] };
        }
    }

    // Get display name for country code
    getCountryDisplayName(countryCode) {
        const countryNames = {
            'CA': 'Canada',
            'DE': 'Germany', 
            'FR': 'France',
            'GB': 'Great Britain',
            'IN': 'India',
            'JP': 'Japan',
            'KR': 'South Korea',
            'MX': 'Mexico',
            'RU': 'Russia',
            'US': 'United States'
        };
        return countryNames[countryCode] || countryCode;
    }

    // Get radar chart data
    getRadarData(metricsType = 'engagement', countriesFilter = 'all') {
        try {
            const countries = Object.keys(this.videoData);
            let countriesToShow = countries;
            
            if (countriesFilter === 'top5') {
                // Get top 5 countries by total views
                const countryStats = countries.map(country => {
                    const videos = this.videoData[country] || [];
                    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
                    return { country, totalViews };
                }).sort((a, b) => b.totalViews - a.totalViews).slice(0, 5);
                
                countriesToShow = countryStats.map(stat => stat.country);
            } else if (countriesFilter === 'top3') {
                // Get top 3 countries by total views
                const countryStats = countries.map(country => {
                    const videos = this.videoData[country] || [];
                    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
                    return { country, totalViews };
                }).sort((a, b) => b.totalViews - a.totalViews).slice(0, 3);
                
                countriesToShow = countryStats.map(stat => stat.country);
            }

            const radarData = countriesToShow.map(country => {
                const videos = this.videoData[country] || [];
                const totalVideos = videos.length;
                
                if (totalVideos === 0) return null;
                
                const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
                const totalLikes = videos.reduce((sum, video) => sum + (video.likes || 0), 0);
                const totalComments = videos.reduce((sum, video) => sum + (video.comment_count || 0), 0);
                const totalDislikes = videos.reduce((sum, video) => sum + (video.dislikes || 0), 0);
                
                const avgViews = totalViews / totalVideos;
                const avgLikes = totalLikes / totalVideos;
                const avgComments = totalComments / totalVideos;
                const avgDislikes = totalDislikes / totalVideos;
                
                // Calculate engagement rate more accurately
                const engagementRate = avgViews > 0 ? ((avgLikes + avgComments) / avgViews) * 100 : 0;
                const likeToDislikeRatio = avgDislikes > 0 ? avgLikes / avgDislikes : avgLikes;
                const categoryDiversity = new Set(videos.map(video => video.category_name)).size;
                
                const data = {
                    country: this.getCountryDisplayName(country),
                    countryCode: country
                };
                
                // Add metrics based on selected type
                switch (metricsType) {
                    case 'engagement':
                        data.avgLikes = avgLikes;
                        data.avgComments = avgComments;
                        data.engagementRate = engagementRate;
                        break;
                        
                    case 'views':
                        data.avgViews = avgViews;
                        data.totalVideos = totalVideos;
                        data.categoryDiversity = categoryDiversity;
                        break;
                        
                    case 'all':
                    default:
                        data.avgViews = avgViews;
                        data.avgLikes = avgLikes;
                        data.avgComments = avgComments;
                        data.engagementRate = engagementRate;
                        data.totalVideos = totalVideos;
                        data.categoryDiversity = categoryDiversity;
                        data.likeToDislikeRatio = likeToDislikeRatio;
                        break;
                }
                
                return data;
            }).filter(Boolean);

            // Sort by average views for consistent ordering
            radarData.sort((a, b) => (b.avgViews || 0) - (a.avgViews || 0));

            console.log(`Generated radar data for ${radarData.length} countries with ${metricsType} metrics`);
            return radarData;
        } catch (error) {
            console.error('Error in getRadarData:', error);
            return [];
        }
    }

    // Initialize all data loading
    async init(countriesToLoad = ['US', 'CA', 'GB', 'DE', 'FR', 'IN', 'JP', 'KR', 'MX', 'RU']) {
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