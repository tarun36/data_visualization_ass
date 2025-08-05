// Data loader for YouTube trending videos
class DataLoader {
    constructor() {
        this.data = null;
        this.categories = null;
        this.regions = ['US', 'GB', 'DE', 'CA', 'FR', 'RU', 'MX', 'KR', 'JP', 'IN'];
        this.categoryMap = {
            '1': 'Film & Animation',
            '2': 'Autos & Vehicles', 
            '10': 'Music',
            '15': 'Pets & Animals',
            '17': 'Sports',
            '18': 'Short Movies',
            '19': 'Travel & Events',
            '20': 'Gaming',
            '21': 'Videoblogging',
            '22': 'People & Blogs',
            '23': 'Comedy',
            '24': 'Entertainment',
            '25': 'News & Politics',
            '26': 'Howto & Style',
            '27': 'Education',
            '28': 'Science & Technology',
            '29': 'Nonprofits & Activism',
            '30': 'Movies',
            '31': 'Anime/Animation',
            '32': 'Action/Adventure',
            '33': 'Classics',
            '34': 'Comedy',
            '35': 'Documentary',
            '36': 'Drama',
            '37': 'Family',
            '38': 'Foreign',
            '39': 'Horror',
            '40': 'Sci-Fi/Fantasy',
            '41': 'Thriller',
            '42': 'Shorts',
            '43': 'Shows',
            '44': 'Trailers'
        };
    }

    async loadData() {
        try {
            // Load sample data (in real project, this would be actual CSV files)
            this.data = await this.generateSampleData();
            this.categories = this.categoryMap;
            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    generateSampleData() {
        // Generate realistic sample data based on the structure you provided
        const sampleData = [];
        const channels = [
            'EminemVEVO', 'iDubbbzTV', 'PewDiePie', 'T-Series', 'Cocomelon',
            'SET India', 'WWE', 'MrBeast', 'Kids Diana Show', 'Like Nastya'
        ];
        
        const categories = Object.keys(this.categoryMap);
        
        for (let i = 0; i < 1000; i++) {
            const categoryId = categories[Math.floor(Math.random() * categories.length)];
            const views = Math.floor(Math.random() * 50000000) + 10000;
            const likes = Math.floor(views * (Math.random() * 0.1 + 0.01));
            const dislikes = Math.floor(likes * (Math.random() * 0.3));
            const comments = Math.floor(likes * (Math.random() * 0.5 + 0.1));
            
            sampleData.push({
                video_id: `video_${i}`,
                trending_date: `17.${Math.floor(Math.random() * 12) + 1}.${Math.floor(Math.random() * 28) + 1}`,
                title: `Sample Video ${i}`,
                channel_title: channels[Math.floor(Math.random() * channels.length)],
                category_id: categoryId,
                publish_time: new Date(2017, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28)).toISOString(),
                tags: 'sample,tags,here',
                views: views,
                likes: likes,
                dislikes: dislikes,
                comment_count: comments,
                thumbnail_link: `https://i.ytimg.com/vi/video_${i}/default.jpg`,
                comments_disabled: Math.random() > 0.8,
                ratings_disabled: Math.random() > 0.9,
                video_error_or_removed: Math.random() > 0.95,
                description: 'Sample video description'
            });
        }
        
        return sampleData;
    }

    getCategoryName(categoryId) {
        return this.categoryMap[categoryId] || 'Unknown';
    }

    aggregateByCategory() {
        const aggregated = {};
        
        this.data.forEach(d => {
            const category = this.getCategoryName(d.category_id);
            if (!aggregated[category]) {
                aggregated[category] = {
                    totalViews: 0,
                    totalLikes: 0,
                    totalDislikes: 0,
                    totalComments: 0,
                    videoCount: 0
                };
            }
            
            aggregated[category].totalViews += d.views;
            aggregated[category].totalLikes += d.likes;
            aggregated[category].totalDislikes += d.dislikes;
            aggregated[category].totalComments += d.comment_count;
            aggregated[category].videoCount += 1;
        });
        
        return Object.entries(aggregated).map(([category, data]) => ({
            category,
            ...data,
            avgViews: data.totalViews / data.videoCount,
            avgLikes: data.totalLikes / data.videoCount,
            engagementRate: (data.totalLikes + data.totalComments) / data.totalViews
        }));
    }

    getTopChannels(limit = 20) {
        const channelData = {};
        
        this.data.forEach(d => {
            if (!channelData[d.channel_title]) {
                channelData[d.channel_title] = {
                    totalViews: 0,
                    totalLikes: 0,
                    totalVideos: 0,
                    categories: new Set()
                };
            }
            
            channelData[d.channel_title].totalViews += d.views;
            channelData[d.channel_title].totalLikes += d.likes;
            channelData[d.channel_title].totalVideos += 1;
            channelData[d.channel_title].categories.add(this.getCategoryName(d.category_id));
        });
        
        return Object.entries(channelData)
            .map(([channel, data]) => ({
                channel,
                ...data,
                categories: Array.from(data.categories),
                avgViews: data.totalViews / data.totalVideos,
                engagementRate: data.totalLikes / data.totalViews
            }))
            .sort((a, b) => b.totalViews - a.totalViews)
            .slice(0, limit);
    }

    getTimeSeriesData() {
        const timeData = {};
        
        this.data.forEach(d => {
            const date = d.trending_date;
            if (!timeData[date]) {
                timeData[date] = {
                    totalViews: 0,
                    totalLikes: 0,
                    totalDislikes: 0,
                    videoCount: 0
                };
            }
            
            timeData[date].totalViews += d.views;
            timeData[date].totalLikes += d.likes;
            timeData[date].totalDislikes += d.dislikes;
            timeData[date].videoCount += 1;
        });
        
        return Object.entries(timeData)
            .map(([date, data]) => ({
                date: new Date(`20${date.split('.').reverse().join('-')}`),
                ...data,
                avgViews: data.totalViews / data.videoCount,
                avgLikes: data.totalLikes / data.videoCount
            }))
            .sort((a, b) => a.date - b.date);
    }
}

// Global data loader instance
window.dataLoader = new DataLoader();