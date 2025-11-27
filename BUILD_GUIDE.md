# RecallAI 打包指南

## 🎯 准备工作已完成！

所有打包前的准备工作已经就绪，现在可以开始打包流程。

## 📦 立即开始打包

### 第一步：安装依赖

#### 1. 安装前端依赖
```powershell
cd frontend
npm install
```

这将安装：
- Electron
- electron-builder
- React 和相关依赖
- 开发工具

#### 2. 安装 Python 依赖
```powershell
cd backend
pip install -r requirements.txt
```

这将安装：
- FastAPI
- Uvicorn
- SpeechRecognition
- PyAudio
- PyTTS3
- PyInstaller

### 第二步：执行打包

回到项目根目录（RecallAI），运行：

```powershell
.\build.ps1
```

打包脚本会自动完成：
1. ✅ 打包 Python 后端为 main.exe
2. ✅ 构建 React 前端
3. ✅ 使用 Electron Builder 打包完整应用
4. ✅ 生成 Windows 安装程序

### 第三步：找到安装包

打包完成后，安装包位于：
```
frontend/release/
```

查找 `.exe` 安装文件，双击即可安装！

## 🔧 可选：测试开发环境

在打包之前，你可以先测试开发环境：

```powershell
# 在项目根目录运行
.\dev.ps1
```

这将同时启动后端和前端开发服务器。

## 📋 已完成的配置清单

### ✅ Frontend (Electron)
- [x] `electron.js` - 主进程，管理窗口和 Python 后端
- [x] `preload.js` - 安全的预加载脚本
- [x] `package.json` - 完整的打包配置
- [x] 开发和生产环境支持

### ✅ Backend (Python + FastAPI)
- [x] `main.py` - 添加了 /health 端点和 uvicorn 启动代码
- [x] `main.spec` - PyInstaller 配置
- [x] `requirements.txt` - 所有依赖
- [x] 数据目录配置（cards.json, transcripts）

### ✅ 构建脚本
- [x] `build.ps1` - 自动化打包脚本
- [x] `dev.ps1` - 开发环境启动脚本

### ✅ 文档
- [x] `PACKAGING_CHECKLIST.md` - 详细检查清单
- [x] `BUILD_GUIDE.md` - 本指南
- [x] `frontend/public/ICON_README.md` - 图标说明

## 🎨 关于图标

目前已临时移除图标要求，应用会使用默认图标。

如需自定义图标，请参考 `frontend/public/ICON_README.md`。

## ⚠️ 注意事项

1. **首次打包较慢**：第一次打包需要下载所有依赖，可能需要 10-30 分钟
2. **网络连接**：确保网络畅通，electron-builder 需要下载二进制文件
3. **磁盘空间**：确保至少有 2GB 可用空间
4. **杀毒软件**：可能需要暂时关闭，以免误报

## 🚀 打包后测试

安装完成后，测试以下功能：
- [ ] 应用能正常启动
- [ ] 后端服务自动启动（检查端口 8000）
- [ ] 前端界面正常显示
- [ ] 知识库页面功能正常
- [ ] 音频识别功能正常
- [ ] Transcript 历史记录正常

## 🐛 常见问题

### Q: PyInstaller 打包失败
A: 确保所有依赖都已安装：`pip install -r requirements.txt`

### Q: Electron 打包提示缺少 main.exe
A: 先完成 Python 后端打包，确保 `backend/dist/main.exe` 存在

### Q: npm install 失败
A: 尝试清理缓存：`npm cache clean --force`，然后重新安装

### Q: 打包后应用无法启动
A: 检查 `backend/dist/main.exe` 是否正常运行（双击测试）

## 📞 获取帮助

如遇到问题，检查：
1. 控制台错误信息
2. `frontend/release/` 目录下的日志
3. Windows 事件查看器

---

**准备好了吗？运行 `.\build.ps1` 开始打包！** 🚀
