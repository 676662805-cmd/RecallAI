# RecallAI - AI Interview Assistant

AI-powered conversation recall and knowledge management system for interview preparation.

## 项目结构

```
RecallAI/
├── frontend/          # React + Vite 前端
├── backend/           # FastAPI + Python 后端
├── electron/          # Electron 桌面应用
└── package.json       # 根目录构建脚本
```

## 开发环境要求

- **Node.js**: v18+ 
- **Python**: 3.10+
- **npm** 或 **yarn**

## 快速开始

### 1. 克隆项目并安装依赖

```bash
git clone https://github.com/676662805-cmd/RecallAI.git
cd RecallAI

# 安装所有依赖（前端 + Electron）
npm run setup
```

### 2. 配置 Python 虚拟环境

```bash
# 创建虚拟环境
python -m venv .venv

# 激活虚拟环境
# macOS/Linux:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# 安装 Python 依赖
pip install -r backend/requirements.txt
```

### 3. 配置环境变量

在 `backend/` 目录下创建 `.env` 文件：

```env
GROQ_API_KEY=your_groq_api_key_here
MIC_DEVICE_NAME=default
```

### 4. 开发模式运行

```bash
# 同时启动前端、后端、Electron（需要3个终端）
npm run dev
```

或者分别启动：

```bash
# 终端 1: 启动前端
cd frontend && npm run dev

# 终端 2: 启动后端
cd backend && python main.py

# 终端 3: 启动 Electron
cd electron && npm run dev
```

## 打包桌面应用

### 准备工作

1. **安装 PyInstaller**（用于打包 Python 后端）：

```bash
# 确保虚拟环境已激活
pip install pyinstaller
```

2. **打包 Python 后端为可执行文件**：

#### macOS:
```bash
cd backend
pyinstaller backend_executable.spec
```
生成的可执行文件位于：`backend/dist/backend_executable`

#### Windows:
```powershell
cd backend
pyinstaller backend_executable.spec
```
生成的可执行文件位于：`backend/dist/backend_executable.exe`

### 打包 Electron 应用

#### macOS:
```bash
npm run pack:mac
```

生成的安装包：
- Apple Silicon (M1/M2/M3): `electron/dist/RecallAI-1.0.0-arm64.dmg`
- Intel: `electron/dist/RecallAI-1.0.0.dmg`

#### Windows:
```powershell
npm run pack:win
```

生成的安装包：
- `electron/dist/RecallAI Setup 1.0.0.exe`

#### Linux:
```bash
npm run pack:linux
```

生成的安装包：
- `electron/dist/RecallAI-1.0.0.AppImage`

## 重要说明

### 跨平台打包

**⚠️ Python 后端必须在目标平台上打包！**

- **在 macOS 上打包**: 只能生成 macOS 可用的后端
- **在 Windows 上打包**: 只能生成 Windows 可用的后端
- **在 Linux 上打包**: 只能生成 Linux 可用的后端

### 完整的 Windows 打包流程（在 Windows 上）

```powershell
# 1. 克隆项目
git clone https://github.com/676662805-cmd/RecallAI.git
cd RecallAI

# 2. 安装 Node.js 依赖
npm run setup

# 3. 创建 Python 虚拟环境
python -m venv .venv
.venv\Scripts\activate

# 4. 安装 Python 依赖
pip install -r backend\requirements.txt
pip install pyinstaller

# 5. 打包 Python 后端
cd backend
pyinstaller backend_executable.spec
cd ..

# 6. 打包 Electron 应用
npm run pack:win
```

## 项目功能

- ✅ 实时语音识别（Groq Whisper API）
- ✅ AI 智能卡片匹配（Groq LLaMA）
- ✅ 知识库管理（添加/编辑/删除卡片）
- ✅ 对话历史记录
- ✅ 自动启动后端服务
- ✅ 数据持久化（存储在用户目录）

## 技术栈

- **前端**: React, Vite, React Router
- **后端**: FastAPI, Python, Groq API
- **桌面**: Electron
- **打包**: electron-builder, PyInstaller

## 故障排除

### 后端无法启动

1. 检查 `.env` 文件中的 `GROQ_API_KEY` 是否正确
2. 确保 Python 虚拟环境已激活
3. 检查端口 8000 是否被占用：
   ```bash
   # macOS/Linux
   lsof -i :8000
   
   # Windows
   netstat -ano | findstr :8000
   ```

### 打包后应用无法运行

1. 确保后端可执行文件已生成：
   - macOS: `backend/dist/backend_executable`
   - Windows: `backend/dist/backend_executable.exe`

2. 手动测试后端可执行文件：
   ```bash
   # macOS/Linux
   ./backend/dist/backend_executable /tmp/test
   
   # Windows
   backend\dist\backend_executable.exe C:\temp\test
   ```

3. 检查 `electron/package.json` 中的 `extraResources` 配置是否正确

## License

MIT

## 联系方式

- GitHub: [@676662805-cmd](https://github.com/676662805-cmd)
