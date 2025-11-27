import React, { useState } from 'react';
import useSystemTheme from '../hooks/useSystemTheme';

// Component for viewing transcript history list
const TranscriptHistoryList = ({ theme, transcripts, onSelectTranscript, onDeleteTranscript, onRenameTranscript, selectedTranscriptId }) => {
    const [menuOpen, setMenuOpen] = useState(null);

    const handleMenuClick = (e, transcriptId) => {
        e.stopPropagation();
        if (menuOpen === transcriptId) {
            setMenuOpen(null);
        } else {
            setMenuOpen(transcriptId);
        }
    };

    const handleRename = (transcriptId, currentName) => {
        const newName = window.prompt('Enter new transcript name:', currentName);
        if (newName && newName.trim() && newName.trim() !== currentName) {
            onRenameTranscript(transcriptId, newName.trim());
        }
        setMenuOpen(null);
    };

    const handleDelete = (transcriptId) => {
        if (window.confirm('Are you sure you want to delete this transcript?')) {
            onDeleteTranscript(transcriptId);
            setMenuOpen(null);
        }
    };

    // Close menu when clicking outside
    React.useEffect(() => {
        const handleClickOutside = () => {
            setMenuOpen(null);
        };

        if (menuOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => {
                document.removeEventListener('click', handleClickOutside);
            };
        }
    }, [menuOpen]);

    return (
        <div style={{
            width: '100%',
            background: theme.cardBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden',
            height: '100%',
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(255,255,255,0.1)'
        }}>
            <div style={{ 
                padding: '20px 20px 0 20px',
                flexShrink: 0
            }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: theme.textColor, margin: 0, marginBottom: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                    Transcripts
                </h2>
            </div>
            
            <div style={{ 
                flexGrow: 1, 
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0 20px',
                boxSizing: 'border-box'
            }}>
                {transcripts.length === 0 ? (
                    <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', marginTop: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                        No transcripts yet
                    </p>
                ) : (
                    transcripts.map(t => (
                        <div 
                            key={t.id}
                            style={{ 
                                position: 'relative',
                                width: '100%',
                                boxSizing: 'border-box',
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <div
                                onClick={() => onSelectTranscript(t.id)}
                                style={{
                                    padding: '9px 15px', 
                                    margin: '0', 
                                    borderRadius: '8px', 
                                    cursor: 'pointer', 
                                    fontSize: '14px',
                                    color: selectedTranscriptId === t.id ? '#007AFF' : theme.textColor,
                                    backgroundColor: 'transparent',
                                    fontWeight: '400',
                                    transition: 'background-color 0.2s, color 0.2s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    flex: 1,
                                    boxSizing: 'border-box',
                                    minWidth: 0
                                }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.isDark ? '#333' : '#f0f0f5'}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <span style={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                                }}>{t.name}</span>
                            </div>
                            <button
                                onClick={(e) => handleMenuClick(e, t.id)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: theme.textColor,
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    padding: '0 5px',
                                    lineHeight: '1',
                                    flexShrink: 0,
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                                }}
                            >
                                ⋮
                            </button>
                            
                            {/* Dropdown menu */}
                            {menuOpen === t.id && (
                                <div 
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        position: 'absolute',
                                        right: '5px',
                                        top: '40px',
                                        background: theme.cardBg,
                                        border: theme.isDark ? '1px solid #444' : '1px solid #ddd',
                                        borderRadius: '8px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        zIndex: 1000,
                                        minWidth: '150px'
                                    }}>
                                    <button
                                        onClick={() => handleRename(t.id, t.name)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 15px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: theme.textColor,
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            borderBottom: theme.isDark ? '1px solid #444' : '1px solid #f0f0f0',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? '#333' : '#f5f5f5'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        ✏️ Rename
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        style={{
                                            width: '100%',
                                            padding: '10px 15px',
                                            border: 'none',
                                            background: 'transparent',
                                            color: theme.textColor,
                                            textAlign: 'left',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = theme.isDark ? '#333' : '#f5f5f5'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    >
                                        🗑️ Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

// Component for viewing transcript details
const TranscriptDetailView = ({ theme, transcript, onBack }) => {
    return (
        <div style={{ 
            flex: 1, 
            display: 'flex',
            flexDirection: 'column',
            background: theme.bgColor,
            overflow: 'hidden'
        }}>
            {/* Header with back button and transcript name */}
            <div style={{ 
                padding: '20px 30px',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <h1 style={{ fontSize: '24px', fontWeight: '700', color: theme.textColor, margin: 0, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                    {transcript.name}
                </h1>
                <button 
                    onClick={onBack}
                    style={{
                        padding: '10px 20px', 
                        borderRadius: '8px',
                        background: 'rgba(0, 0, 0, 0.4)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        color: 'white', 
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif'
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                >
                    ← Back
                </button>
            </div>

            {/* Transcript content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px 30px',
                boxSizing: 'border-box'
            }}>
                <div style={{
                    background: theme.cardBg,
                    borderRadius: '12px',
                    padding: '20px',
                    border: theme.isDark ? '1px solid #444' : '1px solid #e0e0e0',
                    boxShadow: theme.isDark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                    {transcript && transcript.transcript && transcript.transcript.length > 0 ? (
                        transcript.transcript.map((item, index) => (
                            <div key={index} style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                <span style={{ 
                                    color: '#666', 
                                    fontSize: '12px', 
                                    minWidth: '50px',
                                    fontFamily: 'monospace',
                                    flexShrink: 0,
                                    paddingTop: '2px'
                                }}>
                                    {item.timestamp || ''}
                                </span>
                                <span style={{ color: theme.textColor, fontSize: '14px', lineHeight: '1.5', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                                    {item.text || item}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p style={{ color: '#888', textAlign: 'center', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                            No transcript data available
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

// Main TranscriptHistoryPage component
function TranscriptHistoryPage({ handleReturnToInterview, transcriptHistory, onUpdateTranscriptHistory }) {
    const theme = useSystemTheme();
    const [selectedTranscriptId, setSelectedTranscriptId] = useState(null);

    const selectedTranscript = transcriptHistory.find(t => t.id === selectedTranscriptId);

    const handleDeleteTranscript = (transcriptId) => {
        const updated = transcriptHistory.filter(t => t.id !== transcriptId);
        onUpdateTranscriptHistory(updated);
        if (selectedTranscriptId === transcriptId) {
            setSelectedTranscriptId(null);
        }
    };

    const handleRenameTranscript = (transcriptId, newName) => {
        const updated = transcriptHistory.map(t => 
            t.id === transcriptId ? { ...t, name: newName } : t
        );
        onUpdateTranscriptHistory(updated);
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            background: theme.bgColor,
            overflow: 'hidden'
        }}>
            <div style={{
                width: '280px',
                display: 'flex',
                flexDirection: 'column',
                height: '100vh',
                borderRight: theme.isDark ? '1px solid #444' : '1px solid #ddd'
            }}>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <TranscriptHistoryList 
                        theme={theme}
                        transcripts={transcriptHistory}
                        onSelectTranscript={setSelectedTranscriptId}
                        onDeleteTranscript={handleDeleteTranscript}
                        onRenameTranscript={handleRenameTranscript}
                        selectedTranscriptId={selectedTranscriptId}
                    />
                </div>
                
                <div style={{
                    padding: '15px 20px 20px 20px',
                    borderTop: `1px solid ${theme.isDark ? '#444' : '#f0f0f0'}`,
                    background: theme.cardBg
                }}>
                    <button
                        onClick={handleReturnToInterview}
                        style={{
                            padding: '12px 15px',
                            width: '100%',
                            borderRadius: '8px',
                            background: 'rgba(0, 0, 0, 0.4)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            color: 'white',
                            fontWeight: '700',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Back to Interview
                    </button>
                </div>
            </div>

            {selectedTranscript ? (
                <TranscriptDetailView 
                    theme={theme}
                    transcript={selectedTranscript}
                    onBack={() => setSelectedTranscriptId(null)}
                />
            ) : (
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: theme.bgColor
                }}>
                    <div style={{ 
                        padding: '30px',
                        textAlign: 'center',
                        color: '#888'
                    }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '10px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>
                            Select a Transcript
                        </h2>
                        <p style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", Arial, sans-serif' }}>Click on a transcript from the list to view its details</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TranscriptHistoryPage;
