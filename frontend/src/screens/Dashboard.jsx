import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import TaskCard from '../components/TaskCard';
import { getTasks } from '../services/api';

const CATEGORY_INFO = {
    bank: { label: 'Banking', icon: '🏦', color: '#E3F2FD' },
    insurance: { label: 'Insurance', icon: '🛡', color: '#F3E5F5' },
    digital: { label: 'Digital', icon: '📱', color: '#E8F5E9' },
    investment: { label: 'Investments', icon: '📈', color: '#FFF3E0' },
    pension: { label: 'Pension', icon: '🎖', color: '#FCE4EC' },
    property: { label: 'Property', icon: '🏠', color: '#E8EAF6' },
    tax: { label: 'Tax', icon: '📑', color: '#FFF9C4' },
    legal: { label: 'Legal', icon: '⚖️', color: '#F3E5F5' },
    utility: { label: 'Utilities', icon: '🔌', color: '#E0F2F1' },
    government: { label: 'Government', icon: '🏛', color: '#ECEFF1' },
    general: { label: 'General', icon: '📋', color: '#F5F5F5' },
};

const Dashboard = () => {
    const { userName, tasks, setTasks, userId, navigate, setSelectedTask, updateTask, deleteTask } = useContext(AppContext);
    const [filter, setFilter] = useState('all'); // all, pending, progress, done
    const [groupBy, setGroupBy] = useState('category'); // category, priority, status
    const [editingTask, setEditingTask] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', category: '', priority: '' });

    useEffect(() => {
        let mounted = true;
        let timer;
        const refresh = async () => {
            if (!userId) return;
            try {
                const res = await getTasks(userId);
                if (!mounted) return;
                setTasks(res.data);
            } catch (err) {
                console.error('Failed to fetch tasks', err);
            }
        };

        // initial load
        refresh();
        // poll for near real-time updates every 5s
        timer = setInterval(refresh, 5000);

        return () => { mounted = false; if (timer) clearInterval(timer); };
    }, [userId, setTasks]);

    const handleEdit = (task) => {
        setEditingTask(task);
        setEditForm({
            name: task.name,
            category: task.category || 'general',
            priority: task.priority || 'normal'
        });
    };

    const saveEdit = async () => {
        if (!editingTask) return;
        await updateTask(editingTask.originalIndex, editForm);
        setEditingTask(null);
    };

    const handleDelete = async (index, name) => {
        if (window.confirm(`Are you sure you want to remove "${name}"?`)) {
            await deleteTask(index);
        }
    };

    const dateStr = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const getGreeting = () => {
        const hr = new Date().getHours();
        if (hr < 12) return 'Good morning';
        if (hr < 18) return 'Good afternoon';
        return 'Good evening';
    };

    const doneCount = tasks.filter(t => t.status === 'done').length;
    const totalCount = tasks.length;
    const progressPct = totalCount ? (doneCount / totalCount) * 100 : 0;

    // Filter tasks
    const filteredTasks = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);

    // Group tasks by category
    const groupedTasks = {};
    filteredTasks.forEach((task, idx) => {
        const key = groupBy === 'category'
            ? (task.category || 'general')
            : groupBy === 'priority'
            ? (task.priority || 'normal')
            : (task.status || 'pending');

        if (!groupedTasks[key]) groupedTasks[key] = [];
        groupedTasks[key].push({ ...task, originalIndex: tasks.indexOf(task) });
    });

    // Sort groups: urgent first for priority, otherwise alphabetical
    const sortedGroups = Object.keys(groupedTasks).sort((a, b) => {
        if (groupBy === 'priority') {
            const order = { urgent: 0, important: 1, normal: 2 };
            return (order[a] ?? 3) - (order[b] ?? 3);
        }
        return a.localeCompare(b);
    });

    const filterOptions = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'progress', label: 'In Progress' },
        { id: 'done', label: 'Done' },
    ];

    return (
        <div style={{
            flex: 1,
            backgroundColor: 'var(--warm-white)',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'var(--sat)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            position: 'relative'
        }}>
            <div className="scroll-container" style={{ flex: 1, padding: '14px 20px 100px' }}>

                {/* Header section... */}
                <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{
                            fontSize: 'clamp(24px, 6.5vw, 30px)',
                            color: 'var(--text-dark)',
                            marginBottom: '4px'
                        }}>
                            {getGreeting()}{userName ? `, ${userName}` : ''} 👋
                        </h1>
                        <div style={{ color: 'var(--text-light)', fontSize: '14px' }}>
                            {dateStr}
                        </div>
                    </div>
                    {/* Logout Button */}
                    <button
                        onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                        }}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: 'transparent',
                            color: 'var(--text-light)',
                            fontSize: '13px',
                            fontWeight: 600,
                            borderRadius: '8px',
                            border: '1px solid var(--border)'
                        }}
                    >
                        Log Out
                    </button>
                </div>

                {/* Progress Card... */}
                <div style={{
                    backgroundColor: 'var(--deep-teal)',
                    borderRadius: '20px',
                    padding: '24px',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    {/* Decorative circle */}
                    <div style={{
                        position: 'absolute',
                        top: '-20px',
                        right: '-20px',
                        width: '150px',
                        height: '150px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.04)'
                    }} />

                    <div style={{
                        fontSize: '12px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.6)',
                        marginBottom: '16px'
                    }}>
                        OVERALL PROGRESS
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '48px', lineHeight: 1 }}>
                            {doneCount}
                        </span>
                        <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.6)' }}>
                            / {totalCount} done
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                        height: '6px',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px',
                        marginBottom: '12px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '100%',
                            backgroundColor: 'var(--gold)',
                            borderRadius: '3px',
                            width: `${progressPct}%`,
                            transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)'
                        }} />
                    </div>

                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                        {totalCount === 0
                            ? 'Start chatting with the assistant to add tasks'
                            : `${totalCount - doneCount} tasks remaining`
                        }
                    </div>
                </div>

                {/* Identify Accounts Promo Card */}
                <div
                    onClick={() => navigate('accounts')}
                    style={{
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        border: '1.5px solid var(--gold)',
                        padding: '18px 20px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 10px rgba(195,155,100,0.15)',
                        transition: 'transform 0.15s, box-shadow 0.15s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(195,155,100,0.25)'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 10px rgba(195,155,100,0.15)'; }}
                >
                    <div style={{ fontSize: '32px', lineHeight: 1 }}>🔍</div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)', marginBottom: '3px' }}>
                            Identify Accounts
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                            Upload documents, scan emails/SMS, or add manually
                        </div>
                    </div>
                    <div style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '18px' }}>›</div>
                </div>

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
                    {filterOptions.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFilter(f.id)}
                            style={{
                                padding: '7px 16px',
                                borderRadius: '20px',
                                border: filter === f.id ? 'none' : '1px solid var(--border)',
                                backgroundColor: filter === f.id ? 'var(--deep-teal)' : '#fff',
                                color: filter === f.id ? '#fff' : 'var(--text-mid)',
                                fontSize: '13px',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s'
                            }}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Task Groups */}
                {totalCount === 0 ? (
                    <div style={{
                        padding: '48px 24px',
                        textAlign: 'center',
                        color: 'var(--text-light)',
                        backgroundColor: '#fff',
                        borderRadius: '16px',
                        border: '1px solid var(--border)'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                        <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '8px' }}>
                            No tasks yet
                        </div>
                        <div style={{ fontSize: '14px', marginBottom: '20px' }}>
                            Chat with the assistant to get guidance and add tasks as you go.
                        </div>
                        <button
                            onClick={() => navigate('chat')}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: 'var(--deep-teal)',
                                color: '#fff',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: 600
                            }}
                        >
                            💬 Start Chat
                        </button>
                    </div>
                ) : sortedGroups.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>
                        No tasks match the selected filter.
                    </div>
                ) : (
                    sortedGroups.map(groupKey => {
                        const groupTasks = groupedTasks[groupKey];
                        const catInfo = CATEGORY_INFO[groupKey] || CATEGORY_INFO.general;

                        return (
                            <div key={groupKey} style={{ marginBottom: '24px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px',
                                    padding: '6px 0'
                                }}>
                                    <span style={{ fontSize: '18px' }}>{catInfo.icon}</span>
                                    <span style={{
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        color: 'var(--text-dark)',
                                        fontFamily: 'DM Sans, sans-serif'
                                    }}>
                                        {catInfo.label}
                                    </span>
                                    <span style={{
                                        fontSize: '12px',
                                        color: 'var(--text-light)',
                                        backgroundColor: 'var(--cream)',
                                        padding: '2px 8px',
                                        borderRadius: '10px',
                                        fontWeight: 600
                                    }}>
                                        {groupTasks.length}
                                    </span>
                                </div>

                                {groupTasks.map((task) => (
                                    <TaskCard
                                        key={task.originalIndex}
                                        {...task}
                                        onClick={() => {
                                            setSelectedTask(task);
                                            navigate('guidance');
                                        }}
                                        onEdit={() => handleEdit(task)}
                                        onDelete={() => handleDelete(task.originalIndex, task.name)}
                                    />
                                ))}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Edit Modal */}
            {editingTask && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        borderRadius: '24px',
                        width: '100%',
                        maxWidth: '400px',
                        padding: '24px',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        <h3 style={{ fontSize: '20px', marginBottom: '20px', color: 'var(--text-dark)' }}>Edit Task</h3>
                        
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '6px' }}>TASK NAME</label>
                            <input 
                                value={editForm.name}
                                onChange={e => setEditForm({...editForm, name: e.target.value})}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1.5px solid var(--border)',
                                    fontSize: '15px'
                                }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '6px' }}>CATEGORY</label>
                                <select 
                                    value={editForm.category}
                                    onChange={e => setEditForm({...editForm, category: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--border)',
                                        fontSize: '14px',
                                        backgroundColor: '#fff'
                                    }}
                                >
                                    {Object.keys(CATEGORY_INFO).map(cat => (
                                        <option key={cat} value={cat}>{CATEGORY_INFO[cat].label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-light)', marginBottom: '6px' }}>PRIORITY</label>
                                <select 
                                    value={editForm.priority}
                                    onChange={e => setEditForm({...editForm, priority: e.target.value})}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1.5px solid var(--border)',
                                        fontSize: '14px',
                                        backgroundColor: '#fff'
                                    }}
                                >
                                    <option value="normal">Normal</option>
                                    <option value="important">Important ⭐</option>
                                    <option value="urgent">Urgent 🚨</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <button 
                                onClick={() => setEditingTask(null)}
                                style={{
                                    padding: '14px',
                                    borderRadius: '14px',
                                    border: '1px solid var(--border)',
                                    backgroundColor: '#fff',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={saveEdit}
                                style={{
                                    padding: '14px',
                                    borderRadius: '14px',
                                    border: 'none',
                                    backgroundColor: 'var(--deep-teal)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    fontSize: '14px'
                                }}
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


export default Dashboard;
