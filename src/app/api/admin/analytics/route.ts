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
    // ── User Stats ──
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      usersWithAccess,
      newUsersLast7Days,
      newUsersLast30Days,
      usersByRole,
    ] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM users`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM users WHERE is_active = true`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM users WHERE is_active = false`),
      query<{ count: string }>(`SELECT COUNT(DISTINCT user_id) as count FROM user_group_access`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM users WHERE created_at >= NOW() - INTERVAL '30 days'`),
      query<{ role: string; count: string }>(`SELECT role, COUNT(*) as count FROM users GROUP BY role ORDER BY count DESC`),
    ]);

    const totalUsersCount = parseInt(totalUsers[0]?.count || '0');
    const withAccessCount = parseInt(usersWithAccess[0]?.count || '0');

    // ── Request Stats ──
    const [
      totalRequests,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
      requestsLast7Days,
      requestsLast30Days,
    ] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM access_requests`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM access_requests WHERE status = 'pending'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM access_requests WHERE status = 'approved'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM access_requests WHERE status = 'rejected'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM access_requests WHERE created_at >= NOW() - INTERVAL '7 days'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM access_requests WHERE created_at >= NOW() - INTERVAL '30 days'`),
    ]);

    // ── Price Groups & Images ──
    const [
      totalGroups,
      activeGroups,
      totalImages,
      imagesLast7Days,
      imagesLast30Days,
      groupsUsage,
    ] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM price_groups`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM price_groups WHERE is_active = true`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM price_group_images`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM price_group_images WHERE created_at >= NOW() - INTERVAL '7 days'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM price_group_images WHERE created_at >= NOW() - INTERVAL '30 days'`),
      query<{ group_id: string; group_name: string; user_count: string; image_count: string }>(
        `SELECT pg.id as group_id, pg.name as group_name,
          (SELECT COUNT(*) FROM user_group_access uga WHERE uga.price_group_id = pg.id) as user_count,
          (SELECT COUNT(*) FROM price_group_images pgi WHERE pgi.price_group_id = pg.id) as image_count
         FROM price_groups pg
         WHERE pg.is_active = true
         ORDER BY user_count DESC, pg.sort_order`
      ),
    ]);

    // ── Announcements ──
    const [totalAnnouncements, publishedAnnouncements] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM announcements`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM announcements WHERE is_published = true`),
    ]);

    // ── Activity Logs ──
    const [
      totalLogs,
      logsLast7Days,
      logsLast30Days,
      loginCount,
      uploadCount,
      topActiveUsers,
    ] = await Promise.all([
      query<{ count: string }>(`SELECT COUNT(*) as count FROM user_logs`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM user_logs WHERE created_at >= NOW() - INTERVAL '7 days'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM user_logs WHERE created_at >= NOW() - INTERVAL '30 days'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM user_logs WHERE action = 'login'`),
      query<{ count: string }>(`SELECT COUNT(*) as count FROM user_logs WHERE action = 'upload_image'`),
      query<{ user_id: string; user_name: string; activity_count: string }>(
        `SELECT ul.user_id, u.name as user_name, COUNT(*) as activity_count
         FROM user_logs ul
         JOIN users u ON u.id = ul.user_id
         WHERE ul.created_at >= NOW() - INTERVAL '30 days'
         GROUP BY ul.user_id, u.name
         ORDER BY activity_count DESC
         LIMIT 10`
      ),
    ]);

    // ── ผู้ใช้เรียงตามกิจกรรมล่าสุด (น้อยสุดก่อน) ──
    const leastActiveUsers = await query<{
      id: string; name: string; email: string; shop_name: string;
      last_activity: string | null; days_inactive: string;
    }>(
      `SELECT u.id, u.name, u.email, u.shop_name,
        last_log.last_activity,
        CASE
          WHEN last_log.last_activity IS NOT NULL
            THEN EXTRACT(DAY FROM NOW() - last_log.last_activity)::INT
          ELSE NULL
        END as days_inactive
       FROM users u
       LEFT JOIN (
         SELECT user_id, MAX(created_at) as last_activity
         FROM user_logs
         GROUP BY user_id
       ) last_log ON last_log.user_id = u.id
       WHERE u.is_active = true
       ORDER BY last_log.last_activity ASC NULLS FIRST
       LIMIT 20`
    );

    const totalGroupsCount = parseInt(totalGroups[0]?.count || '0');
    const activeGroupsCount = parseInt(activeGroups[0]?.count || '0');
    const totalRequestsCount = parseInt(totalRequests[0]?.count || '0');
    const approvedCount = parseInt(approvedRequests[0]?.count || '0');
    const rejectedCount = parseInt(rejectedRequests[0]?.count || '0');

    const result = {
      users: {
        total: totalUsersCount,
        active: parseInt(activeUsers[0]?.count || '0'),
        inactive: parseInt(inactiveUsers[0]?.count || '0'),
        withAccess: withAccessCount,
        withoutAccess: totalUsersCount - withAccessCount,
        newLast7Days: parseInt(newUsersLast7Days[0]?.count || '0'),
        newLast30Days: parseInt(newUsersLast30Days[0]?.count || '0'),
        byRole: usersByRole.map(r => ({ role: r.role, count: parseInt(r.count) })),
      },
      requests: {
        total: totalRequestsCount,
        pending: parseInt(pendingRequests[0]?.count || '0'),
        approved: approvedCount,
        rejected: rejectedCount,
        last7Days: parseInt(requestsLast7Days[0]?.count || '0'),
        last30Days: parseInt(requestsLast30Days[0]?.count || '0'),
      },
      priceGroups: {
        total: totalGroupsCount,
        active: activeGroupsCount,
        inactive: totalGroupsCount - activeGroupsCount,
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
        unpublished: parseInt(totalAnnouncements[0]?.count || '0') - parseInt(publishedAnnouncements[0]?.count || '0'),
      },
      activity: {
        totalLogs: parseInt(totalLogs[0]?.count || '0'),
        last7Days: parseInt(logsLast7Days[0]?.count || '0'),
        last30Days: parseInt(logsLast30Days[0]?.count || '0'),
        loginCount: parseInt(loginCount[0]?.count || '0'),
        uploadCount: parseInt(uploadCount[0]?.count || '0'),
        topUsers: topActiveUsers.map(u => ({
          userId: u.user_id,
          userName: u.user_name,
          activityCount: parseInt(u.activity_count),
        })),
      },
      leastActiveUsers: leastActiveUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        shopName: u.shop_name,
        lastActivity: u.last_activity,
        daysInactive: u.days_inactive ? parseInt(u.days_inactive) : null,
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
