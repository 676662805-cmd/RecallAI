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
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    color: 'white',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
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
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(0, 0, 0, 0.4)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    color: 'white',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                Transcript History
            </button>
        )}
    </div>
);

// 🔥 关键修复：确保文件结尾有导出
export default SwitchButton;