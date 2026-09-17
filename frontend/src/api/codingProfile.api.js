import api from './axios';

/**
 * Fetch fresh coding profile stats from provided platform usernames or URLs
 */
export const fetchCodingProfile = (payload, forceRefresh = false) => {
  if (Array.isArray(payload)) {
    return api.post('/coding-profile/fetch', { urls: payload, forceRefresh });
  }
  return api.post('/coding-profile/fetch', { profiles: payload, forceRefresh });
};

/**
 * Get saved coding profile from the database
 */
export const getCodingProfile = () =>
  api.get('/coding-profile');

/**
 * Delete saved coding profile
 */
export const deleteCodingProfile = () =>
  api.delete('/coding-profile');

/**
 * Preview/validate a single platform username or URL
 */
export const previewUrl = (url, platform) =>
  api.get('/coding-profile/preview', { params: { url, platform } });
