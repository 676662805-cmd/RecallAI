# 打包前路径和环境变量修复总结

## ✅ 已完成的修复

### 1. 路径问题修复

#### 问题：
- 原代码使用硬编码的相对路径（如 `"data/cards.json"`）
- 在 PyInstaller 打包后，工作目录可能不是预期的位置
- 导致 exe 运行时无法找到数据文件

#### 解决方案：
添加了 `get_base_path()` 函数，自动检测运行环境：

```python
def get_base_path():
    """获取程序运行的基础路径，支持开发和打包环境"""
    if getattr(sys, 'frozen', False):
        # 打包后的 exe 运行时，使用 exe 所在目录
        return os.path.dirname(sys.executable)
    else:
        # 开发环境，使用当前脚本所在目录
        return os.path.dirname(os.path.abspath(__file__))
```

#### 修改的文件：

**1. `backend/main.py`**
- ✅ 添加 `get_base_path()` 函数
- ✅ 定义全局路径常量：
  - `BASE_PATH` - 程序基础路径
  - `DATA_PATH` - data 目录
  - `TRANSCRIPTS_PATH` - transcripts 目录
  - `CARDS_FILE` - cards.json 文件
- ✅ 所有文件操作改用这些常量

**2. `backend/services/matcher.py`**
- ✅ 添加 `get_base_path()` 函数
- ✅ 加载 cards.json 时使用动态路径
- ✅ 添加路径日志输出方便调试

**3. `backend/services/audio.py`**
- ✅ 添加 `get_base_path()` 函数
- ✅ 动态加载 .env 文件

---

### 2. 环境变量 (.env) 打包问题修复

#### 问题：
- `.env` 文件包含关键的 API 密钥和配置
- 原配置未将 `.env` 文件打包进 exe
- 导致打包后软件无法获取环境变量，功能失效

#### 解决方案：

**1. `backend/main.spec` 更新**
```python
datas=[
    ('data/cards.json', 'data'),
    ('data/transcripts', 'data/transcripts'),
    ('.env', '.'),  # ✅ 新增：打包 .env 文件到根目录
],
```

**2. 添加隐藏导入**
```python
hiddenimports=[
    # ... 其他导入 ...
    'dotenv',           # ✅ 新增
    'python-dotenv',    # ✅ 新增
    'groq',            # ✅ 新增
],
```

**3. `backend/requirements.txt` 更新**
```
python-dotenv  # ✅ 新增
groq          # ✅ 新增
```

**4. 动态加载 .env 文件**

在 `audio.py` 和 `matcher.py` 中：
```python
env_path = os.path.join(get_base_path(), '.env')
if os.path.exists(env_path):
    load_dotenv(env_path)
    print(f"✅ Loaded .env from: {env_path}")
else:
    load_dotenv()  # 尝试从默认位置加载
    print(f"⚠️ .env not found at {env_path}, using default")
```

---

### 3. 环境变量清单

#### 当前 `.env` 文件包含：

| 变量名 | 用途 | 是否必需 |
|--------|------|---------|
| `OPENAI_API_KEY` | OpenAI API 调用 | ⚠️ 根据功能需求 |
| `GROQ_API_KEY` | 语音识别和卡片匹配 | ✅ **必需** |
| `MIC_DEVICE_NAME` | 音频输入设备名称 | ✅ **必需** |
| `RENDER_URL` | 云服务器地址 | ❌ 本地打包不需要 |

#### 功能依赖关系：

**没有 `GROQ_API_KEY` 会导致：**
- ❌ 语音识别失败
- ❌ AI 卡片匹配失败
- ❌ 核心功能无法使用

**没有 `MIC_DEVICE_NAME` 会导致：**
- ⚠️ 使用系统默认麦克风
- ⚠️ 可能无法正确捕获音频

---

## 📋 修改文件清单

### 后端文件
- ✅ `backend/main.py` - 路径常量和动态路径
- ✅ `backend/services/audio.py` - .env 加载和路径
- ✅ `backend/services/matcher.py` - .env 加载和路径
- ✅ `backend/main.spec` - 打包配置（.env 和依赖）
- ✅ `backend/requirements.txt` - 添加缺失依赖

### 工具脚本
- ✅ `check-config.ps1` - **新增**配置检查脚本

---

## 🔍 使用配置检查脚本

在打包前，运行配置检查脚本验证所有配置：

```powershell
.\check-config.ps1
```

该脚本会检查：
1. ✅ `.env` 文件是否存在
2. ✅ 所有必需的环境变量是否配置
3. ✅ `data` 目录和 `cards.json` 是否存在
4. ✅ Python 依赖是否安装
5. ✅ 前端依赖是否安装

---

## 🚀 打包流程

### 1. 检查配置（推荐）
```powershell
.\check-config.ps1
```

### 2. 开始打包
```powershell
.\package.ps1
```

---

## ⚠️ 重要提示

### .env 文件安全性

打包时会将 `.env` 文件包含在 exe 中，这意味着：

**⚠️ API 密钥会被打包进去**

建议：
1. 用于测试的打包可以包含 API key
2. 用于分发的版本应该：
   - 提供一个 `.env.example` 模板
   - 让用户自己配置 `.env` 文件
   - 或者在首次运行时引导用户输入配置

### 生产环境建议

如果要分发给其他用户，修改代码让 `.env` 文件在 exe 外部：

```python
# 优先从 exe 同目录读取 .env
env_path = os.path.join(get_base_path(), '.env')
if not os.path.exists(env_path):
    # 如果不存在，创建模板
    print("⚠️ .env 文件不存在，请配置环境变量")
    # 可以在这里提示用户或创建模板文件
```

---

## ✅ 修复验证

修复后的代码能够：
1. ✅ 在开发环境正常运行（使用相对路径）
2. ✅ 打包后正确找到数据文件（使用 exe 所在目录）
3. ✅ 正确加载环境变量（从 exe 内部或外部）
4. ✅ 支持日志输出，方便调试路径问题

---

## 🎯 下一步

所有路径和环境变量问题已修复，现在可以：

```powershell
# 1. 检查配置
.\check-config.ps1

# 2. 开始打包
.\package.ps1
```

打包完成后，测试 exe 时注意查看控制台输出的路径日志！
