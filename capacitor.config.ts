import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.pointofsales',
  appName: 'point-of-sales',
  webDir: 'dist',
    server: {
    androidScheme: 'http',
    url: 'http://192.168.161.1:5173', // <-- Port dari server Anda
    cleartext: true      
  }
};

export default config;
