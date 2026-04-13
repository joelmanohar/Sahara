import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { MessageSquare, ClipboardList, FileText, BookOpen } from 'lucide-react';

const BottomNav = () => {
    const { currentScreen, navigate } = useContext(AppContext);

    const tabs = [
        { id: 'chat', label: 'Assistant', icon: MessageSquare },
        { id: 'dashboard', label: 'Tasks', icon: ClipboardList },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'guidance', label: 'Guides', icon: BookOpen }
    ];

    return (
        <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: 'var(--nav-h)',
            paddingBottom: 'var(--sab)',
            backgroundColor: '#fff',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            zIndex: 100
        }}>
            {tabs.map(tab => {
                const isActive = currentScreen === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        onClick={() => navigate(tab.id)}
                        style={{
                            flex: 1,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            position: 'relative',
                            gap: '4px',
                            color: isActive ? 'var(--deep-teal)' : 'var(--text-light)'
                        }}
                    >
                        {isActive && (
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                width: '40%',
                                height: '3px',
                                backgroundColor: 'var(--deep-teal)',
                                borderBottomLeftRadius: '3px',
                                borderBottomRightRadius: '3px'
                            }} />
                        )}
                        <div style={{ position: 'relative' }}>
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            {tab.badge && (
                                <div style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-8px',
                                    backgroundColor: '#E53935',
                                    color: 'white',
                                    fontSize: '10px',
                                    fontWeight: 'bold',
                                    width: '16px',
                                    height: '16px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {tab.badge}
                                </div>
                            )}
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: isActive ? 600 : 500 }}>
                            {tab.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

export default BottomNav;
