'use client';

import React, { useState, useEffect } from 'react';

interface Settings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  integrations: {
    sendgrid: boolean;
    googleForms: boolean;
    supabase: boolean;
  };
  leadScoring: {
    enabled: boolean;
    hotThreshold: number;
    warmThreshold: number;
  };
  emailTemplates: {
    welcomeEmail: string;
    followUpEmail: string;
    confirmationEmail: string;
  };
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    integrations: {
      sendgrid: true,
      googleForms: true,
      supabase: true
    },
    leadScoring: {
      enabled: true,
      hotThreshold: 80,
      warmThreshold: 50
    },
    emailTemplates: {
      welcomeEmail: 'Welcome to Accorria! We\'re excited to help you manage your inventory.',
      followUpEmail: 'Thanks for your interest! Let\'s schedule a demo.',
      confirmationEmail: 'Your early access request has been confirmed.'
    }
  });

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Here you would typically save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = (section: keyof Settings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Configure your CRM preferences and integrations.</p>
      </div>

      <div className="space-y-8">
        {/* Notifications */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notifications</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                <p className="text-sm text-gray-500">Receive email alerts for new leads and updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={(e) => updateSettings('notifications', 'email', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                <p className="text-sm text-gray-500">Receive SMS alerts for urgent updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.sms}
                  onChange={(e) => updateSettings('notifications', 'sms', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                <p className="text-sm text-gray-500">Receive browser push notifications</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={(e) => updateSettings('notifications', 'push', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Integrations</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">📧</span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">SendGrid</label>
                  <p className="text-sm text-gray-500">Email delivery and tracking</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                settings.integrations.sendgrid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {settings.integrations.sendgrid ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">📝</span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Google Forms</label>
                  <p className="text-sm text-gray-500">Lead capture from forms</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                settings.integrations.googleForms ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {settings.integrations.googleForms ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm font-bold">🗄️</span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Supabase</label>
                  <p className="text-sm text-gray-500">Database and authentication</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                settings.integrations.supabase ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {settings.integrations.supabase ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        {/* Lead Scoring */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Scoring</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">Enable Lead Scoring</label>
                <p className="text-sm text-gray-500">Automatically score leads based on form responses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.leadScoring.enabled}
                  onChange={(e) => updateSettings('leadScoring', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {settings.leadScoring.enabled && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Hot Lead Threshold</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.leadScoring.hotThreshold}
                    onChange={(e) => updateSettings('leadScoring', 'hotThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span className="font-medium">{settings.leadScoring.hotThreshold}</span>
                    <span>100</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Warm Lead Threshold</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.leadScoring.warmThreshold}
                    onChange={(e) => updateSettings('leadScoring', 'warmThreshold', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span className="font-medium">{settings.leadScoring.warmThreshold}</span>
                    <span>100</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Email Templates */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Templates</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Email</label>
              <textarea
                rows={3}
                value={settings.emailTemplates.welcomeEmail}
                onChange={(e) => updateSettings('emailTemplates', 'welcomeEmail', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter welcome email template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Follow-up Email</label>
              <textarea
                rows={3}
                value={settings.emailTemplates.followUpEmail}
                onChange={(e) => updateSettings('emailTemplates', 'followUpEmail', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter follow-up email template"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirmation Email</label>
              <textarea
                rows={3}
                value={settings.emailTemplates.confirmationEmail}
                onChange={(e) => updateSettings('emailTemplates', 'confirmationEmail', e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter confirmation email template"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-medium ${
              loading
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {loading ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
