// LINE Messaging API helper functions
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

export interface LineMessageResult {
  success: boolean;
  error?: string;
}

/**
 * ส่งข้อความไปยัง LINE Group
 * @param groupId LINE Group ID
 * @param message ข้อความที่ต้องการส่ง
 */
export async function sendLineMessage(
  groupId: string,
  message: string
): Promise<LineMessageResult> {
  if (!LINE_CHANNEL_ACCESS_TOKEN) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not configured');
    return { success: false, error: 'LINE token not configured' };
  }

  if (!groupId) {
    return { success: false, error: 'Group ID is required' };
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        to: groupId,
        messages: [
          {
            type: 'text',
            text: message,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('LINE API error:', errorData);
      return { 
        success: false, 
        error: `LINE API error: ${response.status} ${response.statusText}` 
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending LINE message:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * สร้างข้อความแจ้งเตือนอัพเดทราคา
 * @param groupName ชื่อกลุ่มราคา
 */
export function createPriceUpdateMessage(groupName: string): string {
  const now = new Date();
  
  // Format date: DD/MM/YYYY
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = (now.getFullYear() + 543).toString(); // Thai Buddhist year
  const dateStr = `${day}/${month}/${year}`;
  
  // Format time: HH:MM
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;
  
  return `📢 อัพเดทราคาวันที่ ${dateStr} ${timeStr}\n\n📸 ${groupName}`;
}
