const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const net = require('net');

const store = new Store();

let mainWindow;
let popupWindow = null;
let popupPosition = null;
let backendProcess = null;
let isQuitting = false;

// 检查端口是否被占用
function checkPort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false); // 端口被占用
      } else {
        resolve(true);
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(true); // 端口可用
    });
    
    server.listen(port, '127.0.0.1');
  });
}

// 强制结束占用端口的进程（Windows）
async function killProcessOnPort(port) {
  if (process.platform !== 'win32') return;
  
  return new Promise((resolve) => {
    const { exec } = require('child_process');
    exec(`netstat -ano | findstr :${port}`, (error, stdout) => {
      if (error || !stdout) {
        resolve();
        return;
      }
      
      const lines = stdout.split('\n');
      const pids = new Set();
      
      for (const line of lines) {
        const match = line.match(/LISTENING\s+(\d+)/);
        if (match) {
          pids.add(match[1]);
        }
      }
      
      if (pids.size > 0) {
        console.log(`⚠️ Found processes occupying port ${port}: ${Array.from(pids).join(', ')}`);
        const killCommands = Array.from(pids).map(pid => `taskkill /F /PID ${pid}`).join(' & ');
        exec(killCommands, (err) => {
          if (err) console.error('❌ Error killing processes:', err);
          else console.log('✅ Successfully killed processes on port ' + port);
          resolve();
        });
      } else {
        resolve();
      }
    });
  });
}

function loadEnvFile(envPath) {
  const env = {};
  
  if (!fs.existsSync(envPath)) {
    console.warn(`⚠️ .env file not found at: ${envPath}`);
    return env;
  }

  try {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
    
    console.log(`✅ Loaded .env file from: ${envPath}`);
    console.log(`   Found keys: ${Object.keys(env).join(', ')}`);
  } catch (err) {
    console.error(`❌ Error reading .env file:`, err);
  }
  
  return env;
}

async function startBackend() {
  // 检查后端是否已经在运行
  if (backendProcess && !backendProcess.killed) {
    console.log('⚠️ Backend process already running (PID: ' + backendProcess.pid + ')');
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Backend should be started via npm run dev');
    return;
  }

  // 检查端口是否可用
  const portAvailable = await checkPort(8000);
  if (!portAvailable) {
    console.error('❌ Port 8000 is already in use!');
    console.log('🛠️ Attempting to kill process on port 8000...');
    await killProcessOnPort(8000);
    
    // 等待一下让端口释放
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const stillOccupied = !(await checkPort(8000));
    if (stillOccupied) {
      console.error('❌ Failed to free port 8000. Please close other applications using this port.');
      return;
    }
  }

  let backendPath;
  let cwd;
  let envPath;

  if (app.isPackaged) {
    const backendName = process.platform === 'win32' ? 'main.exe' : 'main';
    backendPath = path.join(process.resourcesPath, 'backend', backendName);
    cwd = path.join(process.resourcesPath, 'backend');
    envPath = path.join(process.resourcesPath, 'backend', '.env');
  } else {
    const backendName = process.platform === 'win32' ? 'main.exe' : 'main';
    backendPath = path.join(__dirname, '../backend/dist', backendName);
    cwd = path.join(__dirname, '../backend/dist');
    envPath = path.join(__dirname, '../backend', '.env');
  }

  console.log(`Starting backend from: ${backendPath}`);
  console.log(`Working directory: ${cwd}`);
  console.log(`Looking for .env at: ${envPath}`);

  const envVars = loadEnvFile(envPath);

  const userDataPath = app.getPath('userData');
  console.log(`Backend data directory: ${userDataPath}`);

  const env = {
    ...process.env,
    ...envVars,
    PYTHONUNBUFFERED: '1'
  };

  console.log('🚀 Starting backend with environment variables...');
  if (envVars.GROQ_API_KEY) {
    console.log('   GROQ_API_KEY: ✅ Found');
  } else {
    console.error('   GROQ_API_KEY: ❌ Missing!');
  }

  backendProcess = spawn(backendPath, [], {
    cwd: cwd,
    env: env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  console.log(`✅ Backend process started with PID: ${backendProcess.pid}`);

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data.toString()}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data.toString()}`);
  });

  backendProcess.on('error', (err) => {
    console.error('❌ Failed to start backend:', err);
    backendProcess = null;
  });

  backendProcess.on('close', (code) => {
    console.log(`⚠️ Backend process exited with code ${code}`);
    backendProcess = null;
    
    // 如果不是正常退出且应用未关闭，尝试重启
    if (code !== 0 && !isQuitting && mainWindow && !mainWindow.isDestroyed()) {
      console.log('🔄 Backend crashed, attempting to restart in 3 seconds...');
      setTimeout(() => {
        if (!isQuitting) {
          startBackend();
        }
      }, 3000);
    }
  });
  
  // 健康检查：等待3秒后检查后端是否成功启动
  setTimeout(async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/health', { 
        signal: AbortSignal.timeout(2000) 
      });
      if (response.ok) {
        console.log('✅ Backend health check passed');
      } else {
        console.error('❌ Backend health check failed');
      }
    } catch (err) {
      console.error('❌ Backend not responding to health check:', err.message);
    }
  }, 3000);
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
  const { width, height } = primaryDisplay.workAreaSize;

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

app.on('before-quit', (e) => {
  console.log('🚪 Application before-quit event');
  isQuitting = true;
  
  if (backendProcess && !backendProcess.killed) {
    console.log(`Killing backend process (PID: ${backendProcess.pid})...`);
    
    // 阻止退出，等待后端关闭
    e.preventDefault();
    
    try {
      // 先尝试正常关闭
      backendProcess.kill('SIGTERM');
      
      // 1秒后强制关闭
      setTimeout(() => {
        if (backendProcess && !backendProcess.killed) {
          console.log('⚠️ Force killing backend process...');
          backendProcess.kill('SIGKILL');
        }
        backendProcess = null;
        
        // 继续退出
        app.exit(0);
      }, 1000);
    } catch (err) {
      console.error('❌ Error killing backend process:', err);
      backendProcess = null;
      app.exit(0);
    }
  }
});

app.on('will-quit', () => {
  console.log('🚪 Application will-quit event');
  // 确保后端进程被清理
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.kill('SIGKILL');
    } catch (err) {
      console.error('Error in will-quit:', err);
    }
    backendProcess = null;
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
