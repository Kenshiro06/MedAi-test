import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';

/**
 * Custom hook to load and apply user's language preference
 * Each user has their own language setting stored in database
 */
export const useUserLanguage = (user) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const loadUserLanguage = async () => {
      if (!user?.id) return;

      try {
        // Fetch user's language preference from database
        const { data, error } = await supabase
          .from('user_settings')
          .select('language')
          .eq('account_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading user language:', error);
          return;
        }

        // Apply user's language preference
        if (data?.language) {
          i18n.changeLanguage(data.language);
        }
      } catch (error) {
        console.error('Error loading user language:', error);
      }
    };

    loadUserLanguage();
  }, [user?.id, i18n]);
};
