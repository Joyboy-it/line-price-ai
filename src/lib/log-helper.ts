import { logAction } from './auth';
import { NextRequest } from 'next/server';

export function getIpFromRequest(request: NextRequest): string | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  
  return null;
}

export async function logActionWithIp(
  request: NextRequest,
  userId: string,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, unknown>
) {
  const ipAddress = getIpFromRequest(request);
  const userAgent = request.headers.get('user-agent');
  
  await logAction(userId, action, entityType, entityId, details, ipAddress, userAgent);
}
