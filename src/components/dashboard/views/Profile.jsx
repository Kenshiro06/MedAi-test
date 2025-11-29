import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Building, Award, Save, Edit2, X, Camera, Upload, Check, Trash2, Info, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';

const Profile = ({ user }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState({});
    const [saving, setSaving] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);
    const [uploadingPicture, setUploadingPicture] = useState(false);
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [pendingImage, setPendingImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, [user]);

    const getBucketName = () => {
        const bucketMap = {
            'admin': 'admin_profile',
            'lab_technician': 'lab_profile',
            'medical_officer': 'mo_profile',
            'pathologist': 'patho_profile',
            'health_officer': 'health_profile'
        };
        return bucketMap[user.role] || 'lab_profile';
    };

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const profileTableMap = {
                'admin': 'admin_profile',
                'lab_technician': 'lab_technician_profile',
                'medical_officer': 'medical_officer_profile',
                'pathologist': 'pathologist_profile',
                'health_officer': 'health_officer_profile'
            };

            const profileTable = profileTableMap[user.role] || 'lab_technician_profile';

            const { data, error } = await supabase
                .from(profileTable)
                .select('*')
                .eq('account_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;

            setProfile(data || {});
            setEditedProfile(data || {});

            // Load profile picture if exists
            if (data?.profile_picture_url) {
                setProfilePicture(data.profile_picture_url);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfilePictureSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('Image size should be less than 5MB');
            return;
        }

        // Create preview URL
        const preview = URL.createObjectURL(file);
        setPendingImage(file);
        setPreviewUrl(preview);

        // Enable edit mode when selecting a picture
        setIsEditing(true);
    };

    const handleSaveProfilePicture = async () => {
        if (!pendingImage) return;

        setUploadingPicture(true);
        try {
            const bucketName = getBucketName();
            const fileExt = pendingImage.name.split('.').pop();
            const fileName = `${user.id}_${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload to Supabase Storage
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from(bucketName)
                .upload(filePath, pendingImage, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from(bucketName)
                .getPublicUrl(filePath);

            const publicUrl = urlData.publicUrl;

            // Update profile with new picture URL
            const profileTableMap = {
                'admin': 'admin_profile',
                'lab_technician': 'lab_technician_profile',
                'medical_officer': 'medical_officer_profile',
                'pathologist': 'pathologist_profile',
                'health_officer': 'health_officer_profile'
            };

            const profileTable = profileTableMap[user.role] || 'lab_technician_profile';

            const { error: updateError } = await supabase
                .from(profileTable)
                .upsert({
                    account_id: user.id,
                    ...profile,
                    profile_picture_url: publicUrl
                });

            if (updateError) throw updateError;

            setProfilePicture(publicUrl);
            setPendingImage(null);
            setPreviewUrl(null);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

            console.log('✅ Profile picture uploaded successfully');
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            alert('Failed to upload profile picture: ' + error.message);
        } finally {
            setUploadingPicture(false);
        }
    };

    const handleCancelProfilePicture = () => {
        setPendingImage(null);
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleRemoveProfilePicture = async () => {
        if (!profilePicture) return;

        const confirmed = window.confirm('Are you sure you want to remove your profile picture?');
        if (!confirmed) return;

        setUploadingPicture(true);
        try {
            // Extract file path from URL
            const bucketName = getBucketName();
            const urlParts = profilePicture.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const filePath = `avatars/${fileName}`;

            // Delete from storage
            const { error: deleteError } = await supabase.storage
                .from(bucketName)
                .remove([filePath]);

            if (deleteError) {
                console.warn('Storage delete error:', deleteError);
                // Continue even if storage delete fails
            }

            // Update profile to remove picture URL
            const profileTableMap = {
                'admin': 'admin_profile',
                'lab_technician': 'lab_technician_profile',
                'medical_officer': 'medical_officer_profile',
                'pathologist': 'pathologist_profile',
                'health_officer': 'health_officer_profile'
            };

            const profileTable = profileTableMap[user.role] || 'lab_technician_profile';

            const { error: updateError } = await supabase
                .from(profileTable)
                .upsert({
                    account_id: user.id,
                    ...profile,
                    profile_picture_url: null
                });

            if (updateError) throw updateError;

            setProfilePicture(null);
            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);

            console.log('✅ Profile picture removed successfully');
        } catch (error) {
            console.error('Error removing profile picture:', error);
            alert('Failed to remove profile picture: ' + error.message);
        } finally {
            setUploadingPicture(false);
        }
    };

    const saveProfile = async () => {
        setSaving(true);
        try {
            let finalProfilePictureUrl = profilePicture;

            // If there's a pending image, upload it first
            if (pendingImage) {
                const bucketName = getBucketName();
                const fileExt = pendingImage.name.split('.').pop();
                const fileName = `${user.id}_${Date.now()}.${fileExt}`;
                const filePath = `avatars/${fileName}`;

                // Upload to Supabase Storage
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from(bucketName)
                    .upload(filePath, pendingImage, {
                        cacheControl: '3600',
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: urlData } = supabase.storage
                    .from(bucketName)
                    .getPublicUrl(filePath);

                finalProfilePictureUrl = urlData.publicUrl;
            }

            const profileTableMap = {
                'admin': 'admin_profile',
                'lab_technician': 'lab_technician_profile',
                'medical_officer': 'medical_officer_profile',
                'pathologist': 'pathologist_profile',
                'health_officer': 'health_officer_profile'
            };

            const profileTable = profileTableMap[user.role] || 'lab_technician_profile';

            const { error } = await supabase
                .from(profileTable)
                .upsert({
                    account_id: user.id,
                    ...editedProfile,
                    profile_picture_url: finalProfilePictureUrl
                });

            if (error) throw error;

            // IMPORTANT: Also update IC number in auth_accounts table for login
            if (editedProfile.ic_number) {
                const { error: authError } = await supabase
                    .from('auth_accounts')
                    .update({ ic_number: editedProfile.ic_number })
                    .eq('id', user.id);

                if (authError) {
                    console.error('Error updating IC in auth_accounts:', authError);
                    // Don't throw - profile is saved, auth IC can be updated later
                }
            }

            // Update local state
            setProfilePicture(finalProfilePictureUrl);
            setPendingImage(null);
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);

            setShowSuccessMessage(true);
            setTimeout(() => setShowSuccessMessage(false), 3000);
            setIsEditing(false);
            fetchProfile();
        } catch (error) {
            console.error('Error saving profile:', error);
            alert('Failed to save profile: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const getProfileFields = () => {
        if (user.role === 'admin') {
            return [
                { key: 'full_name', label: 'Full Name', icon: User },
                { key: 'ic_number', label: 'IC/MyKad Number', icon: Award },
                { key: 'phone', label: 'Phone', icon: Phone },
                { key: 'position', label: 'Position', icon: Award },
                { key: 'address', label: 'Address', icon: MapPin, fullWidth: true }
            ];
        } else if (user.role === 'lab_technician') {
            return [
                { key: 'full_name', label: 'Full Name', icon: User },
                { key: 'ic_number', label: 'IC/MyKad Number', icon: Award },
                { key: 'license_no', label: 'License Number', icon: Award },
                { key: 'laboratory', label: 'Laboratory', icon: Building },
                { key: 'specialization', label: 'Specialization', icon: Award },
                { key: 'address', label: 'Address', icon: MapPin, fullWidth: true }
            ];
        } else if (user.role === 'medical_officer') {
            return [
                { key: 'full_name', label: 'Full Name', icon: User },
                { key: 'ic_number', label: 'IC/MyKad Number', icon: Award },
                { key: 'license_no', label: 'License Number', icon: Award },
                { key: 'department', label: 'Department', icon: Building },
                { key: 'hospital', label: 'Hospital', icon: Building },
                { key: 'address', label: 'Address', icon: MapPin, fullWidth: true }
            ];
        } else if (user.role === 'pathologist') {
            return [
                { key: 'full_name', label: 'Full Name', icon: User },
                { key: 'ic_number', label: 'IC/MyKad Number', icon: Award },
                { key: 'license_no', label: 'License Number', icon: Award },
                { key: 'specialization', label: 'Specialization', icon: Award },
                { key: 'hospital', label: 'Hospital', icon: Building },
                { key: 'years_experience', label: 'Years of Experience', icon: Award },
                { key: 'address', label: 'Address', icon: MapPin, fullWidth: true }
            ];
        } else if (user.role === 'health_officer') {
            return [
                { key: 'full_name', label: 'Full Name', icon: User },
                { key: 'ic_number', label: 'IC/MyKad Number', icon: Award },
                { key: 'district', label: 'District', icon: Building },
                { key: 'state', label: 'State', icon: Building },
                { key: 'department', label: 'Department', icon: Award },
                { key: 'address', label: 'Address', icon: MapPin, fullWidth: true }
            ];
        } else {
            return [
                { key: 'full_name', label: 'Full Name', icon: User },
                { key: 'ic_number', label: 'IC/MyKad Number', icon: Award },
                { key: 'address', label: 'Address', icon: MapPin, fullWidth: true }
            ];
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div style={{ color: 'var(--color-primary)' }}>Loading profile...</div>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Success Message */}
            <AnimatePresence>
                {showSuccessMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            position: 'fixed',
                            top: '2rem',
                            right: '2rem',
                            background: 'linear-gradient(135deg, #28c840 0%, #1ea832 100%)',
                            padding: '1rem 1.5rem',
                            borderRadius: '12px',
                            boxShadow: '0 10px 30px rgba(40, 200, 64, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            zIndex: 1000
                        }}
                    >
                        <Check size={20} />
                        <span style={{ fontWeight: '600' }}>Profile updated successfully!</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '2rem' }}
            >
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    My <span className="text-gradient">Profile</span>
                </h1>
                <p style={{ color: 'var(--color-text-muted)' }}>
                    Manage your personal information and profile picture
                </p>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem' }}>
                {/* Left Column - Profile Picture & Quick Info */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
                        {/* Profile Picture */}
                        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.5rem' }}>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                style={{
                                    width: '180px',
                                    height: '180px',
                                    borderRadius: '50%',
                                    background: (previewUrl || profilePicture)
                                        ? `url(${previewUrl || profilePicture})`
                                        : 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(255, 0, 85, 0.2) 100%)',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    border: previewUrl ? '4px solid #febc2e' : '4px solid var(--color-primary)',
                                    boxShadow: previewUrl ? '0 10px 40px rgba(254, 188, 46, 0.5)' : '0 10px 40px rgba(0, 240, 255, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '4rem',
                                    fontWeight: 'bold',
                                    color: 'var(--color-primary)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {!profilePicture && !previewUrl && (profile?.full_name?.[0] || user.email[0]).toUpperCase()}

                                {uploadingPicture && (
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '1rem'
                                    }}>
                                        Uploading...
                                    </div>
                                )}

                                {previewUrl && !uploadingPicture && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: '#febc2e',
                                        color: 'black',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '20px',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold'
                                    }}>
                                        Preview
                                    </div>
                                )}
                            </motion.div>

                            {/* Upload Button */}
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploadingPicture}
                                title="Upload profile picture"
                                style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    right: '10px',
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '50%',
                                    background: 'var(--color-primary)',
                                    border: '3px solid var(--color-bg)',
                                    color: 'black',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 5px 20px rgba(0, 240, 255, 0.5)',
                                    opacity: uploadingPicture ? 0.5 : 1
                                }}
                            >
                                <Camera size={24} />
                            </motion.button>

                            {/* Remove Button - Only show if picture exists */}
                            {profilePicture && (
                                <motion.button
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleRemoveProfilePicture}
                                    disabled={uploadingPicture}
                                    title="Remove profile picture"
                                    style={{
                                        position: 'absolute',
                                        bottom: '10px',
                                        left: '10px',
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: '#ff0055',
                                        border: '3px solid var(--color-bg)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 5px 20px rgba(255, 0, 85, 0.5)',
                                        opacity: uploadingPicture ? 0.5 : 1
                                    }}
                                >
                                    <Trash2 size={20} />
                                </motion.button>
                            )}

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureSelect}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {/* Preview Notice */}
                        <AnimatePresence>
                            {previewUrl && !uploadingPicture && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    style={{
                                        padding: '0.75rem 1rem',
                                        background: 'rgba(254, 188, 46, 0.1)',
                                        border: '1px solid #febc2e',
                                        borderRadius: '8px',
                                        marginBottom: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        fontSize: '0.875rem',
                                        color: '#febc2e'
                                    }}
                                >
                                    <Info size={16} />
                                    <span>New picture selected. Click "Save Changes" below to upload.</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div style={{ marginBottom: '1.5rem' }}>
                        </div>

                        {/* Name & Role */}
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                            {profile?.full_name || 'User'}
                        </h2>
                        <div style={{
                            display: 'inline-block',
                            padding: '0.5rem 1rem',
                            background: 'rgba(0, 240, 255, 0.1)',
                            border: '1px solid var(--color-primary)',
                            borderRadius: '20px',
                            color: 'var(--color-primary)',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            textTransform: 'capitalize',
                            marginBottom: '1.5rem'
                        }}>
                            {user.role.replace('_', ' ')}
                        </div>

                        {/* Quick Stats */}
                        <div style={{
                            padding: '1.5rem',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '12px',
                            textAlign: 'left'
                        }}>
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                    <Mail size={16} />
                                    Email
                                </div>
                                <div style={{ fontSize: '0.9rem', wordBreak: 'break-all' }}>{user.email}</div>
                            </div>

                            {profile?.license_no && (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                        <Award size={16} />
                                        License No.
                                    </div>
                                    <div style={{ fontSize: '0.9rem' }}>{profile.license_no}</div>
                                </div>
                            )}
                        </div>

                        {/* Edit Button */}
                        {!isEditing && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setIsEditing(true)}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    marginTop: '1.5rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem'
                                }}
                            >
                                <Edit2 size={18} />
                                Edit Profile
                            </motion.button>
                        )}
                    </div>
                </motion.div>

                {/* Right Column - Profile Details */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="glass-panel" style={{ padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                                {isEditing ? 'Edit Information' : 'Profile Information'}
                            </h2>
                            {isEditing && (
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditedProfile(profile);
                                        // Also cancel pending image
                                        handleCancelProfilePicture();
                                    }}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: 'transparent',
                                        border: '1px solid var(--color-glass-border)',
                                        borderRadius: '8px',
                                        color: 'var(--color-text-muted)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                            )}
                        </div>

                        {/* Profile Fields */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            {getProfileFields().map((field, index) => {
                                const Icon = field.icon;
                                return (
                                    <motion.div
                                        key={field.key}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        style={{
                                            padding: '1.5rem',
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-glass-border)',
                                            transition: 'all 0.3s ease',
                                            gridColumn: field.fullWidth ? '1 / -1' : 'auto'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                            e.currentTarget.style.borderColor = 'var(--color-primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                            e.currentTarget.style.borderColor = 'var(--color-glass-border)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.875rem', marginBottom: '0.75rem', fontWeight: '600' }}>
                                            <Icon size={16} />
                                            {field.label}
                                        </div>
                                        {isEditing ? (
                                            field.key === 'address' ? (
                                                <textarea
                                                    value={editedProfile[field.key] || ''}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, [field.key]: e.target.value })}
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                    rows={3}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid var(--color-glass-border)',
                                                        borderRadius: '8px',
                                                        color: 'white',
                                                        outline: 'none',
                                                        fontSize: '1rem',
                                                        transition: 'all 0.3s ease',
                                                        resize: 'vertical',
                                                        fontFamily: 'inherit'
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.borderColor = 'var(--color-primary)';
                                                        e.target.style.background = 'rgba(255,255,255,0.08)';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.borderColor = 'var(--color-glass-border)';
                                                        e.target.style.background = 'rgba(255,255,255,0.05)';
                                                    }}
                                                />
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={editedProfile[field.key] || ''}
                                                    onChange={(e) => setEditedProfile({ ...editedProfile, [field.key]: e.target.value })}
                                                    placeholder={`Enter ${field.label.toLowerCase()}`}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.75rem',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid var(--color-glass-border)',
                                                        borderRadius: '8px',
                                                        color: 'white',
                                                        outline: 'none',
                                                        fontSize: '1rem',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.borderColor = 'var(--color-primary)';
                                                        e.target.style.background = 'rgba(255,255,255,0.08)';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.borderColor = 'var(--color-glass-border)';
                                                        e.target.style.background = 'rgba(255,255,255,0.05)';
                                                    }}
                                                />
                                            )
                                        ) : (
                                            <div style={{ fontSize: '1.1rem', fontWeight: '600', color: profile?.[field.key] ? 'white' : 'var(--color-text-muted)', whiteSpace: field.key === 'address' ? 'pre-wrap' : 'normal' }}>
                                                {profile?.[field.key] || 'Not set'}
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>

                        {isEditing && (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={saveProfile}
                                disabled={saving}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    marginTop: '2rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    opacity: saving ? 0.5 : 1,
                                    padding: '1rem'
                                }}
                            >
                                <Save size={20} />
                                {saving ? 'Saving Changes...' : 'Save Changes'}
                            </motion.button>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Profile;
