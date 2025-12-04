const { contextBridge, ipcRenderer } = require('electron');

// 为渲染进程暴露安全的API
contextBridge.exposeInMainWorld('electronAPI', {
  // 显示弹窗
  showPopup: (cardData) => {
    ipcRenderer.send('show-popup', cardData);
  },
  
  // 关闭弹窗
  closePopup: () => {
    ipcRenderer.send('close-popup');
  },
  
  // 监听卡片数据
  onCardData: (callback) => {
    ipcRenderer.on('card-data', (event, data) => callback(data));
  },
  
  // ✨ 自动更新 API
  checkForUpdates: () => {
    ipcRenderer.send('check-for-updates');
  },
  
  downloadUpdate: () => {
    ipcRenderer.send('download-update');
  },
  
  installUpdate: () => {
    ipcRenderer.send('install-update');
  },
  
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
  },
  
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  }
});
