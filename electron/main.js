const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const Store = require('electron-store');

const store = new Store();

let mainWindow;
let popupWindow = null;
let popupPosition = null;
let backendProcess = null;

function startBackend() {
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Backend should be started via npm run dev');
    return;
  }

  let backendPath;
  let cwd;

  if (app.isPackaged) {
    const backendName = process.platform === 'win32' ? 'backend_executable.exe' : 'backend_executable';
    backendPath = path.join(process.resourcesPath, 'backend', backendName);
    cwd = path.join(process.resourcesPath, 'backend');
  } else {
    // Fallback for running packaged app in dev mode (if ever needed)
    const backendName = process.platform === 'win32' ? 'backend_executable.exe' : 'backend_executable';
    backendPath = path.join(__dirname, '../backend/dist', backendName);
    cwd = path.join(__dirname, '../backend/dist');
  }

  console.log(`Starting backend from: ${backendPath}`);

  // Pass userData path to backend so it can write data there
  const userDataPath = app.getPath('userData');
  console.log(`Backend data directory: ${userDataPath}`);

  // Set environment variables for backend
  const env = Object.assign({}, process.env, {
    GROQ_API_KEY: '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',
    MIC_DEVICE_NAME: 'default'
  });

  backendProcess = spawn(backendPath, [userDataPath], {
    cwd: cwd,
    env: env,
    // stdio: 'ignore' // Uncomment to hide backend output in production
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  backendProcess.on('error', (err) => {
    console.error('Failed to start backend:', err);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    backendProcess = null;
  });
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 在开发模式下加载 Vite 开发服务器
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式下加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../frontend/dist/index.html'));
  }
}

function createPopupWindow(cardData) {
  // 如果已存在弹窗，先关闭并保存位置
  if (popupWindow && !popupWindow.isDestroyed()) {
    const bounds = popupWindow.getBounds();
    popupPosition = { x: bounds.x, y: bounds.y };
    popupWindow.close();
  }

  // 获取屏幕尺寸
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // 确定弹窗位置：如果有保存的位置就用保存的，否则右上角
  let x, y;
  if (popupPosition) {
    x = popupPosition.x;
    y = popupPosition.y;
  } else {
    // 恢复上次保存的位置，或使用默认右上角位置
    const savedPosition = store.get('popupPosition');
    if (savedPosition) {
      x = savedPosition.x;
      y = savedPosition.y;
    } else {
      x = width - 370; // 右上角，留边距
      y = 20;
    }
  }

  popupWindow = new BrowserWindow({
    width: 350,
    height: 200,
    x: x,
    y: y,
    frame: false, // 无边框
    alwaysOnTop: true, // 始终置顶 - 幽灵弹窗的核心特性
    transparent: true, // 透明背景
    resizable: false, // 不允许手动调整大小
    skipTaskbar: true, // 不在任务栏显示
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // 加载弹窗内容
  popupWindow.loadFile(path.join(__dirname, 'popup.html'));

  // 发送卡片数据到弹窗
  popupWindow.webContents.on('did-finish-load', () => {
    popupWindow.webContents.send('card-data', cardData);
    
    // 自动调整窗口大小以适应内容
    setTimeout(() => {
      popupWindow.webContents.executeJavaScript(`
        (function() {
          const container = document.querySelector('.popup-container');
          if (container) {
            const rect = container.getBoundingClientRect();
            return {
              width: Math.ceil(rect.width),
              height: Math.ceil(rect.height)
            };
          }
          return null;
        })();
      `).then(size => {
        if (size && popupWindow && !popupWindow.isDestroyed()) {
          const bounds = popupWindow.getBounds();
          const newWidth = Math.max(320, Math.min(620, size.width + 40));
          const newHeight = Math.max(170, Math.min(600, size.height + 40));
          
          popupWindow.setBounds({
            x: bounds.x,
            y: bounds.y,
            width: newWidth,
            height: newHeight
          });
        }
      }).catch(err => console.error('Error adjusting window size:', err));
    }, 150);
  });

  // 窗口关闭时保存位置
  popupWindow.on('close', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      const bounds = popupWindow.getBounds();
      popupPosition = { x: bounds.x, y: bounds.y };
      store.set('popupPosition', popupPosition);
    }
  });

  // 监听窗口移动，更新位置
  popupWindow.on('move', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      const bounds = popupWindow.getBounds();
      popupPosition = { x: bounds.x, y: bounds.y };
    }
  });
}

app.whenReady().then(() => {
  startBackend();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('will-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 监听创建弹窗的请求
ipcMain.on('show-popup', (event, cardData) => {
  createPopupWindow(cardData);
});

// 监听关闭弹窗的请求
ipcMain.on('close-popup', () => {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.close();
  }
});