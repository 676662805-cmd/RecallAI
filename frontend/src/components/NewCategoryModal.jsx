import React, { useState } from 'react';

// 🔥 注意：外部的样式定义全部被移除了，它们现在在组件内部定义

// CardEditorModal Component (用于创建和编辑卡片的模态框)
const NewCategoryModal = ({ theme, isOpen, onClose, onCreate }) => { // 🔥 1. 接收 theme prop
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            onCreate(name.trim());
            setName(''); // 重置输入框
        }
    };

    // --- 2. 样式定义 (已替换为动态主题变量，并移到内部) ---
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)', // 🔥 动态暗色覆盖层
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1050,
    };
    const modalContentStyle = {
        width: '350px', padding: '25px', 
        backgroundColor: theme.cardBg, // 🔥 动态卡片背景
        borderRadius: '15px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    };
    const titleStyle = { 
        fontSize: '20px', fontWeight: '600', marginBottom: '20px', 
        color: theme.textColor // 🔥 动态文字颜色
    };
    const inputStyle = { 
        width: '100%', padding: '10px 12px', borderRadius: '8px', 
        border: `1px solid ${theme.isDark ? '#555' : '#dcdcdc'}`, // 🔥 动态边框
        fontSize: '15px', boxSizing: 'border-box', marginBottom: '15px',
        backgroundColor: theme.inputBg, // 🔥 动态输入框背景
        color: theme.inputTextColor, // 🔥 动态输入框文字颜色
    };
    
    // 动态按钮样式函数
    const buttonStyle = (type) => ({ 
        padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
        background: type === 'submit' ? theme.accentColor : (theme.isDark ? '#555' : '#e0e0e0'),
        color: type === 'submit' ? 'white' : theme.inputTextColor,
    });


    return (
        <div style={modalOverlayStyle}>
            <div className="apple-card" style={modalContentStyle}>
                <h2 style={titleStyle}>创建新分类</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="请输入分类名称..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={inputStyle} // 🔥 使用动态样式
                        autoFocus 
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={onClose} style={buttonStyle('cancel')}>取消</button>
                        <button type="submit" style={buttonStyle('submit')}>创建</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewCategoryModal;