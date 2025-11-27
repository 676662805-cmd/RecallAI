# 图标文件说明

当前 `public` 目录缺少 Windows 图标文件（.ico）。

## 需要创建的文件
- `icon.ico` - Windows 应用程序图标（256x256 像素推荐）

## 临时解决方案
如果没有图标文件，可以暂时注释掉 `package.json` 中的图标配置：

在 `package.json` 的 `build.win` 部分：
```json
"win": {
  "target": ["nsis"],
  // "icon": "public/icon.ico"  // 临时注释掉
}
```

## 创建图标的方法

### 方法 1：在线工具
1. 访问 https://www.icoconverter.com/
2. 上传你的 PNG 图片（建议 512x512 或更大）
3. 选择 256x256 尺寸
4. 下载生成的 .ico 文件
5. 将文件保存为 `frontend/public/icon.ico`

### 方法 2：使用现有工具
- Photoshop
- GIMP
- IrfanView
- 在线图标生成器

## 图标要求
- 格式：.ico
- 推荐尺寸：256x256 像素
- 背景：透明或纯色
- 主题：符合 RecallAI 应用特征（AI、面试、录音等元素）
