const { contextBridge, ipcRenderer } = require('electron');

// 涓烘覆鏌撹繘绋嬫毚闇插畨鍏ㄧ殑API
contextBridge.exposeInMainWorld('electronAPI', {
  // 鏄剧ず寮圭獥
  showPopup: (cardData) => {
    ipcRenderer.send('show-popup', cardData);
  },
  
  // 鍏抽棴寮圭獥
  closePopup: () => {
    ipcRenderer.send('close-popup');
  },
  
  // 鐩戝惉鍗＄墖鏁版嵁
  onCardData: (callback) => {
    ipcRenderer.on('card-data', (event, data) => callback(data));
  }
});
