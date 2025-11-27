import { useState, useEffect } from 'react';

// 🔥 1. 修复点：新增一个函数来安全地检查初始模式
const getInitialMode = () => {
    // 确保在浏览器环境运行
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; 
}

const useSystemTheme = () => {
    // 🔥 2. 修复点：将初始检查逻辑放入 useState 的初始化函数中
    const [isDarkMode, setIsDarkMode] = useState(getInitialMode()); 

    useEffect(() => {
        // 3. 只保留监听器和清理逻辑
        const query = window.matchMedia('(prefers-color-scheme: dark)');
        
        // ⚠️ 初始检查的代码已经删除了，现在只设置监听器
        const handleChange = (e) => setIsDarkMode(e.matches);
        query.addEventListener('change', handleChange);

        // 清理监听器
        return () => query.removeEventListener('change', handleChange);
    }, []); // 依赖数组为空，确保只设置一次监听

    // 返回包含所有颜色变量的对象 (代码保持不变)
    return {
        isDark: isDarkMode,
        bgColor: 'transparent', // 🔥 Use transparent to show body gradient background
        cardBg: 'rgba(40, 40, 42, 0.8)', // Semi-transparent dark cards with blur
        textColor: '#f5f5f7',
        inputBg: isDarkMode ? '#3a3a3c' : '#f9f9f9',
        inputTextColor: isDarkMode ? 'white' : '#1d1d1f',
        accentColor: isDarkMode ? '#0a84ff' : '#007AFF',
    };
};

export default useSystemTheme;