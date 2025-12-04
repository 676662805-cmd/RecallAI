# 自动更新发布指南

本项目使用 `electron-updater` + GitHub Releases 实现自动更新功能。

## 📦 发布新版本步骤

### 1. 更新版本号
编辑 `frontend/package.json`，修改 `version` 字段：
```json
{
  "version": "1.0.1"  // 从 1.0.0 改为 1.0.1
}
```

### 2. 打包应用
```powershell
cd frontend
npm run build
npm run dist
```

这会在 `frontend/release` 目录生成：
- `RecallAI Setup 1.0.1.exe` - 安装程序
- `RecallAI Setup 1.0.1.exe.blockmap` - 增量更新文件
- `latest.yml` - 更新配置文件

### 3. 创建 GitHub Release

1. 访问 https://github.com/676662805-cmd/RecallAI/releases/new
2. 点击 "Create a new release"
3. Tag version: `v1.0.1` (必须以 v 开头)
4. Release title: `v1.0.1` 或 `Version 1.0.1 - 功能描述`
5. 描述更新内容（用户会看到）：
   ```markdown
   ## ✨ 新功能
   - 添加了自动更新功能
   - 优化了性能
   
   ## 🐛 修复
   - 修复了某某 bug
   ```
6. 上传文件（拖拽到 "Attach binaries" 区域）：
   - `RecallAI Setup 1.0.1.exe`
   - `RecallAI Setup 1.0.1.exe.blockmap`
   - `latest.yml`
7. 点击 "Publish release"

### 4. 测试自动更新

1. 安装旧版本（如 1.0.0）
2. 打开应用
3. 等待 3 秒后会自动检查更新
4. 看到更新提示窗口后点击 "Download"
5. 下载完成后点击 "Restart Now"
6. 应用重启后会自动安装新版本

## 🔐 GitHub Token 配置（可选）

如果需要在本地发布，需要配置 GitHub Personal Access Token：

1. 访问 https://github.com/settings/tokens
2. 生成新 token，权限选择 `repo`
3. 设置环境变量：
   ```powershell
   $env:GH_TOKEN="your_github_token"
   ```
4. 运行发布命令：
   ```powershell
   npm run dist -- --publish always
   ```

## 📝 版本号规范

遵循语义化版本 (Semantic Versioning)：
- `1.0.0` → `1.0.1` - 修复 bug (patch)
- `1.0.0` → `1.1.0` - 新增功能 (minor)
- `1.0.0` → `2.0.0` - 重大更新 (major)

## ⚙️ 更新配置说明

- **自动检查**: 应用启动 3 秒后自动检查更新
- **下载方式**: 用户确认后手动下载（不自动下载）
- **安装时机**: 退出应用时自动安装
- **增量更新**: 使用 `.blockmap` 文件支持增量下载

## 🚨 注意事项

1. **版本号必须递增**: 用户只会收到比当前版本更高的更新提示
2. **文件完整性**: 必须同时上传 `.exe`、`.blockmap` 和 `latest.yml`
3. **Release Tag**: 必须以 `v` 开头，如 `v1.0.1`
4. **测试环境**: 建议先在测试环境验证更新流程
5. **回滚**: 如需回滚，删除对应的 GitHub Release 即可

## 📊 更新流程图

```
用户启动应用
    ↓
等待 3 秒
    ↓
检查 GitHub Releases
    ↓
发现新版本 → 显示更新提示
    ↓
用户点击 Download → 后台下载
    ↓
下载完成 → 显示 "Restart Now"
    ↓
用户重启 → 自动安装更新
    ↓
启动新版本 ✅
```
