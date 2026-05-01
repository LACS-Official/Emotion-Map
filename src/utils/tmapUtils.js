/**
 * Tencent Maps (TMap) Utility Functions
 * Used for the Emotion Map project - Tencent LBS Developer Contest
 */

/**
 * Loads the TMap script asynchronously if not already present
 * @param {string} key - Tencent Maps API Key
 * @param {string[]} libraries - Optional libraries to load (visual, service, etc.)
 * @returns {Promise}
 */
export const loadTMapScript = (key, libraries = []) => {
  return new Promise((resolve, reject) => {
    if (window.TMap) {
      resolve(window.TMap);
      return;
    }
    const script = document.createElement('script');
    const libs = libraries.length > 0 ? `&libraries=${libraries.join(',')}` : '';
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${key}${libs}`;
    script.async = true;
    script.onload = () => resolve(window.TMap);
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

/**
 * Format coordinates for TMap
 * @param {number} lat 
 * @param {number} lng 
 * @returns {TMap.LatLng | null}
 */
export const createLatLng = (lat, lng) => {
  if (window.TMap && !isNaN(lat) && !isNaN(lng)) {
    return new window.TMap.LatLng(lat, lng);
  }
  return null;
};

/**
 * Debounce function for search inputs
 */
export const debounce = (fn, delay) => {
  let timer = null;
  return function (...args) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};
