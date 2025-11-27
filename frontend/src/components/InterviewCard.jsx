// frontend/src/components/InterviewCard.jsx
import React from 'react';

const InterviewCard = ({ data, isVisible }) => {
  return (
    <div style={{
      // --- 位置与动画 ---
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '320px',
      transform: isVisible ? 'translateX(0)' : 'translateX(120%)', // 没显示时移出屏幕
      opacity: isVisible ? 1 : 0,
      transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', // 丝滑弹跳效果
      
      // --- 苹果风磨砂玻璃样式 ---
      background: 'rgba(255, 255, 255, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)', // 兼容 Mac Safari
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      border: '1px solid rgba(255,255,255,0.4)',
      padding: '20px',
      zIndex: 9999,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    }}>
      {/* 标题 */}
      <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: '#1d1d1f' }}>
        {data.title}
      </h3>

      {/* 内容 */}
      <div style={{ 
        color: '#424245', 
        fontSize: '14px', 
        lineHeight: '1.6',
        maxHeight: '120px',
        overflow: 'hidden'
      }}>
        {data.content.map((line, index) => (
          <p key={index} style={{ 
            margin: '0 0 8px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical'
          }}>{line}</p>
        ))}
      </div>

      {/* 标签 */}
      <div style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
        {data.tags.map(tag => (
          <span key={tag} style={{
            background: '#e5e5ea',
            color: '#8e8e93',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            #{tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default InterviewCard;