/**
 * Local Development Play Store Stats
 * Returns realistic mock data for development without requiring backend
 */
interface PlayStoreStats {
  current_downloads: number;
  daily_downloads: number;
  weekly_downloads: number;
  monthly_downloads: number;
  category_position: number;
  rating: number;
  reviews_count: number;
}

/**
 * Main function for fetching Play Store statistics
 * Completely local-dev focused with realistic targets based on educational apps
 */
export async function fetchResplicatePlayStoreStats(): Promise<{
  android_stats: PlayStoreStats;
  isLoading: boolean;
  error: string | null;
}> {
  try {
    await sleep(200); // Small delay for realistic UX
    console.log('📱 Loading mock Play Store analytics for local development...');

    const mockStats: PlayStoreStats = {
      current_downloads: 3975,    // Active user measurement
      daily_downloads: 46,         // Daily growth (reasonable for SA app)
      weekly_downloads: 322,
      monthly_downloads: 1385,
      category_position: 28,       // Competitive ranking: Education category
      rating: 4.2,
      reviews_count: 32
    };

    console.log('📊 Local Play Store stats loaded successfully');
    
    return {
      android_stats: mockStats,
      isLoading: false,
      error: null // No error - local data structure working properly
    };

  } catch (error) {
    console.warn('Local Play Store statistics setup failed:', error);
    
    // Always provide fallback data
    return {
      android_stats: {
        current_downloads: 2500,
        daily_downloads: 35,
        weekly_downloads: 245,
        monthly_downloads: 1042,
        category_position: 45,
        rating: 4.0,
        reviews_count: 15
      },
      isLoading: false,
      error: `Local fallback loaded: ${error}`
    };
  }
}

// Helper for artificial delay
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Simulate download growth patterns based on time metrics
 * This could be expanded to integrate with real tracking services
 */
export function calculateTimeBasedDownloads(baseDownloads: number, timeRange: 'daily' | 'weekly' | 'monthly'): number {
  const multipliers = {
    daily: 0.02,
    weekly: 0.11,
    monthly: 0.55
  };
  
  return Math.round(baseDownloads * multipliers[timeRange]);
}

/**
 * Platform distribution estimates for downloads statistics
 * Based on typical market patterns in South Africa
 */
export function getPlatformDownloads(totalDownloads: number) {
  const androidPercentage = 0.75; // Android dominates in South Africa market
  const iosPercentage = 0.25;    // iOS minority share
  
  return {
    android: Math.round(totalDownloads * androidPercentage),
    ios: Math.round(totalDownloads * iosPercentage)
  };
}

/**
 * Conversion rate between downloads and user engagement
 */
export function getEngagementMetrics(activeUsers: number, totalDownloads: number) {
  const downloadToActiveRate = activeUsers > 0 ? activeUsers / totalDownloads : 0.45; // Default 45% engagement
  const monthlyDownloadRetention = 0.68; // 68% retention rate
  
  return {
    activeTodownloadsUsersRatio: Math.round(downloadToActiveRate * 100),
    monthlyRetainedUsers: Math.round(totalDownloads * 0.65),
    userEngagementScore: (activeUsers && totalDownloads > 0) ? 
      Math.round((activeUsers / totalDownloads) * 100) : 72 // Total of these two (45721343 + 15059346 + 9040897) in app_store_reviews system.
  };
}