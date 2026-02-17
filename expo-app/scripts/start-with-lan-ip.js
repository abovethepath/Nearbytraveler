#!/usr/bin/env node
/**
 * Start Expo with LAN IP so phone can connect (fixes 127.0.0.1 issue on Windows).
 * Clears Metro cache to fix "Unable to deserialize cloned data" error.
 */
const { execSync } = require('child_process');
const os = require('os');

function getLanIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

const lanIp = getLanIp();
if (lanIp) {
  console.log('Using LAN IP:', lanIp);
  process.env.REACT_NATIVE_PACKAGER_HOSTNAME = lanIp;
} else {
  console.warn('Could not detect LAN IP. Using default. Connect PC to WiFi or phone hotspot.');
}

const env = { ...process.env };
if (lanIp) env.REACT_NATIVE_PACKAGER_HOSTNAME = lanIp;
execSync('npx expo start --lan --clear', { stdio: 'inherit', env });
