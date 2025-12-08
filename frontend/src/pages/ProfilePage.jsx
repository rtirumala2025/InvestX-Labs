import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import Modal from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { uploadAvatar } from '../services/supabase/storage';
import { supabase } from '../services/supabase/config';
import { updatePassword } from '../services/supabase/auth';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const ProfilePage = () => {
  const { currentUser, updateProfile, loading, signOut } = useAuth();
  const { queueToast } = useApp();
  const navigate = useNavigate();

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

  // Task 25: Password/Email change, Account deletion, Privacy/Notification settings
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [newEmail, setNewEmail] = useState('');
  const [privacySettings, setPrivacySettings] = useState({
    showEmail: false,
    showPortfolio: true,
    showAchievements: true,
    allowFriendRequests: true
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: false,
    achievements: true,
    suggestions: true,
    marketUpdates: false
  });

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

  // Task 25: Password change handler
  const handlePasswordChange = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      queueToast('New passwords do not match', 'error');
      return;
    }
    if (passwordForm.new.length < 6) {
      queueToast('Password must be at least 6 characters', 'error');
      return;
    }

    setSaving(true);
    try {
      await updatePassword(passwordForm.new);
      queueToast('Password updated successfully', 'success');
      setShowPasswordModal(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (error) {
      queueToast(error.message || 'Failed to update password', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Task 25: Email change handler
  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      queueToast('Please enter a valid email address', 'error');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({ email: newEmail });
      queueToast('Email update request sent. Please check your new email for verification.', 'success');
      setShowEmailModal(false);
      setNewEmail('');
    } catch (error) {
      queueToast(error.message || 'Failed to update email', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Task 25: Account deletion handler
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setSaving(true);
    try {
      // Delete user data from Supabase
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', currentUser.id);

      if (error) throw error;

      // Sign out and redirect
      await signOut();
      queueToast('Account deleted successfully', 'success');
      navigate('/');
    } catch (error) {
      queueToast(error.message || 'Failed to delete account', 'error');
    } finally {
      setSaving(false);
      setShowDeleteModal(false);
    }
  };

  // Task 25: Save privacy/notification settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await updateProfile({
        privacy_settings: privacySettings,
        notification_settings: notificationSettings
      });
      queueToast('Settings saved successfully', 'success');
      setShowSettingsModal(false);
    } catch (error) {
      queueToast(error.message || 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ 
      background: 'var(--bg-base, #0a0f1a)',
      backgroundImage: 'var(--bg-gradient-primary), var(--bg-pattern-grid), var(--bg-pattern-noise)',
      backgroundSize: '100% 100%, 60px 60px, 400px 400px',
      backgroundAttachment: 'fixed'
    }}>
      <motion.div
        className="absolute -top-24 -left-28 w-80 h-80 bg-gradient-to-r from-primary-500/35 to-primary-600/25 rounded-full blur-3xl"
        animate={{ y: [0, 20, 0], x: [0, 12, 0] }}
        transition={{ repeat: Infinity, duration: 18, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 -right-32 w-[26rem] h-[26rem] bg-gradient-to-r from-primary-400/25 to-primary-500/15 rounded-full blur-3xl"
        animate={{ y: [0, -18, 0], x: [0, -16, 0] }}
        transition={{ repeat: Infinity, duration: 22, ease: 'easeInOut', delay: 6 }}
      />

      <main className="relative z-10 w-full max-w-6xl mx-auto px-3 lg:px-8 py-6 lg:py-10">
        <motion.div variants={fadeIn} initial="hidden" animate="visible" className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-white/60 mb-2">Account</p>
              <h1 className="text-3xl md:text-4xl font-display font-normal tracking-tight text-gradient-hero">
                👤 Profile & Preferences
              </h1>
              <p className="text-sm md:text-base text-white/65 mt-2 font-sans">
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

            {/* Task 25: Account Management */}
            <GlassCard variant="default" padding="large">
              <h3 className="text-xl font-semibold text-white mb-4">Account Management</h3>
              <div className="space-y-3">
                <GlassButton
                  variant="glass"
                  className="w-full justify-start"
                  onClick={() => setShowPasswordModal(true)}
                >
                  🔒 Change Password
                </GlassButton>
                <GlassButton
                  variant="glass"
                  className="w-full justify-start"
                  onClick={() => setShowEmailModal(true)}
                >
                  📧 Change Email
                </GlassButton>
                <GlassButton
                  variant="glass"
                  className="w-full justify-start"
                  onClick={() => setShowSettingsModal(true)}
                >
                  ⚙️ Privacy & Notifications
                </GlassButton>
                <GlassButton
                  variant="glass"
                  className="w-full justify-start text-red-400 hover:text-red-300"
                  onClick={() => setShowDeleteModal(true)}
                >
                  🗑️ Delete Account
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        </motion.div>
      </main>

      {/* Task 25: Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">Current Password</label>
            <input
              type="password"
              value={passwordForm.current}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, current: e.target.value }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">New Password</label>
            <input
              type="password"
              value={passwordForm.new}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <GlassButton variant="glass" onClick={() => setShowPasswordModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={handlePasswordChange} disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Task 25: Email Change Modal */}
      <Modal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        title="Change Email"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-2">New Email Address</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
              placeholder="newemail@example.com"
            />
          </div>
          <p className="text-sm text-white/60">
            A verification email will be sent to your new email address.
          </p>
          <div className="flex gap-3 justify-end">
            <GlassButton variant="glass" onClick={() => setShowEmailModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={handleEmailChange} disabled={saving}>
              {saving ? 'Updating...' : 'Update Email'}
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Task 25: Privacy & Notification Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Privacy & Notification Settings"
        size="large"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Privacy Settings</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-white/80">Show Email to Others</span>
                <input
                  type="checkbox"
                  checked={privacySettings.showEmail}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, showEmail: e.target.checked }))}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-white/80">Show Portfolio Stats</span>
                <input
                  type="checkbox"
                  checked={privacySettings.showPortfolio}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, showPortfolio: e.target.checked }))}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-white/80">Show Achievements</span>
                <input
                  type="checkbox"
                  checked={privacySettings.showAchievements}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, showAchievements: e.target.checked }))}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-white/80">Allow Friend Requests</span>
                <input
                  type="checkbox"
                  checked={privacySettings.allowFriendRequests}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, allowFriendRequests: e.target.checked }))}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold text-white mb-4">Notification Preferences</h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-white/80">Email Notifications</span>
                <input
                  type="checkbox"
                  checked={notificationSettings.email}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, email: e.target.checked }))}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-white/80">Push Notifications</span>
                <input
                  type="checkbox"
                  checked={notificationSettings.push}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, push: e.target.checked }))}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-white/80">Achievement Notifications</span>
                <input
                  type="checkbox"
                  checked={notificationSettings.achievements}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, achievements: e.target.checked }))}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-white/80">AI Suggestions</span>
                <input
                  type="checkbox"
                  checked={notificationSettings.suggestions}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, suggestions: e.target.checked }))}
                  className="w-5 h-5"
                />
              </label>
              <label className="flex items-center justify-between">
                <span className="text-white/80">Market Updates</span>
                <input
                  type="checkbox"
                  checked={notificationSettings.marketUpdates}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, marketUpdates: e.target.checked }))}
                  className="w-5 h-5"
                />
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <GlassButton variant="glass" onClick={() => setShowSettingsModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton variant="primary" onClick={handleSaveSettings} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </GlassButton>
          </div>
        </div>
      </Modal>

      {/* Task 25: Delete Account Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-white/80">
            Are you sure you want to delete your account? This action cannot be undone. All your data, including portfolios, achievements, and progress will be permanently deleted.
          </p>
          <div className="flex gap-3 justify-end">
            <GlassButton variant="glass" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleDeleteAccount}
              disabled={saving}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-300"
            >
              {saving ? 'Deleting...' : 'Delete Account'}
            </GlassButton>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
