import React, { useState } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

const PrivacySettings = () => {
  const [settings, setSettings] = useState({
    analytics: false,
    personalizedAds: false,
    dataSharing: false,
    emailNotifications: true,
    smsNotifications: false
  });

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleSaveSettings = () => {
    // Save settings to localStorage or backend
    localStorage.setItem('privacySettings', JSON.stringify(settings));
    // Show success message
    alert('Privacy settings saved successfully!');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-glassText mb-4">Data & Privacy</h1>
        <p className="text-glassTextSecondary text-lg">
          You control your data. Here's what we collect and how you can manage it.
        </p>
      </div>

      {/* Data Collection Summary */}
      <GlassCard className="p-6" variant="light" padding="large" shadow="large">
        <h2 className="text-xl font-semibold text-glassText mb-4">What We Store</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-glassText font-medium">Your diagnostic answers</p>
              <p className="text-glassTextSecondary text-sm">Used to personalize your learning experience</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-glassText font-medium">Progress checkpoints</p>
              <p className="text-glassTextSecondary text-sm">Track your learning journey and achievements</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-glassText font-medium">Basic usage analytics</p>
              <p className="text-glassTextSecondary text-sm">Help us improve the platform (can be disabled)</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* What We DON'T Store */}
      <GlassCard className="p-6" variant="light" padding="large" shadow="large">
        <h2 className="text-xl font-semibold text-glassText mb-4">What We DON'T Store</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-glassText font-medium">Bank account information</p>
              <p className="text-glassTextSecondary text-sm">We never ask for or store your banking details</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-glassText font-medium">Social Security Numbers</p>
              <p className="text-glassTextSecondary text-sm">We don't need or want your SSN</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <div>
              <p className="text-glassText font-medium">Transaction data</p>
              <p className="text-glassTextSecondary text-sm">We don't track your spending or purchases</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Privacy Controls */}
      <GlassCard className="p-6" variant="default" padding="large" shadow="large">
        <h2 className="text-xl font-semibold text-glassText mb-6">Your Privacy Controls</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-glassText font-medium">Usage Analytics</h3>
              <p className="text-glassTextSecondary text-sm">Help us improve by sharing anonymous usage data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.analytics}
                onChange={(e) => handleSettingChange('analytics', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-glassBorder peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-glassAccent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-glassBorder after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-glassAccent"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-glassText font-medium">Email Notifications</h3>
              <p className="text-glassTextSecondary text-sm">Get helpful tips and progress updates via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-glassBorder peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-glassAccent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-glassBorder after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-glassAccent"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-glassText font-medium">SMS Notifications</h3>
              <p className="text-glassTextSecondary text-sm">Receive text messages for important updates</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleSettingChange('smsNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-glassBorder peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-glassAccent/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-glassBorder after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-glassAccent"></div>
            </label>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-glassBorder">
          <GlassButton
            onClick={handleSaveSettings}
            variant="primary"
            className="w-full"
          >
            Save Privacy Settings
          </GlassButton>
        </div>
      </GlassCard>

      {/* Data Export/Delete */}
      <GlassCard className="p-6" variant="light" padding="large" shadow="large">
        <h2 className="text-xl font-semibold text-glassText mb-4">Your Data Rights</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-glassBg rounded-lg">
            <h3 className="text-glassText font-medium mb-2">Export Your Data</h3>
            <p className="text-glassTextSecondary text-sm mb-3">
              Download all your data in a portable format
            </p>
            <GlassButton variant="outline" size="small">
              Export Data
            </GlassButton>
          </div>
          <div className="p-4 bg-glassBg rounded-lg">
            <h3 className="text-glassText font-medium mb-2">Delete Your Account</h3>
            <p className="text-glassTextSecondary text-sm mb-3">
              Permanently remove all your data from our systems
            </p>
            <GlassButton variant="outline" size="small" className="text-red-400 border-red-400 hover:bg-red-400/10">
              Delete Account
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Contact Information */}
      <GlassCard className="p-6" variant="light" padding="large" shadow="large">
        <h2 className="text-xl font-semibold text-glassText mb-4">Questions About Privacy?</h2>
        <p className="text-glassTextSecondary mb-4">
          We're committed to transparency. If you have questions about how we handle your data, 
          we're here to help.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <GlassButton variant="outline" size="default">
            Read Full Privacy Policy
          </GlassButton>
          <GlassButton variant="outline" size="default">
            Contact Privacy Team
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default PrivacySettings;
