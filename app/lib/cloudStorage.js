'use client';
import { supabase } from './supabase';

// Cloud-synced storage — uses Supabase when logged in, localStorage as fallback
// Data structure: one row per user with a JSON blob of all their data

export async function loadUserData(userId) {
  if (!supabase || !userId) return null;
  
  try {
    const { data, error } = await supabase
      .from('user_data')
      .select('data')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found, which is fine for new users
      console.error('Load error:', error);
      return null;
    }
    
    return data?.data || null;
  } catch {
    return null;
  }
}

export async function saveUserData(userId, userData) {
  if (!supabase || !userId) return false;
  
  try {
    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: userId,
        data: userData,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });
    
    if (error) {
      console.error('Save error:', error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

// Migrate localStorage data to cloud on first sign-in
export function getLocalData() {
  const keys = [
    'shine-moods', 'shine-streak', 'shine-journal', 'shine-premium',
  ];
  
  const data = {};
  
  for (const key of keys) {
    try {
      const val = localStorage.getItem(key);
      if (val) data[key] = JSON.parse(val);
    } catch {}
  }
  
  // Also grab date-specific keys
  const today = new Date();
  for (let i = 0; i < 90; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    const dateKeys = [
      `shine-challenge-${dateKey}`,
      `shine-gratitude-${dateKey}`,
      `shine-wins-${dateKey}`,
      `shine-mood-today-${dateKey}`,
      `shine-evening-${dateKey}`,
      `shine-ai-usage-${dateKey}`,
      `shine-insight-${dateKey}`,
    ];
    
    for (const key of dateKeys) {
      try {
        const val = localStorage.getItem(key);
        if (val) data[key] = JSON.parse(val);
      } catch {}
    }
  }
  
  return Object.keys(data).length > 0 ? data : null;
}

// Write cloud data to localStorage for offline access
export function writeToLocal(cloudData) {
  if (!cloudData) return;
  for (const [key, value] of Object.entries(cloudData)) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }
}
