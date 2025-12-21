/**
 * Date utility functions for Malaysia timezone (GMT+8)
 */

const MALAYSIA_TIMEZONE = 'Asia/Kuala_Lumpur';

/**
 * Format date to Malaysia timezone
 * @param {string|Date} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
export const formatMalaysiaDate = (date, includeTime = true) => {
    if (!date) return 'N/A';

    try {
        const dateObj = new Date(date);

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            return 'Invalid Date';
        }

        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: MALAYSIA_TIMEZONE
        };

        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
            options.hour12 = true;
        }

        // Use en-GB for consistent DD/MM/YYYY format, then convert to Malaysia timezone
        const formatted = dateObj.toLocaleString('en-GB', options);

        // Convert to en-MY format (DD/MM/YYYY, HH:MM AM/PM)
        return formatted.replace(',', '');
    } catch (error) {
        console.error('Error formatting date:', error, date);
        return 'Invalid Date';
    }
};

/**
 * Get current Malaysia time as ISO string
 * @returns {string} ISO string in Malaysia timezone
 */
export const getMalaysiaTimeNow = () => {
    return new Date().toLocaleString('en-US', { timeZone: MALAYSIA_TIMEZONE });
};

/**
 * Convert UTC timestamp to Malaysia timezone
 * @param {string} utcTimestamp - UTC timestamp from database
 * @returns {string} Formatted Malaysia time
 */
export const utcToMalaysia = (utcTimestamp) => {
    if (!utcTimestamp) return null;

    try {
        const date = new Date(utcTimestamp);
        return date.toLocaleString('en-MY', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
            timeZone: MALAYSIA_TIMEZONE
        });
    } catch (error) {
        console.error('Error converting UTC to Malaysia time:', error);
        return null;
    }
};

/**
 * Get date only (no time) in Malaysia timezone
 * @param {string|Date} date - Date to format
 * @returns {string} Date string (DD/MM/YYYY)
 */
export const formatMalaysiaDateOnly = (date) => {
    if (!date) return null;

    try {
        return new Date(date).toLocaleDateString('en-MY', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: MALAYSIA_TIMEZONE
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return null;
    }
};
