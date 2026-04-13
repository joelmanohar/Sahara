import React from 'react';

const TaskCard = ({ originalIndex, icon, category, name, sub, status, priority, isImportant, isUrgent, deadline, onClick, onEdit, onDelete }) => {
    const getCategoryColor = () => {
        switch (category) {
            case 'bank': return '#E3F2FD';
            case 'insurance': return '#F3E5F5';
            case 'digital': return '#E8F5E9';
            case 'investment': return '#FFF3E0';
            case 'pension': return '#FCE4EC';
            case 'property': return '#E8EAF6';
            case 'tax': return '#FFF9C4';
            case 'legal': return '#F3E5F5';
            case 'utility': return '#E0F2F1';
            case 'government': return '#ECEFF1';
            default: return '#F5F5F5';
        }
    };

    const getStatusBadge = () => {
        switch (status) {
            case 'pending': return { bg: '#FFF3E0', color: '#E65100', text: 'Pending' };
            case 'progress': return { bg: '#E3F2FD', color: '#1565C0', text: 'In Progress' };
            case 'submitted': return { bg: '#EDE7F6', color: '#4527A0', text: 'Submitted' };
            case 'done': return { bg: '#E8F5E9', color: '#2E7D32', text: 'Done ✓' };
            default: return { bg: '#FFF3E0', color: '#E65100', text: 'Pending' };
        }
    };

    const badge = getStatusBadge();

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)',
                marginBottom: '10px',
                cursor: onClick ? 'pointer' : 'default',
                border: isUrgent
                    ? '1.5px solid #EF5350'
                    : isImportant
                    ? '1.5px solid var(--gold-light)'
                    : '1px solid var(--border)',
                transition: 'transform 0.1s',
                position: 'relative',
                overflow: 'hidden'
            }}
            className="task-card"
        >
            {/* Action Buttons (visible on hover) */}
            <div className="task-actions" style={{
                position: 'absolute',
                top: '0',
                right: '0',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 12px',
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                opacity: 0,
                transition: 'opacity 0.2s',
                pointerEvents: 'none'
            }}>
                <button
                    onClick={(e) => { e.stopPropagation(); onEdit(); }}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid var(--border)',
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                        pointerEvents: 'auto'
                    }}
                    title="Edit Task"
                >
                    ✏️
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: '1px solid #FFEBEE',
                        backgroundColor: '#FFF8F8',
                        color: '#D32F2F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontSize: '14px',
                        pointerEvents: 'auto'
                    }}
                    title="Delete Task"
                >
                    🗑️
                </button>
            </div>

            <style>{`
                .task-card:hover .task-actions {
                    opacity: 1 !important;
                }
            `}</style>

            {/* Priority indicator */}
            {(isUrgent || isImportant) && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    fontSize: '10px'
                }}>
                    {isUrgent ? '🚨' : '⭐'}
                </div>
            )}

            <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: getCategoryColor(),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                flexShrink: 0
            }}>
                {icon || '📋'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--text-dark)',
                    marginBottom: '3px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    paddingRight: (isUrgent || isImportant) ? '24px' : 0
                }}>
                    {name}
                </div>
                <div style={{
                    fontSize: '13px',
                    color: 'var(--text-light)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                }}>
                    {sub}
                </div>
                {deadline && (
                    <div style={{
                        fontSize: '11px',
                        color: isUrgent ? '#D32F2F' : 'var(--gold)',
                        fontWeight: 600,
                        marginTop: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        ⏰ {deadline}
                    </div>
                )}
            </div>

            <div style={{
                padding: '5px 10px',
                backgroundColor: badge.bg,
                color: badge.color,
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                flexShrink: 0
            }}>
                {badge.text}
            </div>
        </div>
    );
};


export default TaskCard;
