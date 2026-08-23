import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../utils/supabaseServices';

const getExtras = (userId) => {
  try {
    const raw = localStorage.getItem('eron_profile_extras');
    const map = raw ? JSON.parse(raw) : {};
    return map[userId] || { username: '', phone: '', avatar: '' };
  } catch {
    return { username: '', phone: '', avatar: '' };
  }
};

const TopBar = ({
  panel,
  searchQuery,
  setSearchQuery,
  setPanel,
  clients = [],
  tasks = [],
  candidates = [],
  leads = [],
  usersList = [],
  onSelectClient,
  onSelectTask,
  onSelectCandidate,
  onOpenProfile,
  onToggleSidebar
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifLoading, setNotifLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [avatar, setAvatar] = useState('');
  const unreadCount = notifications.length;
  const btnRef = React.useRef(null);
  const menuRef = React.useRef(null);

  useEffect(() => {
    const loadExtras = () => {
      const extras = getExtras(user?.id);
      setAvatar(extras.avatar || '');
    };

    loadExtras();

    // Listen for custom event for immediate updates
    const handleProfileUpdate = () => loadExtras();
    window.addEventListener('eron_profile_update', handleProfileUpdate);

    // Also listen for storage events (cross-tab)
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('eron_profile_update', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [user?.id]);

  // Load notifications (unread) and poll
  useEffect(() => {
    let timer;
    const load = async () => {
      try {
        setNotifLoading(true);
        const res = await notificationsAPI.list({ only_unread: 1, limit: 10 });
        setNotifications(Array.isArray(res.data) ? res.data : (res.data?.items || []));
      } catch (e) {
        // fail silently; server may return [] if table not present
        setNotifications([]);
      } finally {
        setNotifLoading(false);
      }
    };
    load();
    // Poll faster so new notifications show up quickly
    timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, []);

  // Refresh list when opening dropdown
  useEffect(() => {
    const loadIfOpen = async () => {
      if (!notifOpen) return;
      try {
        setNotifLoading(true);
        const res = await notificationsAPI.list({ only_unread: 1, limit: 10 });
        setNotifications(Array.isArray(res.data) ? res.data : (res.data?.items || []));
      } catch {
        setNotifications([]);
      } finally {
        setNotifLoading(false);
      }
    };
    loadIfOpen();
  }, [notifOpen]);

  // Refresh when window gains focus or tab becomes visible
  useEffect(() => {
    const load = async () => {
      try {
        const res = await notificationsAPI.list({ only_unread: 1, limit: 10 });
        setNotifications(Array.isArray(res.data) ? res.data : (res.data?.items || []));
      } catch {
        setNotifications([]);
      }
    };
    const onFocus = () => load();
    const onVisibility = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Close dropdown on outside click and Escape key
  useEffect(() => {
    const onDocClick = (e) => {
      if (!notifOpen) return;
      const btn = btnRef.current;
      const menu = menuRef.current;
      if (btn && btn.contains(e.target)) return;
      if (menu && menu.contains(e.target)) return;
      setNotifOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setNotifOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [notifOpen]);

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) => prev.filter((n) => String(n.id) !== String(id)));
    } catch { }
  };

  const markAllRead = async () => {
    const ids = notifications.map((n) => n.id);
    for (const id of ids) {
      try { await notificationsAPI.markRead(id); } catch { }
    }
    setNotifications([]);
  };

  const suggestions = useMemo(() => {
    const q = (searchQuery || '').trim().toLowerCase();
    if (!q) return [];

    const match = (txt) => (txt || '').toString().toLowerCase().includes(q);

    const clientItems = clients
      .filter(c => match(c.name) || match(c.contact) || match(c.email))
      .slice(0, 5)
      .map(c => ({ type: 'client', id: c.id, title: c.name, subtitle: c.contact || c.email }));

    const taskItems = tasks
      .filter(t => match(t.title) || match(t.description))
      .slice(0, 5)
      .map(t => ({ type: 'task', id: t.id, title: t.title, subtitle: t.status }));

    const candidateItems = candidates
      .filter(cd => match(cd.name) || match(cd.position))
      .slice(0, 5)
      .map(cd => ({ type: 'candidate', id: cd.id, title: cd.name, subtitle: cd.position }));

    const leadItems = leads
      .filter(l => match(l.name) || match(l.contact) || match(l.email))
      .slice(0, 5)
      .map(l => ({ type: 'lead', id: l.id, title: l.name, subtitle: l.source || l.email }));

    const userItems = usersList
      .filter(u => match(u.name) || match(u.email) || match(u.role))
      .slice(0, 5)
      .map(u => ({ type: 'user', id: u.id, title: u.name, subtitle: u.email }));

    return [
      ...clientItems,
      ...taskItems,
      ...candidateItems,
      ...leadItems,
      ...userItems
    ].slice(0, 10);
  }, [searchQuery, clients, tasks, candidates, leads, usersList]);

  const handleSelectSuggestion = (item) => {
    if (!item) return;
    switch (item.type) {
      case 'client':
        setPanel && setPanel('clients');
        onSelectClient && onSelectClient(clients.find(c => c.id === item.id) || null);
        break;
      case 'task':
        setPanel && setPanel('tasks');
        onSelectTask && onSelectTask(tasks.find(t => t.id === item.id) || null);
        break;
      case 'candidate':
        setPanel && setPanel('recruitment');
        onSelectCandidate && onSelectCandidate(candidates.find(cd => cd.id === item.id) || null);
        break;
      case 'lead':
        setPanel && setPanel('leads');
        break;
      case 'user':
        setPanel && setPanel('users');
        break;
      default:
        break;
    }
    setShowSuggestions(false);
  };

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPanelTitle = () => {
    switch (panel) {
      case 'dashboard':
        return 'Overview';
      case 'clients':
        return 'Client Management';
      case 'deals':
        return 'Sales Pipeline';
      case 'tasks':
        return 'Task Board';
      case 'recruitment':
        return 'Recruitment';
      default:
        return panel.charAt(0).toUpperCase() + panel.slice(1);
    }
  };

  return (
    <div className="sticky top-4 z-30 px-4 mb-4">
      <div className="h-16 rounded-3xl bg-white/90 dark:bg-brand-black/90 backdrop-blur-xl border border-white/20 shadow-sm flex items-center px-4 transition-all">
        <div className="flex-1 flex items-center justify-between">
          {/* Left side - Title and welcome */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onToggleSidebar && onToggleSidebar()}
              className="md:hidden p-2.5 rounded-xl bg-brand-grey/5 hover:bg-brand-grey/10 text-brand-black dark:text-brand-white transition-colors"
            >
              <Icon icon="mdi:menu" className="w-5 h-5" />
            </button>

            <div className="hidden md:block">
              <h2 className="text-lg font-bold text-brand-black dark:text-brand-white tracking-tight">{getPanelTitle()}</h2>
            </div>
          </div>

          {/* Right side - Search, notifications, user */}
          <div className="flex items-center gap-4 md:gap-6">
            {/* Global Search */}
            <div className="relative hidden md:block group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon icon="mdi:magnify" className="w-5 h-5 text-brand-grey group-focus-within:text-brand-orange transition-colors" />
              </div>
              <input
                id="globalSearch"
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search anything..."
                className="pl-11 pr-12 py-3 w-64 lg:w-80 bg-brand-grey/5 hover:bg-brand-grey/10 focus:bg-white dark:focus:bg-brand-black rounded-2xl border border-transparent focus:border-brand-orange/20 focus:ring-4 focus:ring-brand-orange/5 text-sm font-medium transition-all"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <span className="text-[10px] font-bold text-brand-grey/50 bg-white dark:bg-brand-black px-2 py-1 rounded-lg border border-brand-grey/10">⌘K</span>
              </div>

              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute mt-4 w-full bg-white dark:bg-brand-black rounded-2xl shadow-xl border border-brand-grey/10 overflow-hidden z-50">
                  <ul className="max-h-80 overflow-auto py-2">
                    {suggestions.map((s, idx) => (
                      <li
                        key={`${s.type}-${s.id}-${idx}`}
                        className="px-4 py-3 cursor-pointer hover:bg-brand-grey/5 flex items-center gap-3 transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSuggestion(s)}
                      >
                        <div className="p-2 rounded-full bg-brand-orange/10 text-brand-orange">
                          <Icon icon={
                            s.type === 'client' ? 'mdi:account' :
                              s.type === 'task' ? 'mdi:checkbox-marked-circle-outline' :
                                'mdi:circle-small'
                          } className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-brand-black dark:text-brand-white">{s.title}</div>
                          {s.subtitle && <div className="text-xs text-brand-grey">{s.subtitle}</div>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                ref={btnRef}
                onClick={() => setNotifOpen((o) => !o)}
                className={`relative p-3 rounded-2xl transition-all ${notifOpen ? 'bg-brand-orange/10 text-brand-orange' : 'bg-brand-grey/5 text-brand-grey hover:bg-brand-grey/10 hover:text-brand-black dark:hover:text-brand-white'}`}
                title="Notifications"
              >
                <Icon icon={notifOpen ? "mdi:bell" : "mdi:bell-outline"} className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-brand-black animate-pulse"></span>
                )}
              </button>
              {notifOpen && (
                <>
                  {/* Mobile Backdrop */}
                  <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setNotifOpen(false)}
                  />

                  {/* Dropdown / Modal */}
                  <div
                    ref={menuRef}
                    className="fixed inset-x-4 top-24 bottom-auto max-h-[70vh] md:absolute md:inset-auto md:right-0 md:top-full md:mt-4 md:w-96 md:max-h-none bg-white dark:bg-brand-black rounded-3xl shadow-2xl md:shadow-xl border border-brand-grey/10 overflow-hidden z-50 flex flex-col origin-top-right animate-in fade-in zoom-in-95 duration-200"
                  >
                    <div className="flex items-center justify-between px-6 py-4 border-b border-brand-grey/10 shrink-0 bg-white/50 dark:bg-brand-black/50 backdrop-blur-sm">
                      <div className="font-bold text-base flex items-center gap-2">
                        <span>Notifications</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-brand-orange text-white text-[10px] font-bold shadow-sm shadow-brand-orange/20">
                            {unreadCount} NEW
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={markAllRead} className="text-xs font-bold text-brand-grey hover:text-brand-orange transition-colors px-2 py-1 rounded-lg hover:bg-brand-orange/5">
                          MARK ALL READ
                        </button>
                        <button
                          onClick={() => setNotifOpen(false)}
                          className="md:hidden p-1.5 rounded-full hover:bg-brand-grey/10 text-brand-grey transition-colors"
                        >
                          <Icon icon="mdi:close" className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 md:max-h-[28rem] overscroll-contain p-2">
                      {notifLoading && (
                        <div className="p-8 text-center text-xs text-brand-grey flex flex-col items-center gap-3">
                          <div className="w-10 h-10 rounded-full border-2 border-brand-grey/20 border-t-brand-orange animate-spin" />
                          <span>Loading updates...</span>
                        </div>
                      )}
                      {!notifLoading && notifications.length === 0 && (
                        <div className="p-12 text-center flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-brand-grey/5 flex items-center justify-center text-brand-grey/30">
                            <Icon icon="mdi:bell-sleep-outline" className="w-8 h-8" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-brand-black dark:text-brand-white">All caught up!</div>
                            <div className="text-xs text-brand-grey mt-1">No new notifications at the moment.</div>
                          </div>
                        </div>
                      )}
                      {notifications.map((n) => (
                        <div key={n.id} className="group p-3 rounded-2xl hover:bg-brand-grey/5 transition-all flex items-start gap-3 cursor-pointer relative mb-1">
                          <div className="w-10 h-10 rounded-full bg-brand-orange/10 text-brand-orange flex items-center justify-center shrink-0">
                            <Icon icon="mdi:bell" className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="text-sm font-bold text-brand-black dark:text-brand-white truncate pr-8">{n.title || 'Notification'}</div>
                            {n.message && <div className="text-xs text-brand-grey line-clamp-2 mt-0.5 leading-relaxed">{n.message}</div>}
                            {n.created_at && (
                              <div className="text-[10px] font-medium text-brand-grey/60 mt-2 flex items-center gap-1.5">
                                <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                                {new Date(n.created_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); markRead(n.id); }}
                            className="absolute top-3 right-3 p-2 rounded-full text-brand-grey/40 hover:text-brand-orange hover:bg-white dark:hover:bg-brand-black shadow-sm opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100"
                            title="Mark as read"
                          >
                            <Icon icon="mdi:check" className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Profile */}
            <div
              onClick={() => {
                if (onOpenProfile) onOpenProfile();
              }}
              className="flex items-center gap-3 pl-3 md:pl-4 border-l border-brand-grey/10 cursor-pointer group"
            >
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-brand-black dark:text-brand-white group-hover:text-brand-orange transition-colors">{user?.name}</div>
                <div className="text-[10px] font-bold text-brand-grey uppercase tracking-wider">{user?.role?.replace('_', ' ')}</div>
              </div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-2xl bg-gradient-to-br from-brand-black to-brand-grey text-white flex items-center justify-center shadow-lg shadow-brand-black/10 group-hover:shadow-brand-orange/20 group-hover:scale-105 transition-all duration-300 overflow-hidden border-2 border-white dark:border-brand-black">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
