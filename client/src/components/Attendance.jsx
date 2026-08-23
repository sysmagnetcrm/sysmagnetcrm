import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import Toast from './Toast';
import { attendanceAPI } from '../utils/supabaseServices';
import { useAuth } from '../context/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isEligible, setIsEligible] = useState(false);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const [code, setCode] = useState('');
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeLoading, setAdminCodeLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ date: '', check_in: '', check_out: '', hours_worked: '' });
  const [adminSearch, setAdminSearch] = useState('');

  const OFFICE_LAT = 10.003006;
  const OFFICE_LONG = 76.306523;

  useEffect(() => {
    checkTodayAttendance();
    requestLocation();
    // update code expiry countdown every second (5-minute rotation)
    const tick = setInterval(() => {
      const now = Date.now();
      const windowMs = 5 * 60 * 1000;
      const nextWinTs = Math.ceil(now / windowMs) * windowMs;
      const delta = Math.max(0, Math.floor((nextWinTs - now) / 1000));
      setCodeExpiresIn(delta);
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  // Admin: load current code and refresh periodically
  useEffect(() => {
    const isAdmin = ['admin', 'hr', 'support'].includes(user?.role);
    if (!isAdmin) return;
    let cancelled = false;
    const load = async () => {
      try {
        setAdminCodeLoading(true);
        const res = await attendanceAPI.getCode();
        if (!cancelled) setAdminCode(res?.data?.code || '');
      } catch (e) {
        if (!cancelled) setAdminCode('');
      } finally {
        if (!cancelled) setAdminCodeLoading(false);
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [user?.role]);

  // Admin: load attendance logs
  const loadLogs = async () => {
    try {
      setLogsLoading(true);
      setLogsError(null);
      const params = { limit: pageSize, offset: page * pageSize };
      if (adminSearch.trim()) params.user_name = adminSearch.trim();
      const res = await attendanceAPI.getAll(params);
      let data = [];
      if (Array.isArray(res?.data)) {
        data = res.data;
      } else if (res?.data && typeof res.data === 'object') {
        if (Array.isArray(res.data.data)) data = res.data.data;
        else if (Array.isArray(res.data.items)) data = res.data.items;
        else if (Array.isArray(res.data.logs)) data = res.data.logs;
      }
      setLogs(data);
    } catch (e) {
      const status = e?.response?.status;
      let msg = 'Failed to load attendance logs';
      if (status === 401) msg = 'Unauthorized: please log in again.';
      else if (status === 403) msg = 'Access denied: Admin/HR/Support role required.';
      else if (status === 503) msg = 'Server auth not configured. Please configure Supabase on the server and restart.';
      else if (e?.response?.data?.error) msg = e.response.data.error;
      setLogsError(msg);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (['admin', 'hr', 'support'].includes(user?.role)) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, page]);

  // Debounce search
  useEffect(() => {
    if (!['admin', 'hr', 'support'].includes(user?.role)) return;
    const id = setTimeout(() => { setPage(0); loadLogs(); }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminSearch]);

  const addToast = (message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts(prev => [...prev, { id, title: message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleCodeCheckIn = async (e) => {
    e.preventDefault();
    const trimmed = String(code || '').replace(/\D/g, '').slice(0, 6);
    if (trimmed.length !== 6) {
      addToast('Enter a valid 6-digit code', 'error');
      return;
    }
    try {
      setCodeSubmitting(true);
      const res = await attendanceAPI.checkInWithCode(trimmed);
      addToast(res.data?.message || 'Check-in successful', 'success');
      setCode('');
      checkTodayAttendance();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Invalid or expired code';
      addToast(msg, 'error');
    } finally {
      setCodeSubmitting(false);
    }
  };

  const checkTodayAttendance = async () => {
    try {
      const { data } = await attendanceAPI.getToday();
      setAttendanceStatus(data);
    } catch (error) {
      addToast('Unable to load today\'s attendance right now', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    setCheckingLocation(true);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setCheckingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ latitude, longitude });
        await checkLocationEligibility(latitude, longitude);
        setCheckingLocation(false);
      },
      (error) => {
        let errorMessage = 'Unable to get your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        setLocationError(errorMessage);
        addToast(errorMessage, 'warning');
        setCheckingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const checkLocationEligibility = async (lat, long) => {
    try {
      const { data } = await attendanceAPI.checkLocation(lat, long);
      setIsEligible(data.eligible);
      if (!data.eligible) {
        addToast(`You are ${data.distance}m away. Must be within ${data.maxDistance}m of office.`, 'warning');
      }
    } catch (error) {
      addToast('Failed to verify location', 'error');
    }
  };

  const handleMarkAttendance = async (type) => {
    if (!location) {
      addToast('Please enable location services', 'error');
      return;
    }

    if (!isEligible) {
      addToast('You must be at the office location to mark attendance', 'error');
      return;
    }

    try {
      const { data } = await attendanceAPI.mark(type, { latitude: location.latitude, longitude: location.longitude });
      addToast(data.message || `${type === 'check-in' ? 'Check-in' : 'Check-out'} successful`, 'success');
      if (type === 'check-out' && data.hoursWorked) {
        addToast(`Hours worked today: ${data.hoursWorked}`, 'info');
      }
      // Refresh attendance status
      checkTodayAttendance();
    } catch (error) {
      console.error('Error marking attendance:', error);
      const msg = error?.response?.data?.error || error.message || 'Failed to mark attendance';
      addToast(msg, 'error');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c); // Distance in meters
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="soft-card p-6">
        <h2 className="text-2xl font-bold text-brand-black dark:text-brand-white">Attendance</h2>
        <p className="mt-1 text-brand-grey">Mark your attendance when you're at the office location</p>
      </div>

      {/* Location Status */}
      <div className="soft-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-brand-black dark:text-brand-white">Location Status</h3>
          <button
            onClick={requestLocation}
            disabled={checkingLocation}
            className="soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 px-4 py-2 text-sm"
          >
            <Icon icon="mdi:map-marker-radius" className="w-4 h-4" />
            {checkingLocation ? 'Checking...' : 'Refresh Location'}
          </button>
        </div>

        {locationError ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-bold text-red-900 dark:text-red-200">Location Error</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{locationError}</p>
              </div>
            </div>
          </div>
        ) : location ? (
          <div
            className={`border rounded-xl p-4 ${isEligible
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700'
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700'
              }`}
          >
            <div className="flex items-start gap-3">
              {isEligible ? (
                <Icon icon="mdi:check-circle" className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
              ) : (
                <Icon icon="mdi:alert-circle" className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-bold ${isEligible
                    ? 'text-green-900 dark:text-green-200'
                    : 'text-yellow-900 dark:text-yellow-200'
                    }`}
                >
                  {isEligible ? 'You are at office location' : 'You are not at office location'}
                </p>
                <p
                  className={`text-sm mt-1 ${isEligible
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-yellow-700 dark:text-yellow-300'
                    }`}
                >
                  Distance from office: {calculateDistance(location.latitude, location.longitude, OFFICE_LAT, OFFICE_LONG)}m
                </p>
                <p className="text-xs text-brand-grey mt-2 font-mono">
                  Your location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-brand-grey/5 border border-brand-grey/10 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Icon icon="mdi:map-marker-off" className="w-5 h-5 text-brand-grey mt-0.5" />
              <div>
                <p className="font-bold text-brand-black dark:text-brand-white">Getting your location...</p>
                <p className="text-sm text-brand-grey mt-1">Please ensure location services are enabled</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Today's Attendance */}
      <div className="soft-card p-6">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-brand-black dark:text-brand-white mb-1">Today's Attendance</h3>
          <p className="text-sm text-brand-grey">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border rounded-xl p-4 border-brand-grey/10 bg-brand-grey/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-brand-grey uppercase tracking-wider">Check In</p>
                <p className="text-2xl font-bold text-brand-black dark:text-brand-white mt-1">
                  {attendanceStatus?.attendance?.check_in ? formatTime(attendanceStatus.attendance.check_in) : 'Not marked'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <Icon icon="mdi:clock-in" className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="border rounded-xl p-4 border-brand-grey/10 bg-brand-grey/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-brand-grey uppercase tracking-wider">Check Out</p>
                <p className="text-2xl font-bold text-brand-black dark:text-brand-white mt-1">
                  {attendanceStatus?.attendance?.check_out ? formatTime(attendanceStatus.attendance.check_out) : 'Not marked'}
                </p>
              </div>
              <div className="p-3 bg-brand-orange/10 rounded-xl">
                <Icon icon="mdi:clock-out" className="w-8 h-8 text-brand-orange" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {!attendanceStatus?.hasCheckedIn ? (
            <button
              onClick={() => handleMarkAttendance('check-in')}
              disabled={!isEligible || checkingLocation}
              className="flex-1 soft-button bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Icon icon="mdi:login" className="w-6 h-6" />
              Mark Check In
            </button>
          ) : !attendanceStatus?.hasCheckedOut ? (
            <button
              onClick={() => handleMarkAttendance('check-out')}
              disabled={!isEligible || checkingLocation}
              className="flex-1 soft-button bg-brand-orange text-white hover:bg-brand-yellow/60 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 py-4 text-lg"
            >
              <Icon icon="mdi:logout" className="w-6 h-6" />
              Mark Check Out
            </button>
          ) : (
            <div className="flex-1 text-center py-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
              <p className="text-green-600 dark:text-green-400 font-bold text-lg flex items-center justify-center gap-2">
                <Icon icon="mdi:check-circle" className="w-6 h-6" />
                Attendance completed for today
              </p>
              {attendanceStatus?.attendance?.hours_worked && (
                <p className="text-sm text-green-700 dark:text-green-300 mt-1 font-medium">
                  Hours worked: {attendanceStatus.attendance.hours_worked.toFixed(2)}
                </p>
              )}
            </div>
          )}
        </div>

        {!isEligible && location && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700 rounded-xl p-4 flex items-start gap-3">
            <Icon icon="mdi:information" className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> You must be within 25 meters of the office location to mark attendance.
            </p>
          </div>
        )}
      </div>

      {/* Admin: Current Code */}
      {['admin', 'hr', 'support'].includes(user?.role) && (
        <div className="soft-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-brand-orange/10 text-brand-orange"><Icon icon="mdi:key-variant" className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold text-brand-black dark:text-brand-white">Admin: Current Check-in Code</h3>
            </div>
            <div className="text-xs font-bold text-brand-grey bg-brand-grey/10 px-2 py-1 rounded-lg">
              Rotates in {Math.floor(codeExpiresIn / 60)}:{String(codeExpiresIn % 60).padStart(2, '0')}
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1">
              <div className="font-mono text-3xl tracking-widest font-bold bg-brand-grey/5 rounded-xl px-4 py-3 text-center">
                {adminCodeLoading ? '••••••' : (adminCode || '------')}
              </div>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(adminCode);
                  addToast('Code copied to clipboard', 'success');
                } catch {
                  addToast('Failed to copy code', 'error');
                }
              }}
              disabled={!adminCode || adminCodeLoading}
              className="soft-button bg-brand-orange text-black hover:bg-brand-yellow/60 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon icon="mdi:content-copy" className="w-4 h-4" /> Copy Code
            </button>
            <button
              type="button"
              onClick={async () => {
                try {
                  setAdminCodeLoading(true);
                  const res = await attendanceAPI.getCode();
                  setAdminCode(res?.data?.code || '');
                } finally {
                  setAdminCodeLoading(false);
                }
              }}
              className="soft-button bg-white dark:bg-brand-grey/10"
            >
              <Icon icon="mdi:refresh" className="w-4 h-4" /> Refresh
            </button>
          </div>
          <p className="text-xs text-brand-grey mt-3">Share this code with users who cannot use location check-in. The code changes every 5 minutes.</p>
        </div>
      )}

      {/* Admin: Attendance Log */}
      {['admin', 'hr', 'support'].includes(user?.role) && (
        <div className="soft-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600"><Icon icon="mdi:table" className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold text-brand-black dark:text-brand-white">Admin: Attendance Log</h3>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="soft-input w-56 text-sm"
                placeholder="Filter by user name or email..."
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
              />
              <button onClick={() => { setPage(p => Math.max(0, p - 1)); }} disabled={page === 0} className="soft-button bg-white dark:bg-brand-grey/10 disabled:opacity-50"><Icon icon="mdi:chevron-left" /></button>
              <span className="text-xs font-bold text-brand-grey">Page {page + 1}</span>
              <button onClick={() => { setPage(p => p + 1); }} className="soft-button bg-white dark:bg-brand-grey/10"><Icon icon="mdi:chevron-right" /></button>
              <button onClick={loadLogs} className="soft-button bg-white dark:bg-brand-grey/10"><Icon icon="mdi:refresh" className="w-4 h-4" /> Refresh</button>
            </div>
          </div>

          {logsError && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Icon icon="mdi:alert" className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900 dark:text-red-200">Unable to load logs</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{logsError}</p>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-brand-grey/5 border-b border-brand-grey/10">
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-brand-grey">User</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-brand-grey">Date</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-brand-grey">Check In</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-brand-grey">Check Out</th>
                  <th className="p-3 text-left text-xs font-bold uppercase tracking-wider text-brand-grey">Hours</th>
                  <th className="p-3 text-right text-xs font-bold uppercase tracking-wider text-brand-grey">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-grey/10">
                {logsLoading && (
                  <tr><td colSpan={6} className="p-6 text-center">
                    <div className="spinner mx-auto"></div>
                    <div className="text-brand-grey text-xs mt-2">Loading attendance...</div>
                  </td></tr>
                )}
                {!logsLoading && logs.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-brand-grey">No records found</td></tr>
                )}
                {logs.map(row => {
                  const isEditing = editingId === row.id;
                  const displayName = row.user_name || row.user_email || (row.user_id || row.employee_id || row.userId || row.employeeId || '-');
                  const checkIn = typeof row.check_in !== 'undefined' ? row.check_in : row.checkIn;
                  const checkOut = typeof row.check_out !== 'undefined' ? row.check_out : row.checkOut;
                  const hours = row.hours_worked;
                  return (
                    <tr key={row.id} className="hover:bg-brand-grey/5">
                      <td className="p-3">
                        <div className="text-sm font-bold text-brand-black dark:text-brand-white">{displayName || '-'}</div>
                        {row.user_email && <div className="text-xs text-brand-grey">{row.user_email}</div>}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input type="date" className="soft-input text-xs" value={editForm.date} onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))} />
                        ) : (
                          <span className="text-brand-black dark:text-brand-white text-sm">{row.date}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input type="time" className="soft-input text-xs" value={editForm.check_in} onChange={(e) => setEditForm(f => ({ ...f, check_in: e.target.value }))} />
                        ) : (
                          <span className="text-brand-grey text-sm">{checkIn || '-'}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input type="time" className="soft-input text-xs" value={editForm.check_out} onChange={(e) => setEditForm(f => ({ ...f, check_out: e.target.value }))} />
                        ) : (
                          <span className="text-brand-grey text-sm">{checkOut || '-'}</span>
                        )}
                      </td>
                      <td className="p-3">
                        {isEditing ? (
                          <input type="number" step="0.01" className="soft-input text-xs" value={editForm.hours_worked} onChange={(e) => setEditForm(f => ({ ...f, hours_worked: e.target.value }))} />
                        ) : (
                          <span className="text-brand-grey text-sm">{typeof hours === 'number' ? hours.toFixed(2) : (hours || '-')}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {!isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button className="soft-button bg-white dark:bg-brand-grey/10" onClick={() => {
                              setEditingId(row.id);
                              setEditForm({
                                date: row.date || '',
                                check_in: checkIn || '',
                                check_out: checkOut || '',
                                hours_worked: hours || ''
                              });
                            }}>
                              <Icon icon="mdi:pencil" className="w-4 h-4" /> Edit
                            </button>
                            <button className="soft-button bg-red-50 text-red-600 hover:bg-red-100" onClick={async () => {
                              if (!confirm('Delete this record?')) return;
                              try { await attendanceAPI.delete(row.id); addToast('Deleted', 'success'); loadLogs(); } catch (e) { addToast('Delete failed', 'error'); }
                            }}>
                              <Icon icon="mdi:delete" className="w-4 h-4" /> Delete
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button className="soft-button bg-brand-orange text-black hover:bg-brand-yellow/60" onClick={async () => {
                              try { await attendanceAPI.update(row.id, editForm); addToast('Saved', 'success'); setEditingId(null); loadLogs(); } catch (e) { addToast('Save failed', 'error'); }
                            }}>
                              <Icon icon="mdi:content-save" className="w-4 h-4" /> Save
                            </button>
                            <button className="soft-button" onClick={() => { setEditingId(null); }}>
                              <Icon icon="mdi:close" className="w-4 h-4" /> Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Code Check-in Fallback */}
      <div className="soft-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-brand-black dark:text-brand-white">Check-in with Code</h3>
          <div className="text-xs font-bold text-brand-grey bg-brand-grey/10 px-2 py-1 rounded-lg">
            Rotates in {Math.floor(codeExpiresIn / 60)}:{String(codeExpiresIn % 60).padStart(2, '0')}
          </div>
        </div>
        <p className="text-sm text-brand-grey mb-4">If location check-in is unavailable, ask your admin for the current 6-digit code and enter it below.</p>
        <form onSubmit={handleCodeCheckIn} className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit code"
            className="soft-input md:w-64 text-center tracking-widest text-lg font-bold"
          />
          <button
            type="submit"
            disabled={codeSubmitting || code.length !== 6}
            className="soft-button bg-brand-orange text-black hover:bg-brand-yellow/60 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {codeSubmitting ? 'Checking...' : 'Check In with Code'}
          </button>
        </form>
        <div className="text-xs text-brand-grey mt-3">
          Admins can view the current code in Admin → Attendance Code. Codes change every 5 minutes.
        </div>
      </div>

      {/* Office Location Info */}
      <div className="soft-card p-6">
        <h3 className="text-lg font-bold text-brand-black dark:text-brand-white mb-4">Office Location</h3>
        <div className="bg-brand-grey/5 rounded-xl p-4 border border-brand-grey/10">
          <div className="flex items-start gap-3">
            <Icon icon="mdi:office-building-marker" className="w-6 h-6 text-brand-orange mt-0.5" />
            <div>
              <p className="font-bold text-brand-black dark:text-brand-white">Sysdevcode Technologies Pvt. Ltd.</p>
              <p className="text-sm text-brand-grey mt-1 font-mono">Latitude: {OFFICE_LAT}</p>
              <p className="text-sm text-brand-grey font-mono">Longitude: {OFFICE_LONG}</p>
              <p className="text-xs text-brand-grey mt-2 italic">
                You must be within 25 meters of this location to mark attendance
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Toasts */}
      <Toast toasts={toasts} remove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};

export default Attendance;
