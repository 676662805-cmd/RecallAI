#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""修复 emoji 字符导致的 GBK 编码错误"""

import os
import glob

# Emoji 映射表
EMOJI_MAP = {
    '[OK]': '[OK]',
    '[ERROR]': '[ERROR]',
    '[WARN]': '[WARN]',
    '[MIC]': '[MIC]',
    '[AUDIO]': '[AUDIO]',
    '[INFO]': '[INFO]',
    '[FILE]': '[FILE]',
    '[DOWNLOAD]': '[DOWNLOAD]',
    '[START]': '[START]',
    '[RELOAD]': '[RELOAD]',
    '[THREAD]': '[THREAD]',
    '[NEW]': '[NEW]',
    '[STOP]': '[STOP]',
    '[WAIT]': '[WAIT]',
    '[VOICE]': '[VOICE]',
    '[SEARCH]': '[SEARCH]',
    '': '',
}

def fix_file(filepath):
    """修复单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        for emoji, replacement in EMOJI_MAP.items():
            content = content.replace(emoji, replacement)
        
        if content != original_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[OK] Fixed: {filepath}")
            return True
        else:
            print(f"[SKIP] No emoji found: {filepath}")
            return False
    except Exception as e:
        print(f"[ERROR] Failed to fix {filepath}: {e}")
        return False

def main():
    # 查找所有 Python 文件
    py_files = glob.glob('**/*.py', recursive=True)
    
    fixed_count = 0
    for filepath in py_files:
        if fix_file(filepath):
            fixed_count += 1
    
    print(f"\n[DONE] Fixed {fixed_count} files")

if __name__ == '__main__':
    main()
