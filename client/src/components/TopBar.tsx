"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import {
  Bell,
  Search,
  Sparkles,
  MessageSquare,
  FileText,
  Award,
  CheckCircle2,
  X,
  Clock,
} from "lucide-react";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

export default function TopBar({
  title,
  userName = "Aarav Sharma",
  userRole = "Student",
}: {
  title: string;
  userName?: string;
  userRole?: string;
}) {
  const { user } = useAuth();
  const router = useRouter();

  const displayName = user?.name || userName;
  const displayRole = user?.role || userRole;

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  // Notification State
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get<{
        notifications: NotificationItem[];
        unreadCount: number;
      }>("/api/notifications");
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (e) {
      // Non-fatal
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Polling fallback
    const interval = setInterval(fetchNotifications, 10000);

    // Socket listener
    try {
      const socket = getSocket();
      socket.on("notification", (notif: any) => {
        setNotifications((prev) => [
          {
            _id: String(Date.now()),
            type: notif.type || "chat_message",
            title: notif.title || "Notification",
            message: notif.message || "",
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...prev,
        ]);
        setUnreadCount((prev) => prev + 1);
      });

      return () => {
        clearInterval(interval);
        socket.off("notification");
      };
    } catch (err) {
      return () => clearInterval(interval);
    }
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      // Non-fatal
    }
  };

  const handleClickNotification = async (item: NotificationItem) => {
    try {
      await api.post(`/api/notifications/${item._id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (item.link) {
        setShowDropdown(false);
        router.push(item.link);
      }
    } catch (e) {
      // Non-fatal
    }
  };

  return (
    <header className="h-16 sm:h-20 bg-transparent flex items-center justify-between px-3 sm:px-6 lg:px-8 shrink-0 mt-14 md:mt-0 relative z-30 font-sans">
      {/* Title / Current View */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div>
          <h1 className="text-lg sm:text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2 truncate">
            <span className="truncate">{title}</span>
          </h1>
          <p className="text-xs text-slate-400 font-bold hidden sm:block truncate uppercase tracking-wider">
            Vidya Bharati School Portal
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0 relative">
        {/* Neumorphic Inset Search Bar */}
        <div className="relative hidden lg:block">
          <Search
            size={15}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search subjects, assignments..."
            className="neu-input !pl-10 pr-4 py-2 text-xs w-48 xl:w-64 rounded-full transition-all focus:w-72 font-medium"
          />
        </div>

        {/* AI Quick Status Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 neu-pill text-xs font-bold text-indigo-700 bg-[#edf2f7]">
          <Sparkles size={13} className="text-indigo-500" />
          <span>Semester 1 • Active</span>
        </div>

        {/* Neumorphic Circular Notification Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative neu-circle w-9 h-9 sm:w-10 sm:h-10 text-slate-600 hover:text-indigo-600 cursor-pointer flex items-center justify-center shrink-0"
            aria-label={`${unreadCount} new notifications`}
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showDropdown && (
            <div className="absolute right-0 top-12 w-80 sm:w-96 neu-card p-4 space-y-3 z-50 animate-fadeIn shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Notifications
                  </h3>
                  {unreadCount > 0 && (
                    <span className="neu-pill px-2 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-50">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowDropdown(false)}
                    className="text-slate-400 hover:text-slate-700 p-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => handleClickNotification(n)}
                    className={`p-3 rounded-xl transition-all cursor-pointer ${
                      n.read
                        ? "neu-card-sm text-slate-600 opacity-80 hover:opacity-100"
                        : "neu-card-sm border-indigo-200/80 bg-indigo-50/30 text-slate-900 font-bold"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-lg neu-inset flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                        {n.type === "chat_message" ? (
                          <MessageSquare size={13} />
                        ) : n.type === "assignment" ? (
                          <FileText size={13} />
                        ) : (
                          <Award size={13} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-[9px] text-slate-400 font-medium mt-1 block">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-xs font-medium">
                    No notifications yet. You&apos;re all caught up!
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Capsule */}
        <Link
          href="/profile"
          className="flex items-center gap-2.5 pl-1.5 py-1 pr-1.5 sm:pr-3.5 neu-pill bg-[#edf2f7] cursor-pointer transition-all hover:scale-[1.02] active:scale-95 text-left group shrink-0"
          title="Click to open your full profile information page"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-black text-white shadow-xs group-hover:shadow-md transition-shadow">
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-extrabold text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">
              {displayName}
            </p>
            <p className="text-[10px] text-slate-400 font-bold leading-tight uppercase tracking-wider">
              {displayRole}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
