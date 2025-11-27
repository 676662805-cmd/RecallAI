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
    const backendName = process.platform === 'win32' ? 'main.exe' : 'main';
    backendPath = path.join(process.resourcesPath, 'backend', backendName);
    cwd = path.join(process.resourcesPath, 'backend');
  } else {
    const backendName = process.platform === 'win32' ? 'main.exe' : 'main';
    backendPath = path.join(__dirname, '../backend/dist', backendName);
    cwd = path.join(__dirname, '../backend/dist');
  }

  console.log(`Starting backend from: ${backendPath}`);

  const userDataPath = app.getPath('userData');
  console.log(`Backend data directory: ${userDataPath}`);

  const env = Object.assign({}, process.env, {
    GROQ_API_KEY: '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',
    MIC_DEVICE_NAME: 'default'
  });

  backendProcess = spawn(backendPath, [], {
    cwd: cwd,
    env: env,
    stdio: 'pipe'
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

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

function createPopupWindow(cardData) {
  // Close existing popup and save position
  if (popupWindow && !popupWindow.isDestroyed()) {
    const bounds = popupWindow.getBounds();
    popupPosition = { x: bounds.x, y: bounds.y };
    popupWindow.close();
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  // Determine popup position
  let x, y;
  if (popupPosition) {
    x = popupPosition.x;
    y = popupPosition.y;
  } else {
    const savedPosition = store.get('popupPosition');
    if (savedPosition) {
      x = savedPosition.x;
      y = savedPosition.y;
    } else {
      x = width - 370; // Top right corner with margin
      y = 20;
    }
  }

  popupWindow = new BrowserWindow({
    width: 350,
    height: 200,
    x: x,
    y: y,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  popupWindow.loadFile(path.join(__dirname, 'popup.html'));

  popupWindow.webContents.on('did-finish-load', () => {
    popupWindow.webContents.send('card-data', cardData);
    
    // Auto-adjust window size to fit content
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

  popupWindow.on('close', () => {
    if (popupWindow && !popupWindow.isDestroyed()) {
      const bounds = popupWindow.getBounds();
      popupPosition = { x: bounds.x, y: bounds.y };
      store.set('popupPosition', popupPosition);
    }
  });

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

// Listen for create popup request
ipcMain.on('show-popup', (event, cardData) => {
  createPopupWindow(cardData);
});

// Listen for close popup request
ipcMain.on('close-popup', () => {
  if (popupWindow && !popupWindow.isDestroyed()) {
    popupWindow.close();
  }
});
