import { Capacitor } from '@capacitor/core';

// Default for web browser
const API_LOCALHOST = 'http://localhost:3001'; 
// const API_LOCALHOST = 'https://point-of-sales-vj.et.r.appspot.com'; 

// Special IP for Android Emulator
const API_ANDROID_EMULATOR = 'https://point-of-sales-vj.et.r.appspot.com';

// Check if running on native Android platform
const isAndroid = Capacitor.getPlatform() === 'android';

// Export the correct base URL
export const API_BASE_URL = isAndroid ? API_ANDROID_EMULATOR : API_LOCALHOST;
