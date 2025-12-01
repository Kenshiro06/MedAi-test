import { useState, useEffect } from 'react';
import { Bell, Palette, Database, Download, Upload, Trash2, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';

const Settings = ({ user }) => {
    const { t, i18n } = useTranslation();
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
    const [loading, setLoading] = useState(true);

    // Load settings from database on mount
    useEffect(() => {
        if (user) {
            loadSettings();
        }
    }, [user]);

    // Update i18n language when settings change
    useEffect(() => {
        i18n.changeLanguage(settings.appearance.language);
    }, [settings.appearance.language, i18n]);

    const loadSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('account_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            if (data) {
                // Load from database and merge with defaults
                setSettings(prev => ({
                    ...prev,
                    notifications: {
                        ...prev.notifications,
                        email: data.email_notifications ?? true,
                        reports: data.report_notifications ?? true
                    },
                    appearance: {
                        ...prev.appearance,
                        language: data.language ?? 'en'
                    }
                }));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('user_settings')
                .upsert({
                    account_id: user.id,
                    email_notifications: settings.notifications.email,
                    report_notifications: settings.notifications.reports,
                    language: settings.appearance.language,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'account_id'
                });

            if (error) throw error;

            alert('✅ ' + t('settings.saveSuccess'));
        } catch (error) {
            console.error('Error saving settings:', error);
            alert(t('settings.saveFailed') + ': ' + error.message);
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

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div style={{ color: 'var(--color-primary)' }}>{t('settings.loading')}</div>
            </div>
        );
    }

    return (
        <div>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {t('settings.title')}
                </h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    {t('settings.subtitle')}
                </p>
            </motion.div>

            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '800px' }}>
                {/* Notifications - Essential for medical workflow */}
                <SettingSection title={t('settings.notifications')} icon={Bell}>
                    <ToggleSwitch
                        checked={settings.notifications.email}
                        onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, email: e.target.checked }
                        })}
                        label={t('settings.emailNotifications')}
                        description={t('settings.emailNotificationsDesc')}
                    />
                    <ToggleSwitch
                        checked={settings.notifications.reports}
                        onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, reports: e.target.checked }
                        })}
                        label={t('settings.reportNotifications')}
                        description={t('settings.reportNotificationsDesc')}
                    />
                </SettingSection>

                {/* Language - Essential for Malaysian users */}
                <SettingSection title={t('settings.language')} icon={Palette}>
                    <div>
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
                                outline: 'none',
                                fontSize: '1rem'
                            }}
                        >
                            <option value="en" style={{ background: '#1a1f2e', color: 'white' }}>🇬🇧 English</option>
                            <option value="ms" style={{ background: '#1a1f2e', color: 'white' }}>🇲🇾 Bahasa Malaysia</option>
                        </select>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.75rem' }}>
                            {t('settings.languageDesc')}
                        </div>
                    </div>
                </SettingSection>

                {/* Data Management */}
                <SettingSection title={t('settings.dataManagement')} icon={Database}>
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
                            {t('settings.exportData')}
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
                            {t('settings.importData')}
                        </button>
                    </div>
                </SettingSection>

                {/* Danger Zone */}
                <div style={{ padding: '1.5rem', background: 'rgba(255, 0, 85, 0.05)', border: '1px solid rgba(255, 0, 85, 0.2)', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Trash2 size={20} color="#ff0055" />
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#ff0055' }}>{t('settings.dangerZone')}</h3>
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        {t('settings.dangerZoneDesc')}
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
                        {t('settings.deleteAllData')}
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
                    {saving ? t('settings.saving') : t('settings.saveSettings')}
                </button>
            </div>
        </div>
    );
};

export default Settings;
