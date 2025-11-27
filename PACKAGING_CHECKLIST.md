# RecallAI 打包准备检查清单

## ✅ 已完成的准备工作

### 1. Electron 主进程配置
- ✅ 创建 `frontend/electron.js` - Electron 主进程入口
- ✅ 创建 `frontend/preload.js` - 安全的预加载脚本
- ✅ 配置自动启动 Python 后端
- ✅ 支持开发和生产两种模式

### 2. Package.json 配置
- ✅ 添加 Electron 和 electron-builder 依赖
- ✅ 配置打包脚本（pack, dist）
- ✅ 配置 electron-builder 打包选项
- ✅ 设置额外资源（Python exe 和 data 目录）

### 3. Python 后端准备
- ✅ 添加 `/health` 健康检查端点
- ✅ 创建 `main.spec` PyInstaller 配置文件
- ✅ 创建 `requirements.txt` 依赖列表
- ✅ 配置隐藏导入和数据文件

### 4. 打包脚本
- ✅ 创建 `build.ps1` 自动化打包脚本
- ✅ 创建 `dev.ps1` 开发环境启动脚本

## 📋 下一步操作

### 1. 安装前端依赖
```powershell
cd frontend
npm install
```

### 2. 安装 Python 依赖
```powershell
cd backend
pip install -r requirements.txt
```

### 3. 准备图标文件
- 需要在 `frontend/public/` 目录创建 `icon.ico` 文件（Windows 图标）
- 推荐尺寸：256x256 像素

### 4. 测试开发环境
```powershell
# 在项目根目录运行
.\dev.ps1
```

### 5. 执行完整打包
```powershell
# 在项目根目录运行
.\build.ps1
```

## ⚙️ 打包流程说明

1. **后端打包**：使用 PyInstaller 将 Python 代码打包成 `main.exe`
2. **前端构建**：使用 Vite 构建 React 应用到 `dist` 目录
3. **Electron 打包**：使用 electron-builder 将前端 + 后端打包成安装包
4. **输出位置**：`frontend/release/` 目录

## 🔧 可能需要的调整

1. **图标文件**：如果没有 `icon.ico`，可以使用在线工具生成或暂时注释掉 package.json 中的 icon 配置
2. **Python 路径**：确保 PyInstaller 在系统 PATH 中，或使用 `python -m PyInstaller`
3. **Node 版本**：确保 Node.js 版本 >= 16

## 📝 注意事项

- 不打包 `cloud_server` 目录（已按要求排除）
- 后端编译后的 exe 会被包含在 Electron 的 resources 目录
- 首次打包可能需要较长时间（需要下载依赖）
- 打包完成后的安装包在 `frontend/release/` 目录
