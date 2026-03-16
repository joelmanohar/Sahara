import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import TaskCard from '../components/TaskCard';
import { getTasks } from '../services/api';

const Dashboard = () => {
    const { userName, tasks, setTasks, userId, navigate, setSelectedTask } = useContext(AppContext);

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

    return (
        <div style={{
            flex: 1,
            backgroundColor: 'var(--warm-white)',
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'var(--sat)',
            overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
        }}>
            <div className="scroll-container" style={{ flex: 1, padding: '14px 20px 100px' }}>

                {/* Header section */}
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
                            window.location.reload(); // Simple way to reset state and send to login
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

                {/* Progress Card */}
                <div style={{
                    backgroundColor: 'var(--deep-teal)',
                    borderRadius: '20px',
                    padding: '24px',
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                    marginBottom: '32px',
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
                            flex: 1,
                            height: '100%',
                            backgroundColor: 'var(--gold)',
                            borderRadius: '3px',
                            width: `${progressPct}%`,
                            transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)'
                        }} />
                    </div>

                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
                        {totalCount - doneCount} tasks remaining · est. 4–6 weeks
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

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)', fontFamily: 'DM Sans, sans-serif' }}>
                        All Tasks
                    </h3>
                    <span style={{ fontSize: '14px', color: 'var(--text-mid)', fontWeight: 500 }}>
                        Filter ▾
                    </span>
                </div>

                {tasks.map((task, idx) => (
                    <TaskCard
                        key={idx}
                        {...task}
                        onClick={() => {
                            setSelectedTask(task);
                            navigate('guidance');
                        }}
                    />
                ))}

                {!tasks.length && (
                    <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-light)' }}>
                        Loading customized task list...
                    </div>
                )}

            </div>
        </div>
    );
};

export default Dashboard;
