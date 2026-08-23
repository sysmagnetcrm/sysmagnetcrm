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
  const [distanceFromOffice, setDistanceFromOffice] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  
  // Code Check-in State
  const [code, setCode] = useState('');
  const [codeSubmitting, setCodeSubmitting] = useState(false);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);

  // Admin Code State
  const [adminCode, setAdminCode] = useState('');
  const [adminCodeLoading, setAdminCodeLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCoords, setShowCoords] = useState(false);

  // Admin Logs State
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
  const isAdmin = ['admin', 'hr', 'support'].includes(user?.role);

  useEffect(() => {
    checkTodayAttendance();
    requestLocation();
    
    // Countdown timer for 5-minute code rotation
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
  }, [user?.role, isAdmin]);

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
      else if (status === 503) msg = 'Server auth not configured.';
      else if (e?.response?.data?.error) msg = e.response.data.error;
      setLogsError(msg);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
  }, [user?.role, page, isAdmin]);

  // Debounce search
  useEffect(() => {
    if (!isAdmin) return;
    const id = setTimeout(() => { setPage(0); loadLogs(); }, 400);
    return () => clearTimeout(id);
  }, [adminSearch, isAdmin]);

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
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
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
        let errorMessage = 'Unable to get your location.';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission is blocked in browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is currently unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        setLocationError(errorMessage);
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
      if (data.distance !== undefined) {
        setDistanceFromOffice(data.distance);
      } else {
        setDistanceFromOffice(calculateDistance(lat, long, OFFICE_LAT, OFFICE_LONG));
      }
    } catch (error) {
      const dist = calculateDistance(lat, long, OFFICE_LAT, OFFICE_LONG);
      setDistanceFromOffice(dist);
      setIsEligible(dist <= 25);
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
      checkTodayAttendance();
    } catch (error) {
      const msg = error?.response?.data?.error || error.message || 'Failed to mark attendance';
      addToast(msg, 'error');
    }
  };

  const formatTime = (timeString) => {
    if (!timeString) return '--:--';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const handleCopyAdminCode = async () => {
    if (!adminCode) return;
    try {
      await navigator.clipboard.writeText(adminCode);
      setCopiedCode(true);
      addToast('Attendance code copied to clipboard', 'success');
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      addToast('Failed to copy code', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-[#FF8A1F] border-t-transparent animate-spin" />
      </div>
    );
  }

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const minsLeft = Math.floor(codeExpiresIn / 60);
  const secsLeft = String(codeExpiresIn % 60).padStart(2, '0');
  const isExpiringSoon = codeExpiresIn > 0 && codeExpiresIn <= 30;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1200px] mx-auto">
      
      {/* 1. Page Header */}
      <div className="pb-2 border-b border-[#E4E7EC]">
        <h1 className="text-xl sm:text-2xl font-bold text-[#111827] tracking-tight">Attendance</h1>
        <p className="text-xs sm:text-sm text-[#667085] mt-0.5">Track your daily attendance, check-in, check-out, and attendance history.</p>
      </div>

      {/* 2. Compact Location Status Card */}
      <div className="saas-card p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {checkingLocation ? (
              <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-[#667085] shrink-0">
                <Icon icon="heroicons:arrow-path" className="w-5 h-5 animate-spin" />
              </div>
            ) : isEligible ? (
              <div className="w-9 h-9 rounded-lg bg-[#ECFDF3] flex items-center justify-center text-[#12B76A] shrink-0">
                <Icon icon="heroicons:map-pin" className="w-5 h-5" />
              </div>
            ) : locationError ? (
              <div className="w-9 h-9 rounded-lg bg-[#FEF3F2] flex items-center justify-center text-[#D92D20] shrink-0">
                <Icon icon="heroicons:exclamation-circle" className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-lg bg-[#FFFAEB] flex items-center justify-center text-[#F79009] shrink-0">
                <Icon icon="heroicons:map-pin" className="w-5 h-5" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#667085] uppercase tracking-wider">Location Status</span>
                {checkingLocation ? (
                  <span className="text-[11px] font-semibold text-[#667085]">Checking location...</span>
                ) : isEligible ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#ECFDF3] text-[#12B76A]">
                    ● Location verified
                  </span>
                ) : locationError ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FEF3F2] text-[#D92D20]">
                    ● Location unavailable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFAEB] text-[#F79009]">
                    ● Outside office location
                  </span>
                )}
              </div>

              <p className="text-xs text-[#344054] mt-0.5 font-medium">
                {checkingLocation
                  ? 'Verifying your current location...'
                  : isEligible
                  ? "You're within the allowed office location."
                  : locationError
                  ? 'Location permission is required to mark attendance.'
                  : `You are ${distanceFromOffice || 0}m away. Move within the 25m attendance area.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={requestLocation}
            disabled={checkingLocation}
            className="saas-button-secondary h-9 px-3.5 text-xs font-semibold flex items-center gap-2 self-start sm:self-auto shrink-0"
          >
            <Icon icon="heroicons:arrow-path" className={`w-4 h-4 text-[#667085] ${checkingLocation ? 'animate-spin' : ''}`} />
            {checkingLocation ? 'Refreshing...' : 'Refresh Location'}
          </button>
        </div>
      </div>

      {/* 3. Today's Attendance Section */}
      <div className="saas-card p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-4 border-b border-[#E4E7EC]">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Today's Attendance</h2>
            <p className="text-xs text-[#667085] mt-0.5 font-medium">{todayFormatted}</p>
          </div>
          {attendanceStatus?.attendance?.hours_worked && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-auto">
              Total Hours: {attendanceStatus.attendance.hours_worked.toFixed(2)}h
            </span>
          )}
        </div>

        {/* 2 Equal Check In / Check Out Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* CHECK IN CARD */}
          <div className="p-5 rounded-[10px] border border-[#E4E7EC] bg-[#F9FAFB] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">CHECK IN</span>
              <p className="text-2xl font-bold text-[#111827] mt-1">
                {attendanceStatus?.attendance?.check_in ? formatTime(attendanceStatus.attendance.check_in) : '--:--'}
              </p>
              <p className="text-xs font-medium text-[#667085] mt-1">
                {attendanceStatus?.attendance?.check_in ? 'Checked in' : 'Not marked'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Icon icon="heroicons:arrow-right-on-rectangle" className="w-5 h-5" />
            </div>
          </div>

          {/* CHECK OUT CARD */}
          <div className="p-5 rounded-[10px] border border-[#E4E7EC] bg-[#F9FAFB] flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#667085] uppercase tracking-wider">CHECK OUT</span>
              <p className="text-2xl font-bold text-[#111827] mt-1">
                {attendanceStatus?.attendance?.check_out ? formatTime(attendanceStatus.attendance.check_out) : '--:--'}
              </p>
              <p className="text-xs font-medium text-[#667085] mt-1">
                {attendanceStatus?.attendance?.check_out ? 'Checked out' : 'Not marked'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-[#FF8A1F] flex items-center justify-center shrink-0">
              <Icon icon="heroicons:arrow-left-on-rectangle" className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Primary Action Button (200px Width) */}
        <div className="flex flex-col items-center justify-center pt-2">
          {!attendanceStatus?.hasCheckedIn ? (
            <button
              type="button"
              onClick={() => handleMarkAttendance('check-in')}
              disabled={!isEligible || checkingLocation}
              className="saas-button-primary w-full sm:w-[220px] h-[46px] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon icon="heroicons:arrow-right-on-rectangle" className="w-4 h-4 text-white" />
              Mark Check In
            </button>
          ) : !attendanceStatus?.hasCheckedOut ? (
            <button
              type="button"
              onClick={() => handleMarkAttendance('check-out')}
              disabled={!isEligible || checkingLocation}
              className="saas-button-primary w-full sm:w-[220px] h-[46px] text-xs font-semibold flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon icon="heroicons:arrow-left-on-rectangle" className="w-4 h-4 text-white" />
              Mark Check Out
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[8px] bg-[#ECFDF3] border border-[#ABEFC6] text-[#027A48] text-xs font-semibold">
              <Icon icon="heroicons:check-circle" className="w-4 h-4 text-[#12B76A]" />
              Attendance completed for today
            </div>
          )}

          {!isEligible && (
            <p className="text-[11px] text-[#667085] mt-2 text-center font-medium">
              {locationError ? 'Location access required to mark attendance.' : 'Must be within 25m of office to enable check-in.'}
            </p>
          )}
        </div>
      </div>

      {/* 4. Alternative Check-in (For Employees) */}
      <div className="saas-card p-6 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-[#111827]">Alternative Check-in</h2>
          <p className="text-xs text-[#667085] mt-0.5 font-medium">
            Can't use location? Enter the current 6-digit attendance code provided by your admin.
          </p>
        </div>

        <form onSubmit={handleCodeCheckIn} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="saas-input text-center text-base font-bold font-mono tracking-[4px] w-full sm:w-[180px] h-10"
          />
          <button
            type="submit"
            disabled={codeSubmitting || code.length !== 6}
            className="saas-button-primary h-10 px-5 text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon icon="heroicons:key" className="w-4 h-4 text-white" />
            {codeSubmitting ? 'Verifying...' : 'Check In with Code'}
          </button>
        </form>
      </div>

      {/* 5. Attendance History Section */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E4E7EC] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Attendance History</h2>
            <p className="text-xs text-[#667085] mt-0.5 font-medium">View recent check-in and check-out records.</p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <div className="relative max-w-xs">
                <div className="input-leading-icon">
                  <Icon icon="heroicons:magnifying-glass" className="w-4 h-4 text-[#667085]" />
                </div>
                <input
                  type="text"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="Search employee..."
                  className="saas-input saas-input-icon text-xs h-9 w-full sm:w-[200px]"
                />
              </div>

              <button
                type="button"
                onClick={loadLogs}
                className="saas-button-secondary h-9 px-3 text-xs font-semibold flex items-center gap-1.5"
              >
                <Icon icon="heroicons:arrow-path" className={`w-4 h-4 text-[#667085] ${logsLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          )}
        </div>

        {/* History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E7EC] bg-[#F9FAFB] text-[11px] font-semibold text-[#667085] uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Hours</th>
                {isAdmin && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] text-xs font-medium text-[#101828]">
              {logsLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-8 text-center">
                    <div className="w-6 h-6 rounded-full border-2 border-[#FF8A1F] border-t-transparent animate-spin mx-auto mb-2" />
                    <span className="text-xs text-[#667085]">Loading attendance history...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="py-12 text-center">
                    <Icon icon="heroicons:clipboard-document-list" className="w-10 h-10 mx-auto text-[#98A2B3] mb-2" />
                    <p className="text-sm font-semibold text-[#101828]">No attendance records</p>
                    <p className="text-xs text-[#667085] mt-1">Attendance records will appear here once attendance is recorded.</p>
                  </td>
                </tr>
              ) : (
                logs.map(row => {
                  const isEditing = editingId === row.id;
                  const displayName = row.user_name || row.user_email || (row.user_id || '-');
                  const checkIn = typeof row.check_in !== 'undefined' ? row.check_in : row.checkIn;
                  const checkOut = typeof row.check_out !== 'undefined' ? row.check_out : row.checkOut;
                  const hours = row.hours_worked;

                  return (
                    <tr key={row.id} className="hover:bg-[#F9FAFB] transition-colors h-[54px]">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#101828]">{displayName}</div>
                        {row.user_email && <div className="text-[11px] text-[#667085]">{row.user_email}</div>}
                      </td>

                      <td className="py-3 px-4 text-[#344054]">
                        {isEditing ? (
                          <input type="date" className="saas-input text-xs h-8" value={editForm.date} onChange={(e) => setEditForm(f => ({ ...f, date: e.target.value }))} />
                        ) : (
                          row.date
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#344054]">
                        {isEditing ? (
                          <input type="time" className="saas-input text-xs h-8" value={editForm.check_in} onChange={(e) => setEditForm(f => ({ ...f, check_in: e.target.value }))} />
                        ) : (
                          checkIn ? formatTime(checkIn) : '--:--'
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#344054]">
                        {isEditing ? (
                          <input type="time" className="saas-input text-xs h-8" value={editForm.check_out} onChange={(e) => setEditForm(f => ({ ...f, check_out: e.target.value }))} />
                        ) : (
                          checkOut ? formatTime(checkOut) : '--:--'
                        )}
                      </td>

                      <td className="py-3 px-4 text-[#344054]">
                        {isEditing ? (
                          <input type="number" step="0.01" className="saas-input text-xs h-8 w-20" value={editForm.hours_worked} onChange={(e) => setEditForm(f => ({ ...f, hours_worked: e.target.value }))} />
                        ) : (
                          typeof hours === 'number' ? `${hours.toFixed(2)}h` : (hours || '--')
                        )}
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-right">
                          {!isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                className="p-1 text-[#667085] hover:text-[#111827] rounded"
                                onClick={() => {
                                  setEditingId(row.id);
                                  setEditForm({
                                    date: row.date || '',
                                    check_in: checkIn || '',
                                    check_out: checkOut || '',
                                    hours_worked: hours || ''
                                  });
                                }}
                              >
                                <Icon icon="heroicons:pencil-square" className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                className="p-1 text-red-600 hover:text-red-800 rounded"
                                onClick={async () => {
                                  if (!confirm('Delete this record?')) return;
                                  try { await attendanceAPI.delete(row.id); addToast('Deleted', 'success'); loadLogs(); } catch (e) { addToast('Delete failed', 'error'); }
                                }}
                              >
                                <Icon icon="heroicons:trash" className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                className="saas-button-primary h-7 px-2.5 text-[11px] font-semibold"
                                onClick={async () => {
                                  try { await attendanceAPI.update(row.id, editForm); addToast('Saved', 'success'); setEditingId(null); loadLogs(); } catch (e) { addToast('Save failed', 'error'); }
                                }}
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                className="saas-button-secondary h-7 px-2.5 text-[11px] font-semibold"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. ADMIN TOOLS SECTION */}
      {isAdmin && (
        <div className="space-y-6 pt-4 border-t border-[#E4E7EC]">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-orange-100 text-[#FF8A1F]">
              ADMIN TOOLS
            </span>
            <h2 className="text-base font-semibold text-[#111827]">Attendance Administration</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Attendance Check-in Code Box */}
            <div className="saas-card p-6 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#111827]">Attendance Check-in Code</h3>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                    isExpiringSoon ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-[#667085]'
                  }`}>
                    Expires in {minsLeft}:{secsLeft}
                  </span>
                </div>
                <p className="text-xs text-[#667085] leading-relaxed">
                  Share this temporary code with employees who cannot use location-based check-in. The code changes every 5 minutes.
                </p>

                {/* 6-Digit Prominent Display */}
                <div className="my-4 p-3 bg-[#F8F9FB] border border-[#E4E7EC] rounded-[8px] flex items-center justify-center">
                  <span className="text-2xl font-bold font-mono tracking-[6px] text-[#111827]">
                    {adminCodeLoading ? '••••••' : (adminCode || '------')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCopyAdminCode}
                  disabled={!adminCode || adminCodeLoading}
                  className="saas-button-primary h-9 px-4 text-xs font-semibold flex items-center gap-2 flex-1 justify-center disabled:opacity-50"
                >
                  <Icon icon={copiedCode ? 'heroicons:check' : 'heroicons:clipboard-document'} className="w-4 h-4 text-white" />
                  {copiedCode ? '✓ Copied' : 'Copy Code'}
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
                  className="saas-button-secondary h-9 px-4 text-xs font-semibold flex items-center gap-2 flex-1 justify-center"
                >
                  <Icon icon="heroicons:arrow-path" className={`w-4 h-4 text-[#667085] ${adminCodeLoading ? 'animate-spin' : ''}`} />
                  Refresh Code
                </button>
              </div>
            </div>

            {/* Office Location Card */}
            <div className="saas-card p-6 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-[#111827] mb-2">Office Location Configuration</h3>
                <div className="p-4 bg-[#F9FAFB] border border-[#EAECF0] rounded-[8px] space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon icon="heroicons:building-office-2" className="w-5 h-5 text-[#FF8A1F]" />
                    <span className="text-xs font-bold text-[#101828]">Sysdevcode Technologies Pvt. Ltd.</span>
                  </div>
                  <p className="text-xs text-[#667085] pl-7">
                    Configured Radius: <strong className="text-[#101828]">25 meters</strong>
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => setShowCoords(!showCoords)}
                  className="text-xs text-[#667085] hover:text-[#111827] font-semibold flex items-center gap-1.5"
                >
                  <Icon icon={showCoords ? 'heroicons:chevron-up' : 'heroicons:chevron-down'} className="w-4 h-4" />
                  {showCoords ? 'Hide Technical Coordinates' : 'Show Technical Coordinates'}
                </button>

                {showCoords && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-[6px] text-xs font-mono text-[#475467] space-y-1">
                    <p>Latitude: {OFFICE_LAT}</p>
                    <p>Longitude: {OFFICE_LONG}</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Global Toast Notifications */}
      <Toast toasts={toasts} remove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};

export default Attendance;
