import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Palette, Database, Download, Upload, Trash2, Save } from 'lucide-react';
import { motion } from 'framer-motion';

const Settings = ({ user }) => {
    const [settings, setSettings] = useState({
        notifications: {
            email: true,
            push: false,
            reports: true,
            system: true
        },
        privacy: {
            profileVisible: true,
            dataSharing: false,
            analytics: true
        },
        appearance: {
            theme: 'dark',
            language: 'en',
            timezone: 'UTC'
        }
    });

    const [saving, setSaving] = useState(false);

    const saveSettings = async () => {
        setSaving(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert('✅ Settings saved successfully!');
        } catch (error) {
            alert('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const exportData = () => {
        const data = {
            user: user.email,
            exported_at: new Date().toISOString(),
            settings: settings
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `medai-settings-${user.email}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const SettingSection = ({ title, icon: Icon, children }) => (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Icon size={20} color="var(--color-primary)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--color-primary)' }}>{title}</h3>
            </div>
            {children}
        </div>
    );

    const ToggleSwitch = ({ checked, onChange, label, description }) => (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
                <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>{label}</div>
                {description && (
                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{description}</div>
                )}
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: checked ? 'var(--color-primary)' : '#ccc',
                    transition: '0.4s',
                    borderRadius: '24px'
                }}>
                    <span style={{
                        position: 'absolute',
                        content: '',
                        height: '18px',
                        width: '18px',
                        left: checked ? '26px' : '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '0.4s',
                        borderRadius: '50%'
                    }} />
                </span>
            </label>
        </div>
    );

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Settings
                </h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Customize your MedAI experience
                </p>
            </motion.div>

            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
                {/* Notifications */}
                <SettingSection title="Notifications" icon={Bell}>
                    <ToggleSwitch
                        checked={settings.notifications.email}
                        onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, email: e.target.checked }
                        })}
                        label="Email Notifications"
                        description="Receive updates via email"
                    />
                    <ToggleSwitch
                        checked={settings.notifications.reports}
                        onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, reports: e.target.checked }
                        })}
                        label="Report Notifications"
                        description="Get notified when reports are reviewed"
                    />
                    <ToggleSwitch
                        checked={settings.notifications.system}
                        onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, system: e.target.checked }
                        })}
                        label="System Notifications"
                        description="Important system updates and maintenance"
                    />
                </SettingSection>

                {/* Privacy & Security */}
                <SettingSection title="Privacy & Security" icon={Shield}>
                    <ToggleSwitch
                        checked={settings.privacy.profileVisible}
                        onChange={(e) => setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, profileVisible: e.target.checked }
                        })}
                        label="Profile Visibility"
                        description="Make your profile visible to other users"
                    />
                    <ToggleSwitch
                        checked={settings.privacy.analytics}
                        onChange={(e) => setSettings({
                            ...settings,
                            privacy: { ...settings.privacy, analytics: e.target.checked }
                        })}
                        label="Usage Analytics"
                        description="Help improve MedAI by sharing usage data"
                    />
                </SettingSection>

                {/* Appearance */}
                <SettingSection title="Appearance" icon={Palette}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Theme</label>
                        <select
                            value={settings.appearance.theme}
                            onChange={(e) => setSettings({
                                ...settings,
                                appearance: { ...settings.appearance, theme: e.target.value }
                            })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--color-glass-border)',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                        >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                            <option value="auto">Auto</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontWeight: '500', marginBottom: '0.5rem' }}>Language</label>
                        <select
                            value={settings.appearance.language}
                            onChange={(e) => setSettings({
                                ...settings,
                                appearance: { ...settings.appearance, language: e.target.value }
                            })}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--color-glass-border)',
                                borderRadius: '8px',
                                color: 'white',
                                outline: 'none'
                            }}
                        >
                            <option value="en">English</option>
                            <option value="ms">Bahasa Malaysia</option>
                            <option value="zh">中文</option>
                        </select>
                    </div>
                </SettingSection>

                {/* Data Management */}
                <SettingSection title="Data Management" icon={Database}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <button
                            onClick={exportData}
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(0, 240, 255, 0.1)',
                                border: '1px solid var(--color-primary)',
                                borderRadius: '8px',
                                color: 'var(--color-primary)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Download size={16} />
                            Export Data
                        </button>
                        <button
                            onClick={() => alert('Import functionality coming soon!')}
                            style={{
                                padding: '0.75rem 1rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--color-glass-border)',
                                borderRadius: '8px',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Upload size={16} />
                            Import Data
                        </button>
                    </div>
                </SettingSection>

                {/* Danger Zone */}
                <div style={{ padding: '1.5rem', background: 'rgba(255, 0, 85, 0.05)', border: '1px solid rgba(255, 0, 85, 0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Trash2 size={20} color="#ff0055" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ff0055' }}>Danger Zone</h3>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        These actions are irreversible. Please be careful.
                    </p>
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
                                alert('Data deletion is not implemented in demo mode.');
                            }
                        }}
                        style={{
                            padding: '0.75rem 1rem',
                            background: 'rgba(255, 0, 85, 0.1)',
                            border: '1px solid rgba(255, 0, 85, 0.3)',
                            borderRadius: '8px',
                            color: '#ff0055',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Trash2 size={16} />
                        Delete All Data
                    </button>
                </div>

                {/* Save Button */}
                <button
                    onClick={saveSettings}
                    disabled={saving}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        marginTop: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        opacity: saving ? 0.5 : 1
                    }}
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default Settings;
