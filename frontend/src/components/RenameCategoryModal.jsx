import React, { useState } from 'react';

const RenameCategoryModal = ({ theme, isOpen, onClose, onRename, currentName }) => {
    const [name, setName] = useState(currentName || '');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim() && name.trim() !== currentName) {
            onRename(name.trim());
            setName('');
        } else if (name.trim() === currentName) {
            // If name unchanged, just close
            onClose();
        }
    };

    const handleCancel = () => {
        setName('');
        onClose();
    };

    // Style definitions
    const modalOverlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: theme.isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.4)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1050,
    };
    
    const modalContentStyle = {
        width: '350px', padding: '25px', 
        backgroundColor: theme.cardBg,
        borderRadius: '15px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
    };
    
    const titleStyle = { 
        fontSize: '20px', fontWeight: '600', marginBottom: '20px', 
        color: theme.textColor,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    };
    
    const inputStyle = { 
        width: '100%', padding: '10px 12px', borderRadius: '8px', 
        border: `1px solid ${theme.isDark ? '#555' : '#dcdcdc'}`,
        fontSize: '15px', boxSizing: 'border-box', marginBottom: '15px',
        backgroundColor: theme.inputBg,
        color: theme.inputTextColor,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    };
    
    const buttonStyle = (type) => ({ 
        padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600',
        background: type === 'submit' ? theme.accentColor : (theme.isDark ? '#555' : '#e0e0e0'),
        color: type === 'submit' ? 'white' : theme.inputTextColor,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
    });

    return (
        <div style={modalOverlayStyle} onClick={handleCancel}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
                <h2 style={titleStyle}>Rename Category</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Enter new category name..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        style={inputStyle}
                        autoFocus 
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={handleCancel} style={buttonStyle('cancel')}>Cancel</button>
                        <button type="submit" style={buttonStyle('submit')}>Rename</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RenameCategoryModal;
