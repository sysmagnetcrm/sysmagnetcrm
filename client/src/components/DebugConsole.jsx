import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';

const DebugConsole = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [logs, setLogs] = useState([]);
  const [serverStatus, setServerStatus] = useState('checking');
  const logsEndRef = useRef(null);

  const scrollToBottom = () => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  useEffect(() => {
    // Add initial log
    addLog('info', 'Debug Console initialized');

    // Check server status periodically
    const checkServerStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/users', {
          method: 'HEAD',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('vibe_token')}`
          }
        });
        if (response.ok || response.status === 401) {
          // Server is online (401 means auth required but server is responding)
          setServerStatus('online');
          if (serverStatus !== 'online') {
            addLog('success', '🚀 Server is ONLINE');
          }
        } else {
          setServerStatus('error');
          addLog('warning', `⚠️ Server responded with status ${response.status}`);
        }
      } catch (error) {
        setServerStatus('offline');
        if (serverStatus !== 'offline') {
          addLog('error', '❌ Server is OFFLINE or unreachable');
        }
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 5000); // Check every 5 seconds

    // Listen for custom debug events
    const handleDebugEvent = (event) => {
      const { type, message, data } = event.detail;
      addLog(type, message, data);
    };

    window.addEventListener('debug:log', handleDebugEvent);

    // Intercept console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      originalLog(...args);
      addLog('info', args.join(' '));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args.join(' '));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warning', args.join(' '));
    };

    return () => {
      clearInterval(interval);
      window.removeEventListener('debug:log', handleDebugEvent);
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, [serverStatus]);

  const safeSerialize = (data) => {
    if (data === null || data === undefined) return null;
    if (typeof data === 'string') return data;
    if (data instanceof Error) return data.message;
    try {
      const serialized = JSON.stringify(data, null, 2);
      return serialized?.length > 2000 ? `${serialized.slice(0, 2000)}\n... (truncated)` : serialized;
    } catch (error) {
      return '[data unavailable: not serializable]';
    }
  };

  const addLog = (type, message, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, { id: Date.now(), type, message, data: safeSerialize(data), timestamp }]);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('info', 'Console cleared');
  };

  const getLogColor = (type) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warning': return 'text-yellow-400';
      case 'success': return 'text-green-400';
      case 'api': return 'text-blue-400';
      default: return 'text-slate-300';
    }
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'error': return 'mdi:alert-circle';
      case 'warning': return 'mdi:alert';
      case 'success': return 'mdi:check-circle';
      case 'api': return 'mdi:web';
      default: return 'mdi:information';
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-brand-black text-white rounded-full shadow-lg hover:bg-brand-black/90 transition-colors z-50"
        title="Open Debug Console"
      >
        <Icon icon="mdi:console" className="w-6 h-6" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      className={`fixed bottom-0 right-0 ${isMinimized ? 'w-80' : 'w-full md:w-2/3 lg:w-1/2'} bg-[#1e1e1e] border-t-2 border-brand-grey/20 shadow-2xl z-50 rounded-t-xl overflow-hidden`}
      style={{ maxHeight: isMinimized ? '48px' : '400px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-brand-grey/20">
        <div className="flex items-center gap-2">
          <Icon icon="mdi:console" className="w-4 h-4 text-green-400" />
          <span className="text-sm font-bold text-slate-200">Debug Console</span>
          <span className="text-xs text-slate-400">({logs.length} logs)</span>
          <div className="flex items-center gap-1 ml-2 bg-black/20 px-2 py-0.5 rounded-full">
            <div className={`w-2 h-2 rounded-full ${serverStatus === 'online' ? 'bg-green-500 animate-pulse' :
                serverStatus === 'offline' ? 'bg-red-500' :
                  serverStatus === 'error' ? 'bg-yellow-500' :
                    'bg-gray-500'
              }`} />
            <span className={`text-[10px] font-bold uppercase tracking-wide ${serverStatus === 'online' ? 'text-green-400' :
                serverStatus === 'offline' ? 'text-red-400' :
                  serverStatus === 'error' ? 'text-yellow-400' :
                    'text-gray-400'
              }`}>
              {serverStatus === 'online' ? 'Online' :
                serverStatus === 'offline' ? 'Offline' :
                  serverStatus === 'error' ? 'Error' :
                    'Checking'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearLogs}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Clear logs"
          >
            <Icon icon="mdi:trash-can-outline" className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title={isMinimized ? 'Maximize' : 'Minimize'}
          >
            <Icon icon={isMinimized ? "mdi:chevron-up" : "mdi:chevron-down"} className="w-4 h-4 text-slate-400" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Close"
          >
            <Icon icon="mdi:close" className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Logs */}
      {!isMinimized && (
        <div className="overflow-y-auto p-4 space-y-1 font-mono text-xs bg-[#1e1e1e] custom-scrollbar" style={{ maxHeight: '352px' }}>
          {logs.length === 0 ? (
            <div className="text-slate-500 text-center py-8 flex flex-col items-center">
              <Icon icon="mdi:console-line" className="w-8 h-8 mb-2 opacity-50" />
              No logs yet...
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="flex gap-2 hover:bg-white/5 px-2 py-1 rounded transition-colors group">
                <span className="text-slate-500 flex-shrink-0 w-16 text-[10px] pt-0.5">{log.timestamp}</span>
                <span className="flex-shrink-0 pt-0.5">
                  <Icon icon={getLogIcon(log.type)} className={`w-3.5 h-3.5 ${getLogColor(log.type)}`} />
                </span>
                <span className={`${getLogColor(log.type)} break-all flex-1`}>
                  {log.message}
                  {log.data && (
                    <pre className="mt-1 text-[10px] text-slate-400 bg-black/30 p-2 rounded overflow-x-auto whitespace-pre-wrap border border-white/5">
                      {log.data}
                    </pre>
                  )}
                </span>
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      )}
    </motion.div>
  );
};

// Helper function to dispatch debug events from anywhere in the app
export const debugLog = (type, message, data = null) => {
  window.dispatchEvent(
    new CustomEvent('debug:log', {
      detail: { type, message, data }
    })
  );
};

export default DebugConsole;
