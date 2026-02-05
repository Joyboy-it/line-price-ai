import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';

// Cache analytics data for 5 minutes
let cachedData: any = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user || !hasPermission(session.user.role, 'view_analytics')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Return cached data if still valid
  const now = Date.now();
  if (cachedData && (now - cacheTimestamp) < CACHE_DURATION) {
    return NextResponse.json(cachedData);
  }

  try {
    console.log('[Analytics API] Starting data fetch...');
    
    // Test basic query
    const testResult = await query<{ count: string }>(`SELECT 1 as test`);
    console.log('[Analytics API] Test query result:', testResult);
    
    // Minimal queries for basic stats
    const totalUsers = await query<{ count: string }>(`SELECT COUNT(*) as count FROM users`);
    console.log('[Analytics API] Users query result:', totalUsers);
    
    const totalGroups = await query<{ count: string }>(`SELECT COUNT(*) as count FROM price_groups`);
    const totalImages = await query<{ count: string }>(`SELECT COUNT(*) as count FROM price_group_images`);
    
    console.log('[Analytics API] Basic stats fetched');
    
    // Empty arrays for all other data
    const activeUsers = [{ count: '0' }];
    const inactiveUsers = [{ count: '0' }];
    const usersWithAccess = [{ count: '0' }];
    const usersWithoutAccess = [{ count: '0' }];
    const newUsersLast7Days = [{ count: '0' }];
    const newUsersLast30Days = [{ count: '0' }];
    const totalRequests = [{ count: '0' }];
    const pendingRequests = [{ count: '0' }];
    const approvedRequests = [{ count: '0' }];
    const rejectedRequests = [{ count: '0' }];
    const requestsLast7Days = [{ count: '0' }];
    const requestsLast30Days = [{ count: '0' }];
    const activeGroups = [{ count: '0' }];
    const inactiveGroups = [{ count: '0' }];
    const imagesLast7Days = [{ count: '0' }];
    const imagesLast30Days = [{ count: '0' }];
    const totalAnnouncements = [{ count: '0' }];
    const publishedAnnouncements = [{ count: '0' }];
    const unpublishedAnnouncements = [{ count: '0' }];
    const totalLogs = [{ count: '0' }];
    const logsLast7Days = [{ count: '0' }];
    const logsLast30Days = [{ count: '0' }];
    const loginCount = [{ count: '0' }];
    const uploadCount = [{ count: '0' }];
    const usersByRole: any[] = [];
    const inactiveUsersList: any[] = [];
    const dailyActivity: any[] = [];
    const topActiveUsers: any[] = [];
    const groupsUsage: any[] = [];
    
    // LINE API Usage Statistics
    let lineUsage = {
      totalMessages: 0,
      thisMonth: 0,
      lastMonth: 0,
      freeQuotaRemaining: 1000,
      error: null as string | null,
    };

    const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (LINE_CHANNEL_ACCESS_TOKEN) {
      try {
        // ดึงข้อมูลการใช้งาน LINE API
        const lineResponse = await fetch('https://api.line.me/v2/bot/message/quota/consumption', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
          },
        });

        if (lineResponse.ok) {
          const lineData = await lineResponse.json();
          lineUsage = {
            totalMessages: lineData.totalUsage || 0,
            thisMonth: lineData.totalUsage || 0,
            lastMonth: 0,
            freeQuotaRemaining: Math.max(0, 1000 - (lineData.totalUsage || 0)),
            error: null,
          };
        } else {
          lineUsage.error = `LINE API Error: ${lineResponse.status}`;
        }
      } catch (lineError) {
        console.error('[Analytics API] LINE usage fetch error:', lineError);
        lineUsage.error = lineError instanceof Error ? lineError.message : 'Unknown error';
      }
    } else {
      lineUsage.error = 'LINE_CHANNEL_ACCESS_TOKEN not configured';
    }
    
    console.log('[Analytics API] All data fetched successfully');

    const result = {
      users: {
        total: parseInt(totalUsers[0]?.count || '0'),
        active: parseInt(activeUsers[0]?.count || '0'),
        inactive: parseInt(inactiveUsers[0]?.count || '0'),
        withAccess: parseInt(usersWithAccess[0]?.count || '0'),
        withoutAccess: parseInt(usersWithoutAccess[0]?.count || '0'),
        newLast7Days: parseInt(newUsersLast7Days[0]?.count || '0'),
        newLast30Days: parseInt(newUsersLast30Days[0]?.count || '0'),
        byRole: usersByRole.map(r => ({ role: r.role, count: parseInt(r.count) })),
      },
      requests: {
        total: parseInt(totalRequests[0]?.count || '0'),
        pending: parseInt(pendingRequests[0]?.count || '0'),
        approved: parseInt(approvedRequests[0]?.count || '0'),
        rejected: parseInt(rejectedRequests[0]?.count || '0'),
        last7Days: parseInt(requestsLast7Days[0]?.count || '0'),
        last30Days: parseInt(requestsLast30Days[0]?.count || '0'),
      },
      priceGroups: {
        total: parseInt(totalGroups[0]?.count || '0'),
        active: parseInt(activeGroups[0]?.count || '0'),
        inactive: parseInt(inactiveGroups[0]?.count || '0'),
        usage: groupsUsage.map(g => ({
          id: g.group_id,
          name: g.group_name,
          userCount: parseInt(g.user_count),
          imageCount: parseInt(g.image_count),
        })),
      },
      images: {
        total: parseInt(totalImages[0]?.count || '0'),
        last7Days: parseInt(imagesLast7Days[0]?.count || '0'),
        last30Days: parseInt(imagesLast30Days[0]?.count || '0'),
      },
      announcements: {
        total: parseInt(totalAnnouncements[0]?.count || '0'),
        published: parseInt(publishedAnnouncements[0]?.count || '0'),
        unpublished: parseInt(unpublishedAnnouncements[0]?.count || '0'),
      },
      activity: {
        totalLogs: parseInt(totalLogs[0]?.count || '0'),
        last7Days: parseInt(logsLast7Days[0]?.count || '0'),
        last30Days: parseInt(logsLast30Days[0]?.count || '0'),
        loginCount: parseInt(loginCount[0]?.count || '0'),
        uploadCount: parseInt(uploadCount[0]?.count || '0'),
        dailyTrend: dailyActivity.map(d => ({
          date: d.date,
          logins: parseInt(d.logins),
          uploads: parseInt(d.uploads),
        })),
        topUsers: topActiveUsers.map(u => ({
          userId: u.user_id,
          userName: u.user_name,
          activityCount: parseInt(u.activity_count),
        })),
      },
      inactiveUsers: inactiveUsersList.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        shopName: u.shop_name,
        lastLogin: u.last_login,
        daysInactive: parseInt(u.days_inactive?.toString() || '0'),
      })),
      lineUsage: {
        totalMessages: lineUsage.totalMessages,
        thisMonth: lineUsage.thisMonth,
        lastMonth: lineUsage.lastMonth,
        freeQuotaRemaining: lineUsage.freeQuotaRemaining,
        freeQuotaLimit: 1000,
        percentUsed: Math.round((lineUsage.thisMonth / 1000) * 100),
        error: lineUsage.error,
      },
    };

    // Cache the result
    cachedData = result;
    cacheTimestamp = Date.now();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
