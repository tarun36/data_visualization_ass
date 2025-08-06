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
        const lines = text.trim().split('\n');
        
        // Check for empty or malformed CSV
        if (lines.length < 2) {
            console.warn(`CSV file for ${country} appears to be empty or malformed.`);
            return [];
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

    // Get channel timeline data for the success timeline
    getChannelTimelineData(countriesFilter = 'all', minViews = 10000) {
        try {
            const countries = Object.keys(this.videoData);
            let countriesToShow = countries;
            
            if (countriesFilter === 'top5') {
                const countryStats = countries.map(country => {
                    const videos = this.videoData[country] || [];
                    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
                    return { country, totalViews };
                }).sort((a, b) => b.totalViews - a.totalViews).slice(0, 5);
                
                countriesToShow = countryStats.map(stat => stat.country);
            } else if (countriesFilter === 'top3') {
                const countryStats = countries.map(country => {
                    const videos = this.videoData[country] || [];
                    const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);
                    return { country, totalViews };
                }).sort((a, b) => b.totalViews - a.totalViews).slice(0, 3);
                
                countriesToShow = countryStats.map(stat => stat.country);
            }

            // Collect all qualifying videos from selected countries
            const channelTimelineData = [];
            
            countriesToShow.forEach(country => {
                const videos = this.videoData[country] || [];
                
                videos.forEach(video => {
                    // Only include videos with sufficient views and valid dates
                    if (video.views >= minViews && video.publish_time) {
                        channelTimelineData.push({
                            ...video,
                            country: country,
                            countryDisplay: this.getCountryDisplayName(country)
                        });
                    }
                });
            });

            console.log(`Generated channel timeline data for ${channelTimelineData.length} videos across ${countriesToShow.length} countries`);
            return channelTimelineData;
        } catch (error) {
            console.error('Error in getChannelTimelineData:', error);
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

    // Get tag cloud data for burst visualization
    getTagCloudData(country = 'all') {
        try {
            const tagData = {};
            const videos = country === 'all' ? 
                Object.values(this.videoData).flat() : 
                (this.videoData[country] || []);

            videos.forEach(video => {
                if (video && video.tags) {
                    // Parse tags - split by | and clean quotes
                    const tags = video.tags.split('|').map(tag => 
                        tag.replace(/"/g, '').trim()
                    ).filter(tag => tag.length > 2); // Filter short tags

                    tags.forEach(tag => {
                        if (!tagData[tag]) {
                            tagData[tag] = {
                                count: 0,
                                totalViews: 0,
                                totalLikes: 0,
                                totalComments: 0,
                                videos: []
                            };
                        }
                        tagData[tag].count++;
                        tagData[tag].totalViews += video.views || 0;
                        tagData[tag].totalLikes += video.likes || 0;
                        tagData[tag].totalComments += video.comment_count || 0;
                        tagData[tag].videos.push({
                            title: video.title,
                            views: video.views,
                            country: video.country,
                            category: video.category_name
                        });
                    });
                }
            });

            // Convert to array and calculate metrics
            return Object.entries(tagData)
                .map(([tag, data]) => ({
                    tag,
                    count: data.count,
                    avgViews: data.totalViews / data.count,
                    avgLikes: data.totalLikes / data.count,
                    avgComments: data.totalComments / data.count,
                    engagement: ((data.totalLikes + data.totalComments) / data.totalViews) || 0,
                    videos: data.videos
                }))
                .filter(item => item.count >= 2) // Only tags appearing 2+ times
                .sort((a, b) => b.count - a.count)
                .slice(0, 50); // Top 50 tags
        } catch (error) {
            console.error('Error processing tag cloud data:', error);
            return [];
        }
    }

    // Get cultural preference data by country
    getCulturalPreferenceData() {
        try {
            const culturalData = {};
            
            // Initialize countries
            Object.keys(this.videoData).forEach(country => {
                culturalData[country] = {
                    country,
                    name: this.getCountryDisplayName(country),
                    categories: {},
                    totalVideos: 0,
                    totalViews: 0,
                    totalEngagement: 0
                };
            });

            // Process videos by country and category
            Object.entries(this.videoData).forEach(([country, videos]) => {
                videos.forEach(video => {
                    if (video && video.category_name) {
                        const category = video.category_name;
                        
                        if (!culturalData[country].categories[category]) {
                            culturalData[country].categories[category] = {
                                count: 0,
                                totalViews: 0,
                                totalLikes: 0,
                                totalDislikes: 0,
                                totalComments: 0
                            };
                        }

                        const cat = culturalData[country].categories[category];
                        cat.count++;
                        cat.totalViews += video.views || 0;
                        cat.totalLikes += video.likes || 0;
                        cat.totalDislikes += video.dislikes || 0;
                        cat.totalComments += video.comment_count || 0;

                        culturalData[country].totalVideos++;
                        culturalData[country].totalViews += video.views || 0;
                        culturalData[country].totalEngagement += 
                            (video.likes || 0) + (video.comment_count || 0);
                    }
                });

                // Calculate metrics for each category
                Object.entries(culturalData[country].categories).forEach(([category, data]) => {
                    data.avgViews = data.totalViews / data.count;
                    data.popularity = data.count / culturalData[country].totalVideos;
                    data.engagement = data.totalViews > 0 ? 
                        ((data.totalLikes + data.totalComments) / data.totalViews) : 0;
                    data.quality = data.totalDislikes > 0 ? 
                        (data.totalLikes / (data.totalLikes + data.totalDislikes)) : 1;
                });
            });

            return Object.values(culturalData);
        } catch (error) {
            console.error('Error processing cultural preference data:', error);
            return [];
        }
    }

    // Get publishing timing data for heatmap (day vs hour analysis)
    getPublishingTimingData() {
        try {
            const timingData = {};
            const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            // Initialize grid: day x hour
            for (let day = 0; day < 7; day++) {
                timingData[day] = {};
                for (let hour = 0; hour < 24; hour++) {
                    timingData[day][hour] = {
                        count: 0,
                        totalViews: 0,
                        totalLikes: 0,
                        totalComments: 0,
                        videos: []
                    };
                }
            }
            
            // Process all videos
            Object.values(this.videoData).flat().forEach(video => {
                if (video && video.publish_time) {
                    const publishDate = new Date(video.publish_time);
                    const day = publishDate.getDay(); // 0-6 (Sun-Sat)
                    const hour = publishDate.getHours(); // 0-23
                    
                    const slot = timingData[day][hour];
                    slot.count++;
                    slot.totalViews += video.views || 0;
                    slot.totalLikes += video.likes || 0;
                    slot.totalComments += video.comment_count || 0;
                    slot.videos.push({
                        title: video.title,
                        views: video.views,
                        country: video.country
                    });
                }
            });
            
            // Convert to array format for visualization
            const heatmapArray = [];
            for (let day = 0; day < 7; day++) {
                for (let hour = 0; hour < 24; hour++) {
                    const slot = timingData[day][hour];
                    heatmapArray.push({
                        day: day,
                        dayName: daysOfWeek[day],
                        hour: hour,
                        count: slot.count,
                        avgViews: slot.count > 0 ? slot.totalViews / slot.count : 0,
                        avgLikes: slot.count > 0 ? slot.totalLikes / slot.count : 0,
                        avgComments: slot.count > 0 ? slot.totalComments / slot.count : 0,
                        totalViews: slot.totalViews,
                        successRate: slot.count > 0 ? (slot.totalViews / slot.count) / 1000000 : 0, // Normalized success
                        videos: slot.videos
                    });
                }
            }
            
            return {
                data: heatmapArray,
                days: daysOfWeek,
                maxSuccess: Math.max(...heatmapArray.map(d => d.successRate))
            };
            
        } catch (error) {
            console.error('Error processing publishing timing data:', error);
            return { data: [], days: [], maxSuccess: 0 };
        }
    }

    // Get tag network data for performance analysis
    getTagNetworkData(minTagFreq = 3) {
        try {
            const tagData = {};
            const tagCooccurrence = {};
            
            // Step 1: Extract and count tags
            Object.values(this.videoData).flat().forEach(video => {
                if (video && video.tags) {
                    // Parse tags - split by | and clean quotes
                    const tags = video.tags.split('|')
                        .map(tag => tag.replace(/"/g, '').trim())
                        .filter(tag => tag.length > 2 && tag.length < 30) // Filter reasonable tags
                        .slice(0, 10); // Limit to first 10 tags per video
                    
                    // Count individual tags
                    tags.forEach(tag => {
                        if (!tagData[tag]) {
                            tagData[tag] = {
                                count: 0,
                                totalViews: 0,
                                totalLikes: 0,
                                totalComments: 0,
                                categories: new Set()
                            };
                        }
                        tagData[tag].count++;
                        tagData[tag].totalViews += video.views || 0;
                        tagData[tag].totalLikes += video.likes || 0;
                        tagData[tag].totalComments += video.comment_count || 0;
                        tagData[tag].categories.add(video.category_name);
                    });
                    
                    // Count tag co-occurrences (for network connections)
                    for (let i = 0; i < tags.length; i++) {
                        for (let j = i + 1; j < tags.length; j++) {
                            const tag1 = tags[i];
                            const tag2 = tags[j];
                            const pair = [tag1, tag2].sort().join('|||'); // Consistent ordering
                            
                            if (!tagCooccurrence[pair]) {
                                tagCooccurrence[pair] = 0;
                            }
                            tagCooccurrence[pair]++;
                        }
                    }
                }
            });
            
            // Step 2: Filter tags by minimum frequency
            const popularTags = Object.entries(tagData)
                .filter(([tag, data]) => data.count >= minTagFreq)
                .slice(0, 50) // Limit to top 50 for performance
                .map(([tag, data]) => ({
                    id: tag,
                    label: tag,
                    count: data.count,
                    avgViews: data.totalViews / data.count,
                    avgLikes: data.totalLikes / data.count,
                    avgComments: data.totalComments / data.count,
                    engagement: ((data.totalLikes + data.totalComments) / data.totalViews) || 0,
                    categoryCount: data.categories.size,
                    size: Math.log(data.count + 1) * 10 // Logarithmic sizing
                }));
            
            const tagIds = new Set(popularTags.map(t => t.id));
            
            // Step 3: Create network links (connections between tags)
            const links = Object.entries(tagCooccurrence)
                .map(([pair, count]) => {
                    const [tag1, tag2] = pair.split('|||');
                    return {
                        source: tag1,
                        target: tag2,
                        value: count,
                        strength: count
                    };
                })
                .filter(link => tagIds.has(link.source) && tagIds.has(link.target))
                .filter(link => link.value >= 2) // Only strong connections
                .sort((a, b) => b.value - a.value)
                .slice(0, 100); // Limit connections for performance
            
            return {
                nodes: popularTags,
                links: links,
                stats: {
                    totalTags: Object.keys(tagData).length,
                    filteredTags: popularTags.length,
                    connections: links.length
                }
            };
            
        } catch (error) {
            console.error('Error processing tag network data:', error);
            return { nodes: [], links: [], stats: {} };
        }
    }
}

// Create global instance
window.dataLoader = new DataLoader();