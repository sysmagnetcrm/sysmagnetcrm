import React, { useEffect, useMemo, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import { useAuth } from '../context/AuthContext';
import { meAPI } from '../utils/supabaseServices';

const getExtras = (userId) => {
  try {
    const raw = localStorage.getItem('eron_profile_extras');
    const map = raw ? JSON.parse(raw) : {};
    return map[userId] || { username: '', phone: '', avatar: '' };
  } catch {
    return { username: '', phone: '', avatar: '' };
  }
};

const setExtras = (userId, extras) => {
  try {
    const raw = localStorage.getItem('eron_profile_extras');
    const map = raw ? JSON.parse(raw) : {};
    map[userId] = extras;
    localStorage.setItem('eron_profile_extras', JSON.stringify(map));
  } catch { }
};

const ProfileDrawer = ({ user, onClose, onUpdate }) => {
  const { logout } = useAuth();
  const initialExtras = useMemo(() => getExtras(user?.id), [user?.id]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: initialExtras.username || '',
    phone: initialExtras.phone || '',
    avatar: initialExtras.avatar || ''
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      username: initialExtras.username || '',
      phone: initialExtras.phone || '',
      avatar: initialExtras.avatar || ''
    });
  }, [user?.id, initialExtras]);

  const handleLogout = async () => {
    if (onClose) onClose();
    await logout();
  };

  const handleSave = async () => {
    if (user?.id) {
      try {
        // Update self profile on server (works for all roles)
        const res = await meAPI.update({ name: formData.name, email: formData.email });
        const updated = res?.data || { ...user, name: formData.name, email: formData.email };
        // Persist in auth context/localStorage so it survives reloads
        if (updated) {
          try { window.dispatchEvent(new Event('eron_profile_update')); } catch {}
          // Switch user in AuthContext
          // Avoid circular import by calling onUpdate if provided; also directly patch localStorage
          try {
            const localRaw = localStorage.getItem('eron_user');
            const localUser = localRaw ? JSON.parse(localRaw) : user;
            const nextUser = { ...localUser, name: updated.name || formData.name, email: updated.email || formData.email };
            localStorage.setItem('eron_user', JSON.stringify(nextUser));
          } catch {}
          // Inform parent to refresh auth context (updates TopBar and others immediately)
          if (onUpdate) {
            try { await onUpdate(user.id, { name: updated.name || formData.name, email: updated.email || formData.email }); } catch {}
          }
        }
      } catch (e) {
        // Fallback to admin update if available
        try { await onUpdate(user.id, { name: formData.name, email: formData.email }); } catch {}
      }
      setExtras(user.id, {
        username: formData.username,
        phone: formData.phone,
        avatar: formData.avatar
      });
    }
    setIsEditing(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end !mt-0 m-0">
      <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] z-50" onClick={onClose} />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="relative bg-white w-full sm:w-[560px] h-screen flex flex-col z-50 border-l border-[#E4E7EC] shadow-modal rounded-none"
      >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-r from-brand-orange to-brand-yellow overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>

          <div className="absolute top-6 right-6 z-10 flex gap-2">
            {isEditing ? (
              <button
                onClick={handleSave}
                className="p-2.5 rounded-xl bg-white text-green-600 hover:bg-green-50 shadow-lg transition-all active:scale-95"
                title="Save changes"
              >
                <Icon icon="mdi:check" className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2.5 rounded-xl bg-blue-500/20 text-white hover:bg-blue-500/40 backdrop-blur-md transition-all active:scale-95 border border-white/10"
                title="Edit profile"
              >
                <Icon icon="mdi:pencil" className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-red-500/20 text-white hover:bg-red-500/40 backdrop-blur-md transition-all active:scale-95 border border-white/10"
              title="Close"
            >
              <Icon icon="mdi:close" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 -mt-12 relative z-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              <div className="w-28 h-28 rounded-[2rem] bg-white dark:bg-brand-black p-1.5 shadow-xl">
                <div className="w-full h-full rounded-[1.7rem] bg-brand-grey/5 overflow-hidden flex items-center justify-center relative">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl font-bold text-brand-orange">
                      {user?.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}

                  {isEditing && (
                    <div
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Icon icon="mdi:camera-plus" className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
              </div>
              {isEditing && (
                <button
                  className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-brand-orange text-black shadow-lg hover:bg-brand-yellow/60 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Icon icon="mdi:camera" className="w-4 h-4" />
                </button>
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>

            <div className="mt-4 text-center">
              <h2 className="text-2xl font-bold text-brand-black dark:text-brand-white">{user?.name}</h2>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="px-2.5 py-0.5 rounded-lg bg-brand-orange/10 text-brand-orange text-xs font-bold uppercase tracking-wide border border-brand-orange/20">
                  {user?.role?.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          {/* Form Sections */}
          <div className="space-y-8">
            {/* Personal Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-brand-black dark:text-brand-white font-bold pb-2 border-b border-brand-grey/10">
                <Icon icon="mdi:account-details" className="w-5 h-5 text-brand-orange" />
                <h3>Personal Information</h3>
              </div>

              <div className="grid gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-grey uppercase tracking-wider ml-1">Full Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="soft-input w-full bg-brand-grey/5 border-transparent focus:bg-white"
                    />
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-brand-grey/5 border border-brand-grey/10 font-medium text-brand-black dark:text-brand-white">
                      {user?.name}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-grey uppercase tracking-wider ml-1">Email Address</label>
                  {isEditing ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="soft-input w-full bg-brand-grey/5 border-transparent focus:bg-white"
                    />
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-brand-grey/5 border border-brand-grey/10 font-medium text-brand-black dark:text-brand-white flex items-center gap-2">
                      <Icon icon="mdi:email" className="w-4 h-4 text-brand-grey" />
                      {user?.email}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Contact Info */}
            <section className="space-y-4">
              <div className="flex items-center gap-2 text-brand-black dark:text-brand-white font-bold pb-2 border-b border-brand-grey/10">
                <Icon icon="mdi:card-account-details" className="w-5 h-5 text-brand-orange" />
                <h3>Contact Details</h3>
              </div>

              <div className="grid gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-grey uppercase tracking-wider ml-1">Username</label>
                  {isEditing ? (
                    <div className="relative">
                      <Icon icon="mdi:at" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-grey w-4 h-4" />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="soft-input w-full pl-10 bg-brand-grey/5 border-transparent focus:bg-white"
                        placeholder="username"
                      />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-brand-grey/5 border border-brand-grey/10 font-medium text-brand-black dark:text-brand-white">
                      {formData.username ? `@${formData.username}` : <span className="text-brand-grey italic">Not set</span>}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-grey uppercase tracking-wider ml-1">Phone Number</label>
                  {isEditing ? (
                    <div className="relative">
                      <Icon icon="mdi:phone" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-grey w-4 h-4" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="soft-input w-full pl-10 bg-brand-grey/5 border-transparent focus:bg-white"
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-brand-grey/5 border border-brand-grey/10 font-medium text-brand-black dark:text-brand-white">
                      {formData.phone || <span className="text-brand-grey italic">Not set</span>}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Actions */}
            <div className="pt-4">
              <button
                onClick={handleLogout}
                className="w-full py-3.5 rounded-2xl bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98]"
              >
                <Icon icon="mdi:logout" className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
    </div>
  );
};

export default ProfileDrawer;
