// Preload script for Electron
// 这里可以暴露安全的 API 给渲染进程使用

const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 可以在这里添加需要暴露给前端的 API
  platform: process.platform,
  isPackaged: process.env.NODE_ENV === 'production'
});
