"""
图标更新脚本
将聊天中的图片转换为应用图标并更新配置
"""
import os
import sys
from pathlib import Path

def update_icon():
    """更新应用图标"""
    
    # 提示用户保存图片
    print("=" * 60)
    print("图标更新向导")
    print("=" * 60)
    print("\n请按以下步骤操作：")
    print("1. 在聊天窗口中，右键点击 RecallAI 图标图片")
    print("2. 选择'另存为' 或 '保存图片'")
    print("3. 保存为: D:\\RecallAI\\temp_icon.png")
    print("\n等待保存完成...")
    
    input("\n保存完成后按 Enter 继续...")
    
    temp_icon = Path("D:/RecallAI/icon.png")
    if not temp_icon.exists():
        print(f"❌ 错误: 未找到临时图标文件 {temp_icon}")
        print("请确保已将图片保存到正确位置")
        return False
    
    try:
        from PIL import Image
        print("✓ PIL 库已安装")
    except ImportError:
        print("⚠️  PIL 库未安装，正在安装...")
        os.system("pip install Pillow")
        from PIL import Image
    
    # 目标路径
    public_dir = Path("D:/RecallAI/frontend/public")
    public_dir.mkdir(parents=True, exist_ok=True)
    
    # 打开图片
    print(f"\n正在处理图片: {temp_icon}")
    img = Image.open(temp_icon)
    
    # 转换为 PNG
    if img.mode in ('RGBA', 'LA', 'P'):
        background = Image.new('RGBA', img.size, (255, 255, 255, 0))
        if img.mode == 'P':
            img = img.convert('RGBA')
        background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
        img = background
    else:
        img = img.convert('RGBA')
    
    # 生成不同尺寸的图标
    sizes = {
        'icon.png': 512,      # 主图标
        'icon-256.png': 256,  # Windows 图标
        'icon-128.png': 128,  # macOS 图标
        'icon-48.png': 48,    # 小图标
        'icon-32.png': 32,    # 任务栏图标
        'icon-16.png': 16,    # 系统托盘图标
    }
    
    print("\n生成图标文件:")
    for filename, size in sizes.items():
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        output_path = public_dir / filename
        resized.save(output_path, 'PNG')
        print(f"  ✓ {filename} ({size}x{size})")
    
    # 生成 ICO 文件 (Windows)
    ico_path = public_dir / 'icon.ico'
    img_ico = img.resize((256, 256), Image.Resampling.LANCZOS)
    img_ico.save(ico_path, format='ICO', sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print(f"  ✓ icon.ico (Windows)")
    
    # 生成 ICNS 文件 (macOS) - 需要额外工具
    print(f"\n注意: macOS 的 .icns 文件需要在 macOS 系统上生成")
    
    # 删除临时文件
    temp_icon.unlink()
    print(f"\n✓ 已删除临时文件")
    
    print("\n" + "=" * 60)
    print("✅ 图标更新完成!")
    print("=" * 60)
    print(f"\n生成的图标位置: {public_dir}")
    print("\n接下来需要:")
    print("1. 更新 package.json 配置")
    print("2. 重新打包应用")
    
    return True

if __name__ == "__main__":
    try:
        success = update_icon()
        if success:
            print("\n按 Enter 退出...")
            input()
    except Exception as e:
        print(f"\n❌ 错误: {e}")
        import traceback
        traceback.print_exc()
        print("\n按 Enter 退出...")
        input()
        sys.exit(1)
