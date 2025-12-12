const { app, BrowserWindow, ipcMain, screen } = require('electron');
const { autoUpdater } = require('electron-updater');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const Store = require('electron-store');
const net = require('net');

// 🚀 性能优化：禁用后台节流，确保卡片即时弹出
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

const store = new Store();

let mainWindow;
let popupWindow = null;
let popupPosition = null;
let backendProcess = null;
let isQuitting = false;
let isCleaningUp = false; // ✨ 防止重复清理
let backendHealthCheckInterval = null; // ✨ 后端健康检查定时器

// 📝 日志文件路径
const logPath = path.join(app.getPath('userData'), 'update.log');

// 日志函数
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  try {
    fs.appendFileSync(logPath, logMessage);
  } catch (err) {
    console.error('Failed to write log:', err);
  }
}

// ✨ 自动更新配置
autoUpdater.autoDownload = false; // 不自动下载，先询问用户
autoUpdater.autoInstallOnAppQuit = true; // 退出时自动安装
autoUpdater.logger = {
  info: (msg) => log(`ℹ️ ${msg}`),
  warn: (msg) => log(`⚠️ ${msg}`),
  error: (msg) => log(`❌ ${msg}`)
};

log(`📁 Log file: ${logPath}`);
log(`📦 App version: ${app.getVersion()}`);

// 自动更新事件监听
autoUpdater.on('checking-for-update', () => {
  log('🔍 Checking for updates...');
});

autoUpdater.on('update-available', (info) => {
  log(`✨ Update available: ${info.version}`);
  log(`📅 Release date: ${info.releaseDate}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-available', info);
  }
});

autoUpdater.on('update-not-available', (info) => {
  log(`✅ App is up to date: ${info.version}`);
});

autoUpdater.on('error', (err) => {
  log(`❌ Update error: ${err.message}`);
  log(`Stack: ${err.stack}`);
});

autoUpdater.on('download-progress', (progressObj) => {
  const logMessage = `📥 Download progress: ${progressObj.percent.toFixed(2)}% (${(progressObj.bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s)`;
  log(logMessage);
  if (mainWindow) {
    mainWindow.webContents.send('download-progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log(`✅ Update downloaded: ${info.version}`);
  if (mainWindow) {
    mainWindow.webContents.send('update-downloaded', info);
  }
});

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
  console.log('🔧 startBackend() called');
  log('🔧 startBackend() called');
  
  // 检查后端是否已经在运行
  if (backendProcess && !backendProcess.killed) {
    console.log('⚠️ Backend process already running (PID: ' + backendProcess.pid + ')');
    log('⚠️ Backend already running (PID: ' + backendProcess.pid + ')');
    return;
  }

  // ✨ 修复：使用 app.isPackaged 判断是否为打包环境
  console.log(`📦 app.isPackaged: ${app.isPackaged}`);
  log(`📦 app.isPackaged: ${app.isPackaged}`);
  
  if (!app.isPackaged) {
    console.log('Development mode: Backend should be started via npm run dev');
    log('Development mode: Backend should be started manually');
    return;
  }

  console.log('✅ Starting backend in packaged mode...');
  log('✅ Starting backend in packaged mode...');

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
  log(`📂 Backend path: ${backendPath}`);
  log(`📂 Working directory: ${cwd}`);
  log(`📂 Env path: ${envPath}`);

  const envVars = loadEnvFile(envPath);

  const userDataPath = app.getPath('userData');
  console.log(`Backend data directory: ${userDataPath}`);

  const env = {
    ...process.env,
    ...envVars,
    PYTHONUNBUFFERED: '1',
    PYTHONIOENCODING: 'utf-8'  // ✨ 设置 Python 输出编码为 UTF-8，避免 Windows GBK 编码错误
  };

  console.log('🚀 Starting backend...');
  log('🚀 Starting backend...');

  backendProcess = spawn(backendPath, [], {
    cwd: cwd,
    env: env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  console.log(`✅ Backend process started with PID: ${backendProcess.pid}`);
  log(`✅ Backend process started with PID: ${backendProcess.pid}`);

  backendProcess.stdout.on('data', (data) => {
    const message = data.toString();
    console.log(`Backend: ${message}`);
    log(`Backend: ${message}`);
  });

  backendProcess.stderr.on('data', (data) => {
    const message = data.toString();
    console.error(`Backend Error: ${message}`);
    log(`Backend Error: ${message}`);
  });

  backendProcess.on('error', (err) => {
    console.error('❌ Failed to start backend:', err);
    log(`❌ Failed to start backend: ${err.message}`);
    backendProcess = null;
  });

  // 🚀 提高后端进程优先级，防止被 Zoom/Teams 占用
  try {
    if (process.platform === 'win32' && backendProcess.pid) {
      const { exec } = require('child_process');
      // 设置为高优先级（HIGH_PRIORITY_CLASS）
      exec(`wmic process where ProcessId=${backendProcess.pid} CALL setpriority "high priority"`, (err) => {
        if (err) console.warn('⚠️ Could not set backend priority:', err.message);
        else console.log('✅ Backend process priority set to HIGH');
      });
    }
  } catch (err) {
    console.warn('⚠️ Failed to set process priority:', err);
  }

  backendProcess.on('close', (code) => {
    console.log(`⚠️ Backend process exited with code ${code}`);
    log(`⚠️ Backend process exited with code ${code}`);
    backendProcess = null;
    
    // ✨ 如果不是正在退出，尝试重启后端
    if (!isQuitting && !isCleaningUp) {
      console.log('🔄 Backend crashed unexpectedly, will restart in 2 seconds...');
      log('🔄 Backend crashed, restarting in 2s...');
      setTimeout(() => {
        if (!isQuitting && !isCleaningUp) {
          console.log('🚀 Attempting to restart backend...');
          log('🚀 Attempting backend restart...');
          startBackend();
        }
      }, 2000);
    }
  });

  return backendProcess;
}

// ✨ 后端健康检查函数
async function checkBackendHealth() {
  try {
    const response = await fetch('http://127.0.0.1:8000/api/poll', { 
      method: 'GET',
      timeout: 3000 
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// ✨ 启动后端健康检查定时器（每5秒检查一次，更频繁）
function startBackendHealthCheck() {
  if (backendHealthCheckInterval) {
    clearInterval(backendHealthCheckInterval);
  }
  
  backendHealthCheckInterval = setInterval(async () => {
    if (isQuitting || isCleaningUp) {
      return; // 如果正在退出，不执行检查
    }
    
    const isHealthy = await checkBackendHealth();
    
    if (!isHealthy) {
      console.log('⚠️ Backend health check failed, attempting immediate restart...');
      
      // 检查进程是否还存在
      if (!backendProcess || backendProcess.killed) {
        console.log('🚀 Backend process not running, starting immediately...');
        await startBackend();
        
        // 等待2秒验证启动
        await new Promise(resolve => setTimeout(resolve, 2000));
        const stillHealthy = await checkBackendHealth();
        if (stillHealthy) {
          console.log('✅ Backend restarted successfully');
        } else {
          console.error('❌ Backend restart failed, will retry in next check');
        }
      } else {
        console.log('🔄 Backend process exists but not responding, restarting...');
        try {
          backendProcess.kill('SIGTERM');
          backendProcess = null;
          await new Promise(resolve => setTimeout(resolve, 1000));
          await startBackend();
        } catch (err) {
          console.error('❌ Error restarting backend:', err);
        }
      }
    } else {
      // console.log('✅ Backend health check passed');
    }
  }, 5000); // ✨ 改为每5秒检查一次，更快发现问题
  
  console.log('✅ Backend health check started (interval: 5s)');
}

// ✨ 停止健康检查
function stopBackendHealthCheck() {
  if (backendHealthCheckInterval) {
    clearInterval(backendHealthCheckInterval);
    backendHealthCheckInterval = null;
    console.log('🛑 Backend health check stopped');
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public/icon.png'),
    autoHideMenuBar: true, // 隐藏菜单栏（按 Alt 可显示）
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false // 禁用后台节流
    }
  });

  // 完全移除菜单栏
  mainWindow.setMenuBarVisibility(false);

  // ✨ 监听窗口关闭事件，确保触发应用退出流程
  mainWindow.on('close', () => {
    console.log('🪟 Main window closing...');
  });

  // ✨ 使用 app.isPackaged 判断环境
  if (!app.isPackaged) {
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

app.whenReady().then(async () => {
  // ✨ 启动后端（带重试机制）
  let backendStarted = false;
  let retryCount = 0;
  const maxRetries = 5;
  
  while (!backendStarted && retryCount < maxRetries) {
    try {
      await startBackend();
      
      // 等待2秒检查后端是否真的启动成功
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const isHealthy = await checkBackendHealth();
      if (isHealthy) {
        console.log('✅ Backend started successfully');
        backendStarted = true;
      } else {
        retryCount++;
        console.warn(`⚠️ Backend health check failed, retry ${retryCount}/${maxRetries}...`);
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err) {
      retryCount++;
      console.error(`❌ Backend start failed (attempt ${retryCount}/${maxRetries}):`, err);
      if (retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  if (!backendStarted) {
    console.error('❌ Failed to start backend after', maxRetries, 'attempts');
    // 即使失败也继续，健康检查会继续尝试
  }
  
  // ✨ 启动后端健康检查（作为备用保障）
  startBackendHealthCheck();
  
  // 后端就绪后再创建前端窗口
  createMainWindow();
  
  // ✨ 启动后 3 秒检查更新（避免影响启动速度）
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('before-quit', async (e) => {
  console.log('🚪 Application before-quit event');
  
  // ✨ 停止健康检查
  stopBackendHealthCheck();
  
  // ✨ 防止重复清理
  if (isCleaningUp) {
    console.log('⏳ Already cleaning up, skipping...');
    return;
  }
  
  isQuitting = true;
  
  if (backendProcess && !backendProcess.killed) {
    console.log(`Killing backend process (PID: ${backendProcess.pid})...`);
    
    // 阻止退出，等待后端关闭
    e.preventDefault();
    isCleaningUp = true; // ✨ 标记正在清理
    
    try {
      // 先尝试正常关闭
      backendProcess.kill('SIGTERM');
      
      // 等待后端进程结束
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          if (backendProcess && !backendProcess.killed) {
            console.log('⚠️ Force killing backend process...');
            try {
              backendProcess.kill('SIGKILL');
            } catch (err) {
              console.error('Error force killing:', err);
            }
          }
          resolve();
        }, 2000); // ✨ 增加到2秒，给后端更多时间优雅关闭
        
        if (backendProcess) {
          backendProcess.on('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        } else {
          clearTimeout(timeout);
          resolve();
        }
      });
      
      backendProcess = null;
      
      // 额外清理：确保端口被释放
      await killProcessOnPort(8000);
      
      console.log('✅ Backend process cleaned up');
      
      // 继续退出
      isCleaningUp = false;
      app.exit(0);
    } catch (err) {
      console.error('❌ Error killing backend process:', err);
      backendProcess = null;
      isCleaningUp = false;
      app.exit(0);
    }
  } else {
    console.log('✅ No backend process to clean up');
  }
});

app.on('will-quit', async () => {
  console.log('🚪 Application will-quit event');
  
  // 确保后端进程被清理（最后的保险）
  if (backendProcess && !backendProcess.killed) {
    console.log('⚠️ will-quit: Backend still running, force killing...');
    try {
      backendProcess.kill('SIGKILL');
      backendProcess = null;
    } catch (err) {
      console.error('Error in will-quit:', err);
    }
  }
  
  // 最后的保险：清理所有占用 8000 端口的进程
  try {
    await killProcessOnPort(8000);
    console.log('✅ Final cleanup: Port 8000 cleared');
  } catch (err) {
    console.error('Error clearing port 8000:', err);
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

// ✨ 自动更新 IPC 处理
ipcMain.on('check-for-updates', () => {
  log('🔄 Manual check for updates triggered');
  autoUpdater.checkForUpdates();
});

ipcMain.on('download-update', () => {
  log('📥 Download update triggered');
  autoUpdater.downloadUpdate();
});

ipcMain.on('install-update', () => {
  log('🔧 Install update triggered');
  autoUpdater.quitAndInstall();
});

// 获取日志文件路径
ipcMain.handle('get-log-path', () => {
  return logPath;
});
