import webpush from 'web-push';
import { query } from './db';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushSubscriptionRecord {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  groupId?: string;
}

export async function sendPushNotification(
  subscription: PushSubscriptionRecord,
  payload: PushPayload
): Promise<{ success: boolean; error?: unknown }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { success: true };
  } catch (error: unknown) {
    console.error('Push notification error:', error);

    const err = error as { statusCode?: number };
    if (err.statusCode === 410 || err.statusCode === 404) {
      await query(
        'UPDATE push_subscriptions SET is_active = false, updated_at = NOW() WHERE id = $1',
        [subscription.id]
      );
    }

    return { success: false, error };
  }
}

export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ total: number; success: number }> {
  if (userIds.length === 0) return { total: 0, success: 0 };

  const subscriptions = await query<PushSubscriptionRecord>(
    `SELECT * FROM push_subscriptions 
     WHERE user_id = ANY($1) AND is_active = true`,
    [userIds]
  );

  if (subscriptions.length === 0) return { total: 0, success: 0 };

  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length;

  console.log(`Push notifications sent: ${successCount}/${subscriptions.length}`);

  return { total: subscriptions.length, success: successCount };
}

export async function sendAnnouncementNotification(
  announcementId: string,
  title: string,
  body: string
): Promise<{ total: number; success: number }> {
  // Get all users with access (approved users)
  const users = await query<{ user_id: string }>(
    `SELECT DISTINCT user_id FROM user_group_access`
  );

  if (users.length === 0) return { total: 0, success: 0 };

  const userIds = users.map(u => u.user_id);
  const bodyPreview = body && body.length > 100 ? body.substring(0, 100) + '...' : body || '';

  const payload: PushPayload = {
    title: `ประกาศใหม่: ${title}`,
    body: bodyPreview,
    url: `/announcements/${announcementId}`,
  };

  return sendPushToUsers(userIds, payload);
}
