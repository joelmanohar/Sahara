import React from 'react';
import { ExternalLink } from 'lucide-react';

const ChatBubble = ({ role, content, showSource, officialLinks, taskSuggestions, onAddTask }) => {
    const isUser = role === 'user';

    // Format content with line breaks and basic structure
    const formatContent = (text) => {
        if (!text) return text;

        // Split by line breaks and render
        return text.split('\n').map((line, i) => {
            // Detect bullet points
            if (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('→')) {
                return (
                    <div key={i} style={{ paddingLeft: '8px', marginTop: '4px', display: 'flex', gap: '6px' }}>
                        <span style={{ color: 'var(--gold)', flexShrink: 0 }}>
                            {line.trim().charAt(0)}
                        </span>
                        <span>{line.trim().substring(1).trim()}</span>
                    </div>
                );
            }
            // Detect numbered steps
            if (/^\d+[.)]\s/.test(line.trim())) {
                const num = line.trim().match(/^(\d+)/)[1];
                const rest = line.trim().replace(/^\d+[.)]\s*/, '');
                return (
                    <div key={i} style={{ paddingLeft: '4px', marginTop: '6px', display: 'flex', gap: '8px' }}>
                        <span style={{
                            backgroundColor: 'var(--pale-teal)',
                            color: 'var(--deep-teal)',
                            fontWeight: 700,
                            fontSize: '11px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            marginTop: '1px'
                        }}>
                            {num}
                        </span>
                        <span>{rest}</span>
                    </div>
                );
            }
            // Empty line = paragraph break
            if (line.trim() === '') {
                return <div key={i} style={{ height: '8px' }} />;
            }
            return <div key={i}>{line}</div>;
        });
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUser ? 'flex-end' : 'flex-start',
            animation: 'msgIn 0.28s ease',
            width: '100%'
        }}>
            <div style={{
                maxWidth: '85%',
                padding: '12px 16px',
                backgroundColor: isUser ? 'var(--deep-teal)' : '#fff',
                color: isUser ? '#fff' : 'var(--text-dark)',
                borderRadius: '16px',
                borderBottomRightRadius: isUser ? '4px' : '16px',
                borderBottomLeftRadius: isUser ? '16px' : '4px',
                boxShadow: isUser ? 'none' : 'var(--shadow-sm)',
                fontSize: '15px',
                lineHeight: '1.5',
            }}>
                {formatContent(content)}
            </div>

            {/* Official Links */}
            {officialLinks && officialLinks.length > 0 && (
                <div style={{
                    maxWidth: '85%',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                }}>
                    {officialLinks.map((link, i) => (
                        <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 14px',
                                backgroundColor: '#f0f7f7',
                                border: '1px solid rgba(74,139,139,0.2)',
                                borderRadius: '12px',
                                fontSize: '13px',
                                color: 'var(--deep-teal)',
                                fontWeight: 600,
                                textDecoration: 'none',
                                transition: 'all 0.15s'
                            }}
                        >
                            <ExternalLink size={14} />
                            {link.label}
                        </a>
                    ))}
                </div>
            )}

            {/* Task Suggestions */}
            {taskSuggestions && taskSuggestions.length > 0 && onAddTask && (
                <div style={{
                    maxWidth: '85%',
                    marginTop: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                }}>
                    {taskSuggestions.map((task, i) => (
                        <button
                            key={i}
                            onClick={() => onAddTask(task)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 14px',
                                backgroundColor: 'rgba(201,169,110,0.1)',
                                border: '1.5px solid var(--gold-light)',
                                borderRadius: '12px',
                                fontSize: '13px',
                                color: 'var(--text-dark)',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s',
                                textAlign: 'left'
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>📋</span>
                            <span style={{ flex: 1 }}>
                                Add to tasks: {task.name}
                            </span>
                            {task.priority === 'urgent' && <span>🚨</span>}
                            {task.priority === 'important' && <span>⭐</span>}
                        </button>
                    ))}
                </div>
            )}

            {showSource && (
                <div style={{
                    marginTop: '6px',
                    padding: '4px 10px',
                    backgroundColor: 'rgba(74,139,139,0.1)',
                    border: '1px solid rgba(74,139,139,0.2)',
                    borderRadius: '20px',
                    fontSize: '11px',
                    color: 'var(--soft-teal)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    📚 RAG · Official source
                </div>
            )}
        </div>
    );
};

export default ChatBubble;
