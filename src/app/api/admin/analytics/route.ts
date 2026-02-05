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
    // ใช้ Promise.all เพื่อ query พร้อมกัน - เพิ่มประสิทธิภาพ
    const [
      // User stats
      userStats,
      usersByRole,
      newUsersLast7Days,
      newUsersLast30Days,
      
      // Request stats
      requestStats,
      requestsLast7Days,
      requestsLast30Days,
      
      // Price group stats
      priceGroupStats,
      groupsUsage,
      
      // Image stats
      imageStats,
      imagesLast7Days,
      imagesLast30Days,
      
      // Announcement stats
      announcementStats,
      
      // Activity stats
      activityStats,
      topActiveUsers,
      dailyActivity,
      
      // Inactive users
      inactiveUsersList,
      
      // Branch stats
      branchStats,
    ] = await Promise.all([
      // User stats - single optimized query
      query<{
        total: string;
        active: string;
        inactive: string;
        with_access: string;
        without_access: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE is_active = false) as inactive,
          COUNT(DISTINCT uga.user_id) as with_access,
          COUNT(*) - COUNT(DISTINCT uga.user_id) as without_access
        FROM users u
        LEFT JOIN user_group_access uga ON u.id = uga.user_id
      `),
      
      // Users by role
      query<{ role: string; count: string }>(`
        SELECT role, COUNT(*) as count 
        FROM users 
        GROUP BY role 
        ORDER BY count DESC
      `),
      
      // New users last 7 days
      query<{ count: string }>(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `),
      
      // New users last 30 days
      query<{ count: string }>(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),
      
      // Request stats - single optimized query
      query<{
        total: string;
        pending: string;
        approved: string;
        rejected: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'pending') as pending,
          COUNT(*) FILTER (WHERE status = 'approved') as approved,
          COUNT(*) FILTER (WHERE status = 'rejected') as rejected
        FROM access_requests
      `),
      
      // Requests last 7 days
      query<{ count: string }>(`
        SELECT COUNT(*) as count 
        FROM access_requests 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `),
      
      // Requests last 30 days
      query<{ count: string }>(`
        SELECT COUNT(*) as count 
        FROM access_requests 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),
      
      // Price group stats - single optimized query
      query<{
        total: string;
        active: string;
        inactive: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active,
          COUNT(*) FILTER (WHERE is_active = false) as inactive
        FROM price_groups
      `),
      
      // Groups usage with user and image counts
      query<{
        group_id: string;
        group_name: string;
        branch_name: string;
        user_count: string;
        image_count: string;
      }>(`
        SELECT 
          pg.id as group_id,
          pg.name as group_name,
          COALESCE(b.name, 'ไม่ระบุ') as branch_name,
          COUNT(DISTINCT uga.user_id) as user_count,
          COUNT(DISTINCT pgi.id) as image_count
        FROM price_groups pg
        LEFT JOIN branches b ON pg.branch_id = b.id
        LEFT JOIN user_group_access uga ON pg.id = uga.price_group_id
        LEFT JOIN price_group_images pgi ON pg.id = pgi.price_group_id
        GROUP BY pg.id, pg.name, b.name
        ORDER BY user_count DESC, image_count DESC
        LIMIT 10
      `),
      
      // Image stats
      query<{ total: string }>(`
        SELECT COUNT(*) as total FROM price_group_images
      `),
      
      // Images last 7 days
      query<{ count: string }>(`
        SELECT COUNT(*) as count 
        FROM price_group_images 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `),
      
      // Images last 30 days
      query<{ count: string }>(`
        SELECT COUNT(*) as count 
        FROM price_group_images 
        WHERE created_at >= NOW() - INTERVAL '30 days'
      `),
      
      // Announcement stats - single optimized query
      query<{
        total: string;
        published: string;
        unpublished: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_published = true) as published,
          COUNT(*) FILTER (WHERE is_published = false) as unpublished
        FROM announcements
      `),
      
      // Activity stats - single optimized query
      query<{
        total: string;
        last_7_days: string;
        last_30_days: string;
        login_count: string;
        upload_count: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') as last_7_days,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as last_30_days,
          COUNT(*) FILTER (WHERE action = 'login') as login_count,
          COUNT(*) FILTER (WHERE action LIKE '%upload%') as upload_count
        FROM activity_logs
      `),
      
      // Top active users (last 30 days)
      query<{
        user_id: string;
        user_name: string;
        activity_count: string;
      }>(`
        SELECT 
          al.user_id,
          COALESCE(u.name, 'Unknown') as user_name,
          COUNT(*) as activity_count
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY al.user_id, u.name
        ORDER BY activity_count DESC
        LIMIT 10
      `),
      
      // Daily activity trend (last 14 days)
      query<{
        date: string;
        logins: string;
        uploads: string;
        total: string;
      }>(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) FILTER (WHERE action = 'login') as logins,
          COUNT(*) FILTER (WHERE action LIKE '%upload%') as uploads,
          COUNT(*) as total
        FROM activity_logs
        WHERE created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `),
      
      // Inactive users (no activity in 30+ days)
      query<{
        id: string;
        name: string;
        email: string;
        shop_name: string;
        last_login: string;
        days_inactive: string;
      }>(`
        SELECT 
          u.id,
          u.name,
          u.email,
          COALESCE(ar.shop_name, '') as shop_name,
          MAX(al.created_at) as last_login,
          COALESCE(EXTRACT(DAY FROM NOW() - MAX(al.created_at))::int, 999) as days_inactive
        FROM users u
        LEFT JOIN access_requests ar ON u.id = ar.user_id AND ar.status = 'approved'
        LEFT JOIN activity_logs al ON u.id = al.user_id AND al.action = 'login'
        WHERE u.is_active = true
        GROUP BY u.id, u.name, u.email, ar.shop_name
        HAVING MAX(al.created_at) IS NULL OR MAX(al.created_at) < NOW() - INTERVAL '30 days'
        ORDER BY days_inactive DESC
        LIMIT 20
      `),
      
      // Branch stats
      query<{
        total: string;
        active: string;
      }>(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE is_active = true) as active
        FROM branches
      `),
    ]);

    const result = {
      users: {
        total: parseInt(userStats[0]?.total || '0'),
        active: parseInt(userStats[0]?.active || '0'),
        inactive: parseInt(userStats[0]?.inactive || '0'),
        withAccess: parseInt(userStats[0]?.with_access || '0'),
        withoutAccess: parseInt(userStats[0]?.without_access || '0'),
        newLast7Days: parseInt(newUsersLast7Days[0]?.count || '0'),
        newLast30Days: parseInt(newUsersLast30Days[0]?.count || '0'),
        byRole: usersByRole.map(r => ({ role: r.role, count: parseInt(r.count) })),
      },
      requests: {
        total: parseInt(requestStats[0]?.total || '0'),
        pending: parseInt(requestStats[0]?.pending || '0'),
        approved: parseInt(requestStats[0]?.approved || '0'),
        rejected: parseInt(requestStats[0]?.rejected || '0'),
        last7Days: parseInt(requestsLast7Days[0]?.count || '0'),
        last30Days: parseInt(requestsLast30Days[0]?.count || '0'),
      },
      priceGroups: {
        total: parseInt(priceGroupStats[0]?.total || '0'),
        active: parseInt(priceGroupStats[0]?.active || '0'),
        inactive: parseInt(priceGroupStats[0]?.inactive || '0'),
        usage: groupsUsage.map(g => ({
          id: g.group_id,
          name: g.group_name,
          branchName: g.branch_name,
          userCount: parseInt(g.user_count),
          imageCount: parseInt(g.image_count),
        })),
      },
      images: {
        total: parseInt(imageStats[0]?.total || '0'),
        last7Days: parseInt(imagesLast7Days[0]?.count || '0'),
        last30Days: parseInt(imagesLast30Days[0]?.count || '0'),
      },
      announcements: {
        total: parseInt(announcementStats[0]?.total || '0'),
        published: parseInt(announcementStats[0]?.published || '0'),
        unpublished: parseInt(announcementStats[0]?.unpublished || '0'),
      },
      branches: {
        total: parseInt(branchStats[0]?.total || '0'),
        active: parseInt(branchStats[0]?.active || '0'),
      },
      activity: {
        totalLogs: parseInt(activityStats[0]?.total || '0'),
        last7Days: parseInt(activityStats[0]?.last_7_days || '0'),
        last30Days: parseInt(activityStats[0]?.last_30_days || '0'),
        loginCount: parseInt(activityStats[0]?.login_count || '0'),
        uploadCount: parseInt(activityStats[0]?.upload_count || '0'),
        dailyTrend: dailyActivity.map(d => ({
          date: d.date,
          logins: parseInt(d.logins),
          uploads: parseInt(d.uploads),
          total: parseInt(d.total),
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
