'use client';

import { useState, useEffect } from 'react';
import { Megaphone, X, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Announcement } from '@/types';

export default function AnnouncementPopup() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnreadAnnouncement();
  }, []);

  const fetchUnreadAnnouncement = async () => {
    try {
      const response = await fetch('/api/announcements/unread');
      if (!response.ok) {
        setLoading(false);
        return;
      }

      const data = await response.json();
      if (data.announcements && data.announcements.length > 0) {
        const unreadAnnouncement = data.announcements[0];
        
        const dismissedKey = `announcement-dismissed-${unreadAnnouncement.id}`;
        const isDismissed = localStorage.getItem(dismissedKey);
        
        if (!isDismissed) {
          setAnnouncement(unreadAnnouncement);
          setTimeout(() => setShow(true), 1000);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch unread announcements:', error);
      setLoading(false);
    }
  };

  const handleMarkAsRead = async () => {
    if (!announcement) return;

    try {
      await fetch(`/api/announcements/${announcement.id}/mark-read`, {
        method: 'POST',
      });
      
      localStorage.setItem(`announcement-dismissed-${announcement.id}`, 'true');
      setShow(false);
    } catch (error) {
      console.error('Failed to mark announcement as read:', error);
      setShow(false);
    }
  };

  const handleDismiss = () => {
    if (!announcement) return;
    localStorage.setItem(`announcement-dismissed-${announcement.id}`, 'true');
    setShow(false);
  };

  if (loading || !announcement || !show) return null;

  const bodyPreview = announcement.body 
    ? announcement.body.length > 150 
      ? announcement.body.substring(0, 150) + '...' 
      : announcement.body
    : '';

  return (
    <div className="fixed top-20 left-4 right-4 z-50 md:left-auto md:right-4 md:w-[420px] animate-slide-in-right">
      <div className="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-violet-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-white text-sm">ประกาศใหม่</h3>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Image if available */}
          {announcement.image_path && (
            <div className="mb-3 rounded-lg overflow-hidden">
              <Image
                src={`/api/files${announcement.image_path}`}
                alt={announcement.title}
                width={400}
                height={200}
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          {/* Title */}
          <h4 className="font-bold text-gray-900 mb-2 text-base">
            {announcement.title}
          </h4>

          {/* Body Preview */}
          {bodyPreview && (
            <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">
              {bodyPreview}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              href={`/announcements/${announcement.id}`}
              onClick={handleMarkAsRead}
              className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
            >
              <span>อ่านเพิ่มเติม</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <button
              onClick={handleMarkAsRead}
              className="px-4 py-2 bg-white text-purple-700 text-sm font-medium rounded-lg border border-purple-300 hover:bg-purple-50 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
