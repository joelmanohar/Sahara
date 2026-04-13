import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Upload, Mail, MessageSquare, PenTool, Search, X, Check, Loader, PlusCircle, Save, ChevronRight, AlertTriangle, TrendingUp, Shield } from 'lucide-react';
import { detectAccountsFromDocument, detectAccountsFromText, mergeAccounts, getDecisionSupport } from '../services/api';

const ACCOUNT_TYPES = [
    { id: 'Bank Account', icon: '🏦' },
    { id: 'Life Insurance', icon: '🛡' },
    { id: 'EPF/PF', icon: '📊' },
    { id: 'Demat/Stocks', icon: '📈' },
    { id: 'UPI Wallet', icon: '💸' },
    { id: 'Mutual Funds', icon: '💹' },
    { id: 'PPF', icon: '🏛' },
    { id: 'NPS (Pension)', icon: '🏦' },
    { id: 'Fixed Deposit', icon: '💰' },
    { id: 'Credit Card', icon: '💳' },
    { id: 'Home Loan', icon: '🏠' },
    { id: 'Personal Loan', icon: '💵' },
    { id: 'Vehicle Registration', icon: '🚗' },
    { id: 'Real Estate / Property', icon: '🏠' },
    { id: 'Digital Wallet', icon: '📱' },
    { id: 'Social Media Account', icon: '📣' },
    { id: 'Subscription Service', icon: '🔔' },
    { id: 'Pension / Gratuity', icon: '🎖' },
    { id: 'Post Office Savings', icon: '📮' },
    { id: 'Other', icon: '📋' },
];

const KEYWORD_SUGGESTIONS = [
    'bank account', 'credited', 'debited', 'policy number', 'insurance premium',
    'EPF', 'loan EMI', 'OTP', 'transaction alert', 'mutual fund', 'SIP',
    'credit card', 'demat', 'pension', 'PF', 'FD maturity'
];

const CONFIDENCE_COLORS = {
    high: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    medium: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    low: { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
};

const URGENCY_COLORS = {
    urgent: { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', label: '🚨 Urgent' },
    important: { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A', label: '⭐ Important' },
    normal: { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0', label: 'Normal' },
};

const ACTION_COLORS = {
    Claim: { bg: '#DBEAFE', text: '#1D4ED8' },
    Close: { bg: '#FEE2E2', text: '#DC2626' },
    Transfer: { bg: '#E0E7FF', text: '#4338CA' },
    'Keep Active': { bg: '#D1FAE5', text: '#065F46' },
    Investigate: { bg: '#FEF3C7', text: '#92400E' },
};

const AccountCard = ({ account, onRemove, decision, onAddTask, taskAdded }) => {
    const [expanded, setExpanded] = useState(false);
    const conf = account.confidence ? CONFIDENCE_COLORS[account.confidence] || CONFIDENCE_COLORS.medium : null;

    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '14px',
            border: decision?.urgencyLevel === 'urgent' ? '1.5px solid #FECACA' : '1px solid var(--border)',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
            {/* Main row */}
            <div
                onClick={() => decision && setExpanded(!expanded)}
                style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: decision ? 'pointer' : 'default',
                }}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {account.type}
                        {account.name ? <span style={{ color: 'var(--text-mid)', fontWeight: 500 }}> · {account.name}</span> : null}
                    </div>
                    {account.note ? <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>{account.note}</div> : null}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', backgroundColor: 'var(--pale-teal)', color: 'var(--deep-teal)', fontWeight: 600 }}>
                            {account.detectedBy || 'manual'}
                        </span>
                        {conf && (
                            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', backgroundColor: conf.bg, color: conf.text, border: `1px solid ${conf.border}`, fontWeight: 600 }}>
                                {account.confidence}
                            </span>
                        )}
                        {decision && (
                            <>
                                <span style={{
                                    fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                                    backgroundColor: (ACTION_COLORS[decision.recommendedAction] || ACTION_COLORS.Investigate).bg,
                                    color: (ACTION_COLORS[decision.recommendedAction] || ACTION_COLORS.Investigate).text,
                                    fontWeight: 700
                                }}>
                                    {decision.recommendedAction}
                                </span>
                                <span style={{
                                    fontSize: '11px', padding: '2px 8px', borderRadius: '6px',
                                    backgroundColor: (URGENCY_COLORS[decision.urgencyLevel] || URGENCY_COLORS.normal).bg,
                                    color: (URGENCY_COLORS[decision.urgencyLevel] || URGENCY_COLORS.normal).text,
                                    fontWeight: 600
                                }}>
                                    {(URGENCY_COLORS[decision.urgencyLevel] || URGENCY_COLORS.normal).label}
                                </span>
                            </>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {decision && (
                        <ChevronRight size={16} color="var(--text-light)" style={{
                            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                        }} />
                    )}
                    {onRemove && (
                        <button onClick={(e) => { e.stopPropagation(); onRemove(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }}>
                            <X size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Decision Support Expanded */}
            {expanded && decision && (
                <div style={{
                    padding: '0 16px 16px',
                    borderTop: '1px solid var(--border)',
                    paddingTop: '14px',
                    animation: 'slideUp 0.2s ease'
                }}>
                    {decision.whatItIs && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '13px' }}>
                            <Shield size={16} color="var(--soft-teal)" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span style={{ color: 'var(--text-dark)' }}>{decision.whatItIs}</span>
                        </div>
                    )}
                    {decision.whatToGain && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '13px' }}>
                            <TrendingUp size={16} color="#16A34A" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span style={{ color: 'var(--text-dark)' }}><strong>What you can gain:</strong> {decision.whatToGain}</span>
                        </div>
                    )}
                    {decision.risksOfIgnoring && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', fontSize: '13px' }}>
                            <AlertTriangle size={16} color="#DC2626" style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span style={{ color: 'var(--text-dark)' }}><strong>Risk of inaction:</strong> {decision.risksOfIgnoring}</span>
                        </div>
                    )}
                    {decision.keySteps && decision.keySteps.length > 0 && (
                        <div style={{ marginTop: '10px', marginBottom: '12px' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-mid)', marginBottom: '6px' }}>KEY STEPS:</div>
                            {decision.keySteps.map((step, j) => (
                                <div key={j} style={{ fontSize: '13px', color: 'var(--text-dark)', padding: '3px 0', display: 'flex', gap: '6px' }}>
                                    <span style={{ color: 'var(--gold)', fontWeight: 700 }}>{j + 1}.</span>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    {decision.suggestedDeadline && (
                        <div style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 600, marginBottom: '10px' }}>
                            ⏰ Suggested timeline: {decision.suggestedDeadline}
                        </div>
                    )}
                    {/* Add to tasks CTA */}
                    {onAddTask && (
                        <button
                            onClick={() => onAddTask(account, decision)}
                            disabled={taskAdded}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '10px',
                                backgroundColor: taskAdded ? '#D1FAE5' : 'var(--pale-teal)',
                                color: taskAdded ? '#065F46' : 'var(--deep-teal)',
                                fontWeight: 700,
                                fontSize: '13px',
                                border: 'none',
                                cursor: taskAdded ? 'default' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                            }}
                        >
                            {taskAdded ? <><Check size={14} /> Added to tasks</> : <><PlusCircle size={14} /> Add to my to-do list</>}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

// ─── Tab: Document Upload ────────────────────────────────────────
const DocumentTab = ({ onDetected }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [dragOver, setDragOver] = useState(false);

    const handleFile = (f) => { if (f) { setFile(f); setError(''); } };

    const handleAnalyse = async () => {
        if (!file) return;
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await detectAccountsFromDocument(formData);
            const accounts = res.data.accounts || [];
            onDetected(accounts.map(a => ({ ...a, detectedBy: 'document' })));
            if (accounts.length === 0) setError('No accounts detected. Try a different document or use the text paste option.');
        } catch (e) {
            setError('Analysis failed. Please try a different file format or try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>
                Upload a bank statement, insurance paper, or any financial document. Our AI will scan it and identify related accounts.
            </p>
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById('doc-file-input').click()}
                style={{
                    borderRadius: '16px',
                    border: `2px dashed ${dragOver ? 'var(--deep-teal)' : 'var(--border)'}`,
                    backgroundColor: dragOver ? 'var(--pale-teal)' : '#fafafa',
                    padding: '36px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                }}
            >
                <Upload size={32} color={dragOver ? 'var(--deep-teal)' : 'var(--text-light)'} style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>
                    {file ? `📄 ${file.name}` : 'Tap to select or drag & drop'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>PDF, Image, or Text file — max 10 MB</div>
                <input id="doc-file-input" type="file" accept=".pdf,.txt,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>
            {file && (
                <button onClick={handleAnalyse} disabled={loading} style={{
                    backgroundColor: 'var(--deep-teal)', color: '#fff', fontWeight: 700, padding: '14px',
                    borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: '8px', opacity: loading ? 0.7 : 1, border: 'none', cursor: loading ? 'not-allowed' : 'pointer'
                }}>
                    {loading ? <><Loader size={18} className="spin-anim" /> Analysing…</> : '🔍 Analyse Document'}
                </button>
            )}
            {error && <div style={{ color: '#e11d48', fontSize: '13px', backgroundColor: '#fff1f2', padding: '10px 14px', borderRadius: '10px' }}>{error}</div>}
        </div>
    );
};

// ─── Tab: Text Analysis (Email / SMS) ────────────────────────────
const TextAnalysisTab = ({ source, onDetected }) => {
    const [text, setText] = useState('');
    const [consent, setConsent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalyse = async () => {
        if (!consent) { setError('Please confirm consent to proceed.'); return; }
        if (text.trim().length < 10) { setError('Please paste some text to analyse.'); return; }
        setLoading(true); setError('');
        try {
            const res = await detectAccountsFromText({ text, source });
            const accounts = res.data.accounts || [];
            onDetected(accounts.map(a => ({ ...a, detectedBy: source })));
            if (accounts.length === 0) setError('No accounts detected. Try different text content.');
        } catch (e) { setError('Analysis failed. Please try again.'); }
        finally { setLoading(false); }
    };

    const placeholder = source === 'email'
        ? 'Paste email text here…\n\nExample: "Your HDFC Bank account XXXX1234 has been credited ₹5,000 on 01-Mar-2026."'
        : 'Paste SMS messages here…\n\nExample: "SBI: Acct XX1234 debited ₹2,000. Available bal: ₹18,500."';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>
                Paste {source === 'email' ? 'email' : 'SMS'} content here. The AI will identify financial accounts mentioned.
            </p>
            <textarea value={text} onChange={(e) => { setText(e.target.value); setError(''); }} placeholder={placeholder} rows={8}
                style={{ width: '100%', boxSizing: 'border-box', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-dark)', backgroundColor: '#fff', outline: 'none', resize: 'vertical', fontFamily: 'inherit', lineHeight: '1.6' }} />

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <div onClick={() => setConsent(c => !c)} style={{ width: '20px', height: '20px', minWidth: '20px', borderRadius: '6px', border: `2px solid ${consent ? 'var(--deep-teal)' : 'var(--border)'}`, backgroundColor: consent ? 'var(--deep-teal)' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                    {consent && <Check size={12} color="#fff" />}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>I confirm this text does not contain passwords or sensitive data I don't want to share.</span>
            </label>

            <button onClick={handleAnalyse} disabled={loading || !text.trim()} style={{
                backgroundColor: 'var(--deep-teal)', color: '#fff', fontWeight: 700, padding: '14px', borderRadius: '12px',
                fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                opacity: (loading || !text.trim()) ? 0.7 : 1, border: 'none', cursor: (loading || !text.trim()) ? 'not-allowed' : 'pointer'
            }}>
                {loading ? <><Loader size={18} className="spin-anim" /> Analysing…</> : `🔍 Identify from ${source === 'email' ? 'Email' : 'SMS'}`}
            </button>
            {error && <div style={{ color: '#e11d48', fontSize: '13px', backgroundColor: '#fff1f2', padding: '10px 14px', borderRadius: '10px' }}>{error}</div>}
        </div>
    );
};

// ─── Tab: Manual Entry ────────────────────────────────────────────
const ManualTab = ({ onDetected }) => {
    const [selectedType, setSelectedType] = useState('');
    const [customName, setCustomName] = useState('');
    const [note, setNote] = useState('');
    const [search, setSearch] = useState('');

    const filtered = ACCOUNT_TYPES.filter(a => a.id.toLowerCase().includes(search.toLowerCase()));

    const handleAdd = () => {
        if (!selectedType) return;
        onDetected([{ type: selectedType, name: customName, note, detectedBy: 'manual', confidence: null }]);
        setSelectedType(''); setCustomName(''); setNote(''); setSearch('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>Manually enter any account you know about.</p>
            <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input type="text" placeholder="Search account type…" value={search} onChange={(e) => setSearch(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px 10px 10px 36px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
                {filtered.map(a => (
                    <button key={a.id} onClick={() => setSelectedType(a.id)}
                        style={{ padding: '8px 14px', borderRadius: '20px', border: `1.5px solid ${selectedType === a.id ? 'var(--deep-teal)' : 'var(--border)'}`, backgroundColor: selectedType === a.id ? 'var(--pale-teal)' : '#fff', color: selectedType === a.id ? 'var(--deep-teal)' : 'var(--text-dark)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                        {a.icon} {a.id}
                    </button>
                ))}
            </div>
            {selectedType && (
                <>
                    <input type="text" placeholder="Institution / Provider name (e.g. SBI, LIC)" value={customName} onChange={(e) => setCustomName(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }} />
                    <input type="text" placeholder="Note (account no., policy no., any detail)" value={note} onChange={(e) => setNote(e.target.value)}
                        style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '14px', outline: 'none', backgroundColor: '#fff' }} />
                </>
            )}
            <button onClick={handleAdd} disabled={!selectedType}
                style={{ backgroundColor: 'var(--deep-teal)', color: '#fff', fontWeight: 700, padding: '14px', borderRadius: '12px', fontSize: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: !selectedType ? 0.5 : 1, border: 'none', cursor: !selectedType ? 'not-allowed' : 'pointer' }}>
                <PlusCircle size={18} /> Add Account
            </button>
        </div>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────
const AccountIdentifier = () => {
    const { navigate, userId, userName, relationship, addTask } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('document');
    const [detectedAccounts, setDetectedAccounts] = useState([]);
    const [decisions, setDecisions] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');
    const [loadingDecisions, setLoadingDecisions] = useState(false);
    const [addedTaskKeys, setAddedTaskKeys] = useState(new Set());
    const [showKeywords, setShowKeywords] = useState(true);

    const tabs = [
        { id: 'document', label: 'Document', icon: <Upload size={16} /> },
        { id: 'email', label: 'Email', icon: <Mail size={16} /> },
        { id: 'sms', label: 'SMS', icon: <MessageSquare size={16} /> },
        { id: 'manual', label: 'Manual', icon: <PenTool size={16} /> },
    ];

    const handleDetected = async (newAccounts) => {
        if (!newAccounts.length) return;
        const updated = (() => {
            const makeKey = (a) => `${(a.type || '').toLowerCase()}:${(a.name || '').toLowerCase()}`;
            const existingKeys = new Set(detectedAccounts.map(makeKey));
            const toAdd = newAccounts.filter(a => !existingKeys.has(makeKey(a)));
            return [...detectedAccounts, ...toAdd];
        })();
        setDetectedAccounts(updated);
        setSaved(false); setSaveError(''); setShowKeywords(false);

        // Auto-fetch decision support
        if (updated.length > 0) {
            setLoadingDecisions(true);
            try {
                const res = await getDecisionSupport(updated, { name: userName, relationship });
                setDecisions(res.data.decisions || []);
            } catch (e) {
                console.error('Decision support failed:', e);
            } finally {
                setLoadingDecisions(false);
            }
        }
    };

    const handleRemove = (idx) => {
        setDetectedAccounts(prev => prev.filter((_, i) => i !== idx));
        setDecisions(prev => prev.filter(d => d.accountIndex !== idx));
        setSaved(false);
    };

    const handleSave = async () => {
        if (!detectedAccounts.length) return;
        setSaving(true); setSaveError('');
        try {
            await mergeAccounts(userId, detectedAccounts);
            setSaved(true);
        } catch (e) {
            setSaveError('Failed to save. Please try again.');
        } finally { setSaving(false); }
    };

    const handleAddTask = async (account, decision) => {
        const key = `${account.type}:${account.name}`;
        if (addedTaskKeys.has(key)) return;
        await addTask({
            name: `${decision.recommendedAction} — ${account.type}${account.name ? ' (' + account.name + ')' : ''}`,
            category: mapAccountCategory(account.accountCategory || account.type),
            priority: decision.urgencyLevel || 'normal',
            deadline: decision.suggestedDeadline || '',
            source: 'account-detection',
            sub: decision.whatToGain || `${decision.recommendedAction} this account`
        });
        setAddedTaskKeys(prev => new Set([...prev, key]));
    };

    const mapAccountCategory = (cat) => {
        const map = { Bank: 'bank', Insurance: 'insurance', Loan: 'bank', Government: 'government', Digital: 'digital', Investment: 'investment', Property: 'property' };
        return map[cat] || 'general';
    };

    return (
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 'var(--sat)',
            overflow: 'hidden', backgroundColor: 'var(--warm-white)', animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
        }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button onClick={() => navigate('dashboard')}
                    style={{ width: '40px', height: '40px', backgroundColor: 'var(--cream)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', cursor: 'pointer' }}>
                    <ArrowLeft size={20} color="var(--deep-teal)" />
                </button>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--deep-teal)', margin: 0 }}>Identify Accounts</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-light)', margin: 0 }}>Find all accounts to manage</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div style={{ padding: '0 20px 16px', display: 'flex', gap: '8px' }}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1, padding: '9px 4px', borderRadius: '10px', border: 'none', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                            backgroundColor: activeTab === tab.id ? 'var(--deep-teal)' : 'var(--cream)',
                            color: activeTab === tab.id ? '#fff' : 'var(--text-mid)', transition: 'all 0.2s',
                            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(74,139,139,0.3)' : 'none'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scrollable content */}
            <div className="scroll-container" style={{ flex: 1, padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Keyword suggestions */}
                {showKeywords && detectedAccounts.length === 0 && (
                    <div style={{
                        backgroundColor: 'rgba(201,169,110,0.08)',
                        borderRadius: '14px',
                        padding: '16px',
                        border: '1px solid rgba(201,169,110,0.2)'
                    }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '8px' }}>
                            💡 Tip: Search these keywords in your SMS or email inbox
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-mid)', marginBottom: '10px' }}>
                            Copy keywords below, search in your phone's Messages app, then paste results in the Email/SMS tab.
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {KEYWORD_SUGGESTIONS.map((kw, i) => (
                                <span key={i} style={{
                                    padding: '5px 12px', borderRadius: '16px', backgroundColor: '#fff',
                                    border: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-dark)',
                                    fontWeight: 500, cursor: 'pointer'
                                }}
                                    onClick={() => navigator.clipboard?.writeText(kw)}
                                >
                                    {kw}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Active tab panel */}
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    {activeTab === 'document' && <DocumentTab onDetected={handleDetected} />}
                    {activeTab === 'email' && <TextAnalysisTab source="email" onDetected={handleDetected} />}
                    {activeTab === 'sms' && <TextAnalysisTab source="sms" onDetected={handleDetected} />}
                    {activeTab === 'manual' && <ManualTab onDetected={handleDetected} />}
                </div>

                {/* Decision support loading */}
                {loadingDecisions && (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)', fontSize: '14px' }}>
                        <Loader size={20} className="spin-anim" style={{ marginBottom: '8px' }} />
                        <div>Generating guidance for detected accounts...</div>
                    </div>
                )}

                {/* Detected accounts list with decisions */}
                {detectedAccounts.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                                Detected Accounts ({detectedAccounts.length})
                            </h3>
                            <button onClick={() => { setDetectedAccounts([]); setSaved(false); setDecisions([]); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '13px' }}>
                                Clear all
                            </button>
                        </div>

                        {/* Conversational CTA */}
                        {decisions.length > 0 && !loadingDecisions && (
                            <div style={{
                                backgroundColor: 'var(--pale-teal)', borderRadius: '12px', padding: '14px 16px',
                                marginBottom: '12px', fontSize: '14px', color: 'var(--text-dark)', lineHeight: 1.5
                            }}>
                                We found <strong>{detectedAccounts.length} account{detectedAccounts.length > 1 ? 's' : ''}</strong>. Tap each one to see what to do and add actions to your to-do list.
                            </div>
                        )}

                        {/* Legal disclaimer */}
                        {decisions.length > 0 && (
                            <div style={{
                                backgroundColor: '#FFFBEB', borderRadius: '10px', padding: '10px 14px',
                                marginBottom: '12px', fontSize: '12px', color: '#92400E', border: '1px solid #FDE68A'
                            }}>
                                ⚠️ This is general guidance only, not legal advice. Nominee vs. legal heir rules vary. Consult a legal professional for your specific situation.
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                            {detectedAccounts.map((acc, idx) => (
                                <AccountCard
                                    key={idx}
                                    account={acc}
                                    onRemove={() => handleRemove(idx)}
                                    decision={decisions.find(d => d.accountIndex === idx)}
                                    onAddTask={handleAddTask}
                                    taskAdded={addedTaskKeys.has(`${acc.type}:${acc.name}`)}
                                />
                            ))}
                        </div>

                        <button onClick={handleSave} disabled={saving || saved}
                            style={{
                                width: '100%', backgroundColor: saved ? '#059669' : 'var(--gold)', color: '#fff', fontWeight: 700,
                                padding: '16px', borderRadius: '14px', fontSize: '15px', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', gap: '8px', opacity: saving ? 0.7 : 1, border: 'none',
                                cursor: saving ? 'not-allowed' : 'pointer', transition: 'background-color 0.3s'
                            }}
                        >
                            {saving ? <><Loader size={18} className="spin-anim" /> Saving…</>
                                : saved ? <><Check size={18} /> Saved to profile!</>
                                : <><Save size={18} /> Save to my profile</>}
                        </button>

                        {saveError && (
                            <div style={{ color: '#e11d48', fontSize: '13px', marginTop: '8px', backgroundColor: '#fff1f2', padding: '10px 14px', borderRadius: '10px' }}>
                                {saveError}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                .spin-anim { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AccountIdentifier;
