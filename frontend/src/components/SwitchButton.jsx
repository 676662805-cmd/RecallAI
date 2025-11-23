// frontend/src/components/SwitchButton.jsx
import React from 'react';

const SwitchButton = ({ currentPage, setCurrentPage }) => ( 
    <button
        onClick={() => setCurrentPage(currentPage === 'interview' ? 'knowledge' : 'interview')} 
        style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '10px 15px',
            borderRadius: '10px',
            border: '1px solid #dcdcdc',
            background: 'white',
            color: '#1d1d1f',
            fontWeight: '600',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            zIndex: 100,
            cursor: 'pointer'
        }}
    >
        {currentPage === 'interview' ? '⚙️ Your Cards' : '🎙️ 返回面试模式'}
    </button>
);

// 🔥 关键修复：确保文件结尾有导出
export default SwitchButton;