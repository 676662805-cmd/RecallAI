// frontend/src/components/SwitchButton.jsx
import React from 'react';

const SwitchButton = ({ currentPage, setCurrentPage }) => ( 
    <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 100
    }}>
        {currentPage !== 'transcriptHistory' && (
            <button
                onClick={() => setCurrentPage(currentPage === 'interview' ? 'knowledge' : 'interview')} 
                style={{
                    padding: '10px 15px',
                    borderRadius: '10px',
                    border: '1px solid #dcdcdc',
                    background: 'white',
                    color: '#1d1d1f',
                    fontWeight: '600',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                }}
            >
                {currentPage === 'interview' ? 'Your Cards' : 'Back to Interview'}
            </button>
        )}
        {currentPage === 'interview' && (
            <button
                onClick={() => setCurrentPage('transcriptHistory')}
                style={{
                    padding: '10px 15px',
                    borderRadius: '10px',
                    border: '1px solid #dcdcdc',
                    background: 'white',
                    color: '#1d1d1f',
                    fontWeight: '600',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    cursor: 'pointer',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                }}
            >
                History Transcript
            </button>
        )}
    </div>
);

// 🔥 关键修复：确保文件结尾有导出
export default SwitchButton;