import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Info, Search, ChevronDown, ChevronRight, ExternalLink, PlusCircle, Check, Loader } from 'lucide-react';
import { getGuidanceTopic } from '../services/api';

// All available guidance topics
const GUIDANCE_TOPICS = [
    { id: 'death_certificate', title: 'Death Certificate', icon: '📜', description: 'How to obtain and register a death certificate' },
    { id: 'bank_accounts', title: 'Bank Account Claims', icon: '🏦', description: 'Claim or close bank accounts, FDs, lockers' },
    { id: 'insurance_claims', title: 'Insurance Claims', icon: '🛡', description: 'File life, health, and accidental insurance claims' },
    { id: 'epf_pf', title: 'EPF / PF Withdrawal', icon: '📊', description: 'Claim PF balance, pension, and EDLI insurance' },
    { id: 'nominee_legal_heir', title: 'Nominee vs Legal Heir', icon: '⚖️', description: 'Understand the difference and get certificates' },
    { id: 'property_transfer', title: 'Property Transfer', icon: '🏠', description: 'Mutation, succession, and title transfer' },
    { id: 'pension_claims', title: 'Pension Claims', icon: '🎖', description: 'Family pension for govt, EPS, NPS, and defence' },
    { id: 'utility_closure', title: 'Utility Accounts', icon: '🔌', description: 'Electricity, water, gas, phone, internet' },
    { id: 'loans_liabilities', title: 'Loans & Liabilities', icon: '💳', description: 'Home loan, personal loan, credit card debts' },
    { id: 'tax_steps', title: 'Tax Obligations', icon: '📑', description: 'Final ITR, capital gains, PAN status' },
    { id: 'digital_platforms', title: 'Digital & Social Media', icon: '📱', description: 'Email, social media, wallets, subscriptions' },
];

const Guidance = () => {
    const { navigate, selectedTask, addTask } = useContext(AppContext);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const [topicContent, setTopicContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedSections, setExpandedSections] = useState({});
    const [addedTasks, setAddedTasks] = useState(new Set());

    // Map task category to topic
    const categoryToTopicMap = {
        bank: 'bank_accounts', insurance: 'insurance_claims', investment: 'digital_platforms',
        pension: 'epf_pf', digital: 'digital_platforms', property: 'property_transfer',
        tax: 'tax_steps', legal: 'nominee_legal_heir', utility: 'utility_closure',
        government: 'epf_pf'
    };

    // Auto-select topic from task
    useEffect(() => {
        if (selectedTask && selectedTask.category) {
            const topicId = categoryToTopicMap[selectedTask.category];
            if (topicId) {
                setSelectedTopicId(topicId);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTask]);

    // Load topic content when selected
    useEffect(() => {
        if (!selectedTopicId) { setTopicContent(null); return; }
        setLoading(true);
        loadTopicContent(selectedTopicId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedTopicId]);

    const loadTopicContent = async (topicId) => {
        try {
            const res = await getGuidanceTopic(topicId);
            setTopicContent(res.data);
        } catch (err) {
            console.error('Failed to load guidance:', err);
            const topic = GUIDANCE_TOPICS.find(t => t.id === topicId);
            setTopicContent({
                title: topic?.title || topicId,
                sections: [{ 
                    title: 'Overview', 
                    content: 'Unable to load content. Please check your connection.' 
                }]
            });

        } finally {
            setLoading(false);
        }
    };

    const toggleSection = (idx) => {
        setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
    };

    const handleAddTask = async (stepTitle, category) => {
        if (addedTasks.has(stepTitle)) return;
        await addTask({
            name: stepTitle,
            category: category || 'general',
            priority: 'normal',
            source: 'guidance',
            sub: `From: ${GUIDANCE_TOPICS.find(t => t.id === selectedTopicId)?.title || 'Guidance'}`
        });
        setAddedTasks(prev => new Set([...prev, stepTitle]));
    };

    const filteredTopics = GUIDANCE_TOPICS.filter(t =>
        searchTerm === '' ||
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedTopic = GUIDANCE_TOPICS.find(t => t.id === selectedTopicId);

    // Parse raw text content into sections
    const parseSections = (rawText) => {
        if (!rawText) return [];
        const lines = rawText.split('\n');
        const sections = [];
        let currentSection = { title: 'Overview', lines: [] };

        for (const line of lines) {
            if (/^(STEP \d+|SCENARIO [A-Z]|TYPE \d+|OVERVIEW|IMPORTANT|ESCALATION|REQUIRED DOCUMENTS|TIMELINE|GENERAL|SPECIAL CASES|TAX IMPLICATIONS|KEY PRINCIPLE)/i.test(line.trim()) && line.trim().length > 3) {
                if (currentSection.lines.length > 0) {
                    sections.push({ ...currentSection, content: currentSection.lines.join('\n') });
                }
                currentSection = { title: line.trim().replace(/:$/, ''), lines: [] };
            } else {
                currentSection.lines.push(line);
            }
        }
        if (currentSection.lines.length > 0) {
            sections.push({ ...currentSection, content: currentSection.lines.join('\n') });
        }
        return sections;
    };

    const renderTopicContent = () => {
        if (loading) {
            return (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)' }}>
                    <Loader size={24} className="spin-anim" style={{ marginBottom: '12px' }} />
                    <div>Loading guidance...</div>
                </div>
            );
        }

        if (!topicContent) return null;

        const sections = topicContent.sections || parseSections(topicContent.rawText || '');

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sections.map((section, idx) => {
                    const isExpanded = expandedSections[idx] !== false;
                    const isStep = /^STEP/i.test(section.title);
                    const topicCat = categoryToTopicMap[selectedTask?.category] ? selectedTask.category : 'general';

                    return (
                        <div key={idx} style={{
                            backgroundColor: '#fff',
                            borderRadius: '14px',
                            border: '1px solid var(--border)',
                            overflow: 'hidden'
                        }}>
                            <button
                                onClick={() => toggleSection(idx)}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: isStep ? 'var(--pale-teal)' : '#fafafa',
                                    border: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    {isStep && (
                                        <span style={{
                                            backgroundColor: 'var(--deep-teal)', color: '#fff',
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '12px', fontWeight: 700, flexShrink: 0
                                        }}>
                                            {section.title.match(/\d+/)?.[0] || idx + 1}
                                        </span>
                                    )}
                                    <span style={{
                                        fontSize: '14px', fontWeight: 700,
                                        color: 'var(--text-dark)', textAlign: 'left'
                                    }}>
                                        {section.title}
                                    </span>
                                </div>
                                {isExpanded ? <ChevronDown size={18} color="var(--text-light)" /> : <ChevronRight size={18} color="var(--text-light)" />}
                            </button>

                            {isExpanded && (
                                <div style={{ padding: '14px 16px', fontSize: '14px', lineHeight: 1.7, color: 'var(--text-dark)' }}>
                                    {section.content.split('\n').map((line, li) => {
                                        const trimmed = line.trim();
                                        if (!trimmed) return <div key={li} style={{ height: '6px' }} />;

                                        const linkMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
                                        if (linkMatch) {
                                            const url = linkMatch[1];
                                            const label = trimmed.replace(url, '').replace(/Link:|link:/gi, '').trim() || url;
                                            return (
                                                <a key={li} href={url} target="_blank" rel="noreferrer"
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px',
                                                        padding: '6px 12px', marginTop: '6px',
                                                        backgroundColor: '#f0f7f7', borderRadius: '8px',
                                                        color: 'var(--deep-teal)', fontWeight: 600, fontSize: '13px',
                                                        textDecoration: 'none', border: '1px solid rgba(74,139,139,0.15)'
                                                    }}>
                                                    <ExternalLink size={13} /> {label || 'Visit official portal'}
                                                </a>
                                            );
                                        }

                                        if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                                            return (
                                                <div key={li} style={{ paddingLeft: '12px', marginTop: '3px', display: 'flex', gap: '6px' }}>
                                                    <span style={{ color: 'var(--gold)' }}>•</span>
                                                    <span>{trimmed.substring(1).trim()}</span>
                                                </div>
                                            );
                                        }

                                        return <div key={li} style={{ marginTop: '2px' }}>{trimmed}</div>;
                                    })}

                                    {isStep && (
                                        <button
                                            onClick={() => handleAddTask(section.title, topicCat)}
                                            disabled={addedTasks.has(section.title)}
                                            style={{
                                                marginTop: '12px', padding: '8px 14px', borderRadius: '10px',
                                                backgroundColor: addedTasks.has(section.title) ? '#D1FAE5' : 'rgba(201,169,110,0.1)',
                                                color: addedTasks.has(section.title) ? '#065F46' : 'var(--text-dark)',
                                                fontWeight: 600, fontSize: '13px', border: addedTasks.has(section.title) ? 'none' : '1px solid var(--gold-light)',
                                                cursor: addedTasks.has(section.title) ? 'default' : 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '6px'
                                            }}
                                        >
                                            {addedTasks.has(section.title)
                                                ? <><Check size={14} /> Added</>
                                                : <><PlusCircle size={14} /> Add to my to-do list</>
                                            }
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div style={{
            flex: 1, backgroundColor: 'var(--warm-white)',
            display: 'flex', flexDirection: 'column',
            paddingTop: 'var(--sat)', overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            minHeight: 0
        }}>

            <div style={{
                backgroundColor: 'var(--deep-teal)', padding: '16px 20px 24px',
                color: '#fff', position: 'sticky', top: 0, zIndex: 3
            }}>
                <button onClick={() => selectedTopicId ? setSelectedTopicId(null) : navigate('dashboard')}
                    style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                    <ArrowLeft size={20} color="#fff" />
                </button>

                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(201,169,110,0.4)', borderRadius: '20px',
                    color: 'var(--gold)', fontSize: '11px', fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '12px'
                }}>
                    📚 Procedural Guidance
                </div>

                <h1 style={{ fontSize: '28px', lineHeight: 1.2, margin: '0 0 8px 0', color: '#fff' }}>
                    {selectedTopic ? selectedTopic.title : 'Step-by-Step Guides'}
                </h1>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', margin: 0 }}>
                    {selectedTopic
                        ? selectedTopic.description
                        : 'Comprehensive A-Z guidance for post-bereavement processes'
                    }
                </p>
            </div>

            <div className="scroll-container" style={{ flex: 1, padding: '20px 20px 24px' }}>

                {!selectedTopicId ? (
                    <>
                        <div style={{
                            backgroundColor: 'var(--pale-teal)', borderRadius: '14px',
                            padding: '14px 16px', display: 'flex', gap: '10px', marginBottom: '20px',
                            border: '1px solid rgba(74,139,139,0.2)'
                        }}>
                            <Info size={18} color="var(--mid-teal)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'var(--text-dark)' }}>
                                Select a topic below to view detailed step-by-step procedures, required documents, timelines, and official portal links.
                            </p>
                        </div>

                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                placeholder="Search topics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    padding: '12px 16px 12px 40px', borderRadius: '12px',
                                    border: '1px solid var(--border)', fontSize: '14px',
                                    backgroundColor: '#fff', color: 'var(--text-dark)', outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {filteredTopics.map(topic => (
                                <button
                                    key={topic.id}
                                    onClick={() => setSelectedTopicId(topic.id)}
                                    style={{
                                        padding: '16px',
                                        borderRadius: '14px',
                                        border: '1px solid var(--border)',
                                        backgroundColor: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '14px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                        textAlign: 'left',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                                    }}
                                >
                                    <span style={{ fontSize: '28px', lineHeight: 1 }}>{topic.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-dark)', marginBottom: '3px' }}>
                                            {topic.title}
                                        </div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                                            {topic.description}
                                        </div>
                                    </div>
                                    <ChevronRight size={18} color="var(--text-light)" />
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    renderTopicContent()
                )}

            </div>

            {selectedTopicId && (
                <div style={{
                    flexShrink: 0,
                    backgroundColor: '#fff', borderTop: '1px solid var(--border)',
                    padding: '14px 20px', marginBottom: 'var(--nav-h)',
                    display: 'flex', gap: '10px'
                }}>
                    <button
                        onClick={() => navigate('documents')}
                        style={{
                            flex: 1, backgroundColor: 'var(--deep-teal)', color: '#fff',
                            fontWeight: 600, padding: '14px', borderRadius: '14px',
                            fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            border: 'none'
                        }}
                    >
                        📝 View Required Documents
                    </button>
                </div>
            )}


            <style>{`
                .spin-anim { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default Guidance;
