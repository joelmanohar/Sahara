import React, { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import ChatBubble from '../components/ChatBubble';
import RagBar from '../components/RagBar';
import { ArrowLeft, Send } from 'lucide-react';
import { sendChat, getChatHistory } from '../services/api';

const ONBOARDING_MESSAGE = `Hello. I'm here to support you through this difficult time. 🕊️

I can help you navigate the administrative and legal steps that follow the loss of a loved one — from obtaining the death certificate to managing bank accounts, insurance claims, property, pension, and more.

Would you like to share what situation brought you here so I can guide you better? You can also choose from the options below to get started.`;

const Chat = () => {
    const { navigate, accounts, history, setHistory, userId, busy, setBusy, addTask, userName } = useContext(AppContext);
    const [inputVal, setInputVal] = useState('');
    const [addedTasks, setAddedTasks] = useState(new Set());
    const scrollRef = useRef(null);

    // Initial load of chat history
    useEffect(() => {
        if (userId) {
            getChatHistory(userId)
                .then(res => {
                    const loadedHistory = res.data || [];
                    setHistory(loadedHistory);
                })
                .catch(err => console.error("Failed to load chat history", err));
        }
    }, [userId, setHistory]);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, busy]);

    const handleSend = async (text) => {
        if (!text.trim() || busy) return;

        setBusy(true);
        setInputVal('');

        const newMsg = { role: 'user', content: text };
        const updatedHistory = [...history, newMsg];
        setHistory(updatedHistory);

        try {
            const res = await sendChat({
                message: text,
                history: history,
                userId,
                accounts
            });

            const aiReply = {
                role: 'assistant',
                content: res.data.reply,
                sources: res.data.sources,
                showDocCTA: res.data.showDocCTA,
                taskSuggestions: res.data.taskSuggestions || [],
                officialLinks: res.data.officialLinks || [],
                hasRagData: res.data.hasRagData
            };

            setHistory([...updatedHistory, aiReply]);
        } catch (err) {
            console.error(err);
            setHistory([
                ...updatedHistory,
                {
                    role: 'assistant',
                    content: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment. If this persists, check your internet connection.',
                }
            ]);
        } finally {
            setBusy(false);
        }
    };

    const handleAddTask = async (task) => {
        const taskKey = task.name;
        if (addedTasks.has(taskKey)) return;

        await addTask({
            name: task.name,
            category: task.category || 'general',
            priority: task.priority || 'normal',
            deadline: task.deadline || '',
            source: 'chat',
            sub: `Priority: ${task.priority || 'normal'}${task.deadline ? ' · ' + task.deadline : ''}`
        });
        setAddedTasks(prev => new Set([...prev, taskKey]));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(inputVal);
        }
    };

    return (
        <div style={{
            flex: 1, backgroundColor: 'var(--warm-white)',
            display: 'flex', flexDirection: 'column',
            paddingTop: 'var(--sat)', overflow: 'hidden'
        }}>
            {/* Top Bar */}
            <div style={{
                padding: '10px 16px 12px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: '#fff',
                display: 'flex', alignItems: 'center', gap: '12px'
            }}>
                <button onClick={() => navigate('dashboard')} style={{ padding: '8px' }}>
                    <ArrowLeft size={24} color="var(--deep-teal)" />
                </button>

                <div style={{
                    width: '40px', height: '40px',
                    backgroundColor: 'var(--deep-teal)',
                    borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px'
                }}>
                    🕊️
                </div>

                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-dark)' }}>
                        Sahara Assistant
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: busy ? 'var(--gold)' : '#388E3C' }}>
                        <span style={{
                            width: '6px', height: '6px', borderRadius: '50%',
                            backgroundColor: busy ? 'var(--gold)' : '#388E3C',
                            animation: busy ? 'pulse 1s infinite' : 'none'
                        }} />
                        {busy ? 'Thinking…' : 'Online · RAG-powered'}
                    </div>
                </div>
            </div>

            <RagBar accounts={accounts} />

            {/* Chat feed */}
            <div ref={scrollRef} className="scroll-container" style={{
                flex: 1, padding: '14px 16px 20px',
                display: 'flex', flexDirection: 'column', gap: '12px',
                overflowY: 'auto'
            }}>

                {/* Empathetic Welcome Message */}
                {history.length === 0 && (
                    <div style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#fff', padding: '16px',
                        borderRadius: '16px', borderBottomLeftRadius: '4px',
                        boxShadow: 'var(--shadow-sm)', maxWidth: '85%',
                        fontSize: '15px', lineHeight: 1.6, color: 'var(--text-dark)',
                        whiteSpace: 'pre-wrap'
                    }}>
                        {userName
                            ? ONBOARDING_MESSAGE.replace('Hello.', `Hello ${userName}.`)
                            : ONBOARDING_MESSAGE
                        }
                    </div>
                )}

                {history.map((msg, idx) => (
                    <React.Fragment key={idx}>
                        <ChatBubble
                            role={msg.role}
                            content={msg.content}
                            showSource={msg.sources && msg.sources.length > 0}
                            officialLinks={msg.officialLinks}
                            taskSuggestions={msg.taskSuggestions?.filter(t => !addedTasks.has(t.name))}
                            onAddTask={handleAddTask}
                        />
                        {msg.showDocCTA && (
                            <div style={{ alignSelf: 'flex-start', marginTop: '4px' }}>
                                <button
                                    onClick={() => navigate('documents')}
                                    style={{
                                        backgroundColor: 'var(--pale-teal)',
                                        color: 'var(--deep-teal)',
                                        padding: '8px 16px', borderRadius: '20px',
                                        fontSize: '13px', fontWeight: 600, border: 'none'
                                    }}
                                >
                                    📝 Open Documents
                                </button>
                            </div>
                        )}

                        {/* RAG confidence indicator */}
                        {msg.role === 'assistant' && msg.hasRagData === false && (
                            <div style={{
                                alignSelf: 'flex-start',
                                padding: '6px 12px',
                                backgroundColor: '#FFF8E1',
                                border: '1px solid #FFE082',
                                borderRadius: '10px',
                                fontSize: '12px',
                                color: '#F57F17',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                ⚠️ General guidance — please verify with official sources
                            </div>
                        )}
                    </React.Fragment>
                ))}

                {busy && (
                    <div style={{
                        alignSelf: 'flex-start',
                        backgroundColor: '#fff', padding: '14px 20px',
                        borderRadius: '16px', borderBottomLeftRadius: '4px',
                        boxShadow: 'var(--shadow-sm)',
                        display: 'flex', gap: '6px'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-light)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.32s' }} />
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-light)', animation: 'bounce 1.4s infinite ease-in-out both', animationDelay: '-0.16s' }} />
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--text-light)', animation: 'bounce 1.4s infinite ease-in-out both' }} />
                    </div>
                )}

            </div>

            {/* Input Area */}
            <div style={{
                backgroundColor: '#fff', borderTop: '1px solid var(--border)',
                padding: '12px 16px', zIndex: 10,
                paddingBottom: 'calc(var(--nav-h) + 12px)'
            }}>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <textarea
                        value={inputVal}
                        onChange={e => setInputVal(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ask anything about the process..."
                        disabled={busy}
                        style={{
                            flex: 1, backgroundColor: 'var(--warm-white)',
                            border: '1px solid var(--border)', borderRadius: '22px',
                            padding: '13px 18px', fontSize: '15px', color: 'var(--text-dark)',
                            resize: 'none', height: '48px', maxHeight: '80px',
                            fontFamily: 'inherit', outline: 'none'
                        }}
                    />
                    <button
                        onClick={() => handleSend(inputVal)}
                        disabled={!inputVal.trim() || busy}
                        style={{
                            width: '48px', height: '48px', borderRadius: '24px',
                            backgroundColor: inputVal.trim() && !busy ? 'var(--deep-teal)' : 'var(--cream)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: 'none', transition: 'all 0.2s', flexShrink: 0
                        }}
                    >
                        <Send size={20} color={inputVal.trim() && !busy ? '#fff' : 'var(--text-light)'} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
