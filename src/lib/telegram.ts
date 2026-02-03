const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export async function sendPhoto(
  chatId: string,
  photoUrl: string,
  caption?: string
): Promise<TelegramResult> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'Telegram bot token not configured' };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    
    if (data.ok) {
      return { success: true, messageId: data.result.message_id };
    } else {
      return { success: false, error: data.description };
    }
  } catch (error) {
    console.error('Telegram send error:', error);
    return { success: false, error: 'Failed to send to Telegram' };
  }
}

export async function sendPhotoFile(
  chatId: string,
  photoBuffer: Buffer,
  fileName: string,
  caption?: string
): Promise<TelegramResult> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'Telegram bot token not configured' };
  }

  try {
    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', new Blob([new Uint8Array(photoBuffer)]), fileName);
    if (caption) {
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
    }

    const response = await fetch(`${TELEGRAM_API_URL}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    
    if (data.ok) {
      return { success: true, messageId: data.result.message_id };
    } else {
      return { success: false, error: data.description };
    }
  } catch (error) {
    console.error('Telegram send error:', error);
    return { success: false, error: 'Failed to send to Telegram' };
  }
}

export async function sendMessage(
  chatId: string,
  text: string
): Promise<TelegramResult> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'Telegram bot token not configured' };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();
    
    if (data.ok) {
      return { success: true, messageId: data.result.message_id };
    } else {
      return { success: false, error: data.description };
    }
  } catch (error) {
    console.error('Telegram send error:', error);
    return { success: false, error: 'Failed to send to Telegram' };
  }
}
