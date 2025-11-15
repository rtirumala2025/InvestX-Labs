import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { uploadAvatar } from '../services/supabase/storage';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const ProfilePage = () => {
  const { currentUser, updateProfile, loading } = useAuth();
  const { queueToast } = useApp();

  const profile = currentUser?.profile || {};

  const normalizedStats = useMemo(() => ({
    xp: profile.xp ?? 0,
    netWorth: profile.net_worth ?? 0,
    achievements: profile.achievements_count ?? 0,
    lastUpdated: profile.updated_at ? new Date(profile.updated_at) : null,
  }), [profile]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    profileImagePath: '',
  });
  const [saving, setSaving] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData({
      name: profile.full_name || '',
      email: currentUser?.email || '',
      bio: profile.bio || '',
      profileImagePath: profile.profile_image || profile.avatar_url || '',
    });
    setAvatarPreview(profile.profile_image_url || '');
    setSelectedAvatarFile(null);
  }, [currentUser?.email, profile]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      queueToast('Please select a valid image file.', 'error');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      queueToast('Avatar must be smaller than 5MB.', 'error');
      return;
    }

    setSelectedAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result || '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      let avatarPath = formData.profileImagePath;

      if (selectedAvatarFile) {
        const { path, url } = await uploadAvatar(currentUser.id, selectedAvatarFile);
        avatarPath = path;
        setAvatarPreview(url);
        queueToast('Profile image uploaded.', 'success');
      }

      const { success, error } = await updateProfile({
        full_name: formData.name,
        email: formData.email,
        bio: formData.bio,
        profile_image: avatarPath,
        avatar_url: avatarPath,
      });

      if (!success) {
        throw new Error(error || 'Unable to update profile.');
      }

      setFormData((prev) => ({
        ...prev,
        profileImagePath: avatarPath,
      }));
      setSelectedAvatarFile(null);

      queueToast('Profile updated successfully.', 'success');
    } catch (submitError) {
      queueToast(submitError.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <motion.div
        className="absolute -top-24 -left-28 w-80 h-80 bg-gradient-to-r from-sky-500/35 to-purple-500/25 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 12, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[26rem] h-[26rem] bg-gradient-to-r from-emerald-400/25 to-teal-400/15 rounded-full blur-3xl"
        animate={{ y: [0, -18, 0], x: [0, -16, 0] }}
        transition={{ repeat: Infinity, duration: 22, ease: 'easeInOut', delay: 6 }}
      />

      <main className="relative z-10 w-full max-w-6xl mx-auto px-3 lg:px-8 py-6 lg:py-10">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">Account</p>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-purple-200 to-emerald-200">
                👤 Profile & Preferences
              </h1>
              <p className="text-sm md:text-base text-white/65 mt-2">
                Manage your InvestX Labs identity, update contact details, and keep your account information current.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
        >
          <div className="lg:col-span-2 space-y-4">
            <GlassCard variant="hero" padding="large" shadow="xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
                  {formData.name
                    ? formData.name.charAt(0).toUpperCase()
                    : currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{formData.name || 'Investor'}</h2>
                  <p className="text-sm text-white/60">{formData.email || 'Email not set'}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="text-sm font-medium text-white/70 mb-1 block">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="text-sm font-medium text-white/70 mb-1 block">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    placeholder="name@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="text-sm font-medium text-white/70 mb-1 block">
                    Bio
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-white placeholder-white/40 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30"
                    placeholder="Share a short mission statement or investing goal."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-white/70 mb-1 block">
                    Profile Avatar
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="h-20 w-20 rounded-2xl border border-white/10 bg-white/10 overflow-hidden flex items-center justify-center text-xl text-white/70">
                        {avatarPreview ? (
                          <img
                            src={avatarPreview}
                            alt="Profile preview"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>
                            {formData.name
                              ? formData.name.charAt(0).toUpperCase()
                              : currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/gif,image/webp"
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                      <GlassButton
                        type="button"
                        variant="glass"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={saving}
                      >
                        {selectedAvatarFile ? 'Replace Avatar' : 'Upload Avatar'}
                      </GlassButton>
                      {selectedAvatarFile && (
                        <p className="text-xs text-white/50">
                          Selected: {selectedAvatarFile.name}
                        </p>
                      )}
                      {!selectedAvatarFile && avatarPreview && (
                        <p className="text-xs text-white/50">
                          Current avatar in use
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/40">
                    PNG, JPG, GIF, or WEBP up to 5MB. Your image is stored securely in Supabase Storage.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <GlassButton
                    type="button"
                    variant="glass"
                    onClick={() =>
                      setFormData({
                        name: profile.full_name || '',
                        email: currentUser?.email || '',
                        bio: profile.bio || '',
                        profileImagePath: profile.profile_image || profile.avatar_url || '',
                      })
                    }
                    disabled={saving}
                  >
                    Reset
                  </GlassButton>
                  {avatarPreview && (
                    <GlassButton
                      type="button"
                      variant="glass"
                      onClick={() => {
                        setSelectedAvatarFile(null);
                        setAvatarPreview(profile.profile_image_url || '');
                        fileInputRef.current && (fileInputRef.current.value = '');
                      }}
                      disabled={saving}
                    >
                      Revert Avatar
                    </GlassButton>
                  )}
                  <GlassButton type="submit" variant="primary" disabled={saving || loading}>
                    {saving ? 'Saving…' : 'Save Changes'}
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </div>

          <div className="space-y-4">
            <GlassCard variant="floating" padding="large">
              <h3 className="text-xl font-semibold text-white mb-4">Profile Stats</h3>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-xs text-white/50 uppercase tracking-[0.3em]">Total XP</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {normalizedStats.xp.toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-xs text-white/50 uppercase tracking-[0.3em]">Net Worth</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {normalizedStats.netWorth.toLocaleString(undefined, {
                      style: 'currency',
                      currency: 'USD',
                    })}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-xs text-white/50 uppercase tracking-[0.3em]">Achievements</p>
                  <p className="mt-2 text-xl font-semibold text-white">
                    {normalizedStats.achievements}
                  </p>
                </div>
                {normalizedStats.lastUpdated ? (
                  <p className="text-xs text-white/40">
                    Updated {normalizedStats.lastUpdated.toLocaleString()}
                  </p>
                ) : null}
              </div>
            </GlassCard>

            <GlassCard variant="default" padding="large">
              <h3 className="text-xl font-semibold text-white mb-3">Security Tips</h3>
              <ul className="space-y-2 text-sm text-white/70">
                <li>• Use a unique password for your InvestX Labs account.</li>
                <li>• Keep your email up to date for important notifications.</li>
                <li>• Enable multi-factor authentication from your account settings once available.</li>
              </ul>
            </GlassCard>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;
