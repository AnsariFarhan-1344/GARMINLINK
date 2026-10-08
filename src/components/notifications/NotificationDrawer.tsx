import React, { useState } from 'react';
import { useLogistics } from '../../context/LogisticsContext';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Truck, 
  Sparkles, 
  MapPin, 
  RotateCcw, 
  Layers, 
  Clock,
  ArrowRight
} from 'lucide-react';
import { NotificationItem } from '../../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationRead } = useLogistics();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');

  if (!isOpen) return null;

  const filteredNotifs = filter === 'UNREAD' 
    ? notifications.filter(n => !n.isRead) 
    : notifications;

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'TRANSPORTER_ASSIGNED':
      case 'VEHICLE_NEARBY':
        return <Truck className="w-4 h-4 text-forest" />;
      case 'RETURN_LOAD':
        return <RotateCcw className="w-4 h-4 text-saffron" />;
      case 'POOL_MATCH':
      case 'NEW_OPPORTUNITY':
        return <Sparkles className="w-4 h-4 text-forest" />;
      case 'DELIVERED':
        return <CheckCheck className="w-4 h-4 text-forest" />;
      default:
        return <Bell className="w-4 h-4 text-forest" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-navy/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-rural-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-rural-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-soft-green text-forest border border-forest/20">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-navy">Notifications & Updates</h3>
                <p className="text-xs text-rural-muted">Live dispatch alerts, vehicles & return trips</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-rural-muted hover:text-navy hover:bg-cream transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="px-4 py-2.5 bg-cream/50 border-b border-rural-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filter === 'ALL' ? 'bg-forest text-white shadow-xs' : 'text-rural-muted hover:text-navy'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('UNREAD')}
                className={`px-3 py-1 rounded-lg font-bold transition ${
                  filter === 'UNREAD' ? 'bg-forest text-white shadow-xs' : 'text-rural-muted hover:text-navy'
                }`}
              >
                Unread ({notifications.filter(n => !n.isRead).length})
              </button>
            </div>

            <button
              onClick={() => notifications.forEach(n => markNotificationRead(n.id))}
              className="text-forest hover:text-forest-deep font-bold"
            >
              Mark all read
            </button>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredNotifs.length === 0 ? (
              <div className="text-center py-12 text-rural-muted">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No notifications to show</p>
              </div>
            ) : (
              filteredNotifs.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer ${
                    notif.isRead
                      ? 'bg-cream/40 border-rural-border text-navy'
                      : 'bg-soft-green/60 border-forest/40 text-navy shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-white border border-rural-border shrink-0 mt-0.5 shadow-xs">
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-bold text-navy truncate">{notif.title}</h4>
                        <span className="text-[10px] text-rural-muted font-mono shrink-0 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {notif.timestamp}
                        </span>
                      </div>
                      <p className="text-xs text-rural-muted mt-1 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
