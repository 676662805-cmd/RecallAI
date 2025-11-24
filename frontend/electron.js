const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let pythonProcess;

// 获取 Python 后端路径
function getPythonBackendPath() {
  if (app.isPackaged) {
    // 打包后，Python 后端在 resources/backend 目录
    return path.join(process.resourcesPath, 'backend', 'main.exe');
  } else {
    // 开发环境，在 backend 目录
    return path.join(__dirname, '..', 'backend', 'main.py');
  }
}

// 获取 Python 可执行文件路径
function getPythonExecutable() {
  if (app.isPackaged) {
    // 打包后使用编译的 exe
    return getPythonBackendPath();
  } else {
    // 开发环境使用 python
    return 'python';
  }
}

// 启动 Python 后端
function startPythonBackend() {
  const pythonPath = getPythonExecutable();
  const backendPath = getPythonBackendPath();
  
  console.log('Starting Python backend...');
  console.log('Python executable:', pythonPath);
  console.log('Backend path:', backendPath);

  try {
    if (app.isPackaged) {
      // 打包后直接运行 exe
      pythonProcess = spawn(pythonPath, [], {
        cwd: path.dirname(backendPath),
        stdio: 'pipe'
      });
    } else {
      // 开发环境运行 Python 脚本
      pythonProcess = spawn(pythonPath, [backendPath], {
        cwd: path.dirname(backendPath),
        stdio: 'pipe'
      });
    }

    pythonProcess.stdout.on('data', (data) => {
      console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on('close', (code) => {
      console.log(`Python process exited with code ${code}`);
    });

    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
    });

    console.log('Python backend started successfully');
  } catch (error) {
    console.error('Error starting Python backend:', error);
  }
}

// 创建主窗口
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 开发环境加载 Vite 开发服务器
  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 等待后端启动
function waitForBackend(callback, maxRetries = 30) {
  let retries = 0;
  const checkBackend = setInterval(() => {
    fetch('http://localhost:8000/health')
      .then(response => {
        if (response.ok) {
          clearInterval(checkBackend);
          console.log('Backend is ready!');
          callback();
        }
      })
      .catch(() => {
        retries++;
        if (retries >= maxRetries) {
          clearInterval(checkBackend);
          console.error('Backend failed to start within timeout');
          callback(); // 继续启动前端，即使后端未就绪
        }
      });
  }, 1000);
}

// 应用准备就绪
app.whenReady().then(() => {
  // 先启动 Python 后端
  startPythonBackend();

  // 等待后端启动后再创建窗口
  setTimeout(() => {
    createWindow();
  }, 3000); // 给后端 3 秒启动时间

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 应用退出前关闭 Python 进程
app.on('will-quit', () => {
  if (pythonProcess) {
    console.log('Killing Python process...');
    pythonProcess.kill();
  }
});

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});
