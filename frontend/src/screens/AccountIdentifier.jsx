import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Upload, Mail, MessageSquare, PenTool, Search, X, Check, Loader, PlusCircle, Save } from 'lucide-react';
import { detectAccountsFromDocument, detectAccountsFromText, mergeAccounts } from '../services/api';

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
    { id: 'Vehicle Registration', icon: '🚗' },
    { id: 'Real Estate / Property', icon: '🏠' },
    { id: 'Digital Wallet', icon: '📱' },
    { id: 'Social Media Account', icon: '📣' },
    { id: 'Subscription Service', icon: '🔔' },
    { id: 'Pension / Gratuity', icon: '🎖' },
    { id: 'Post Office Savings', icon: '📮' },
    { id: 'Other', icon: '📋' },
];

const CONFIDENCE_COLORS = {
    high: { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    medium: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    low: { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
};

const AccountCard = ({ account, onRemove }) => {
    const conf = account.confidence ? CONFIDENCE_COLORS[account.confidence] || CONFIDENCE_COLORS.medium : null;
    return (
        <div style={{
            backgroundColor: '#fff',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
        }}>
            <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-dark)', fontSize: '15px' }}>
                    {account.type}
                    {account.name ? <span style={{ color: 'var(--text-mid)', fontWeight: 500 }}> · {account.name}</span> : null}
                </div>
                {account.note ? <div style={{ fontSize: '13px', color: 'var(--text-light)', marginTop: '2px' }}>{account.note}</div> : null}
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', backgroundColor: 'var(--pale-teal)', color: 'var(--deep-teal)', fontWeight: 600 }}>
                        {account.detectedBy || 'manual'}
                    </span>
                    {conf && (
                        <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '6px', backgroundColor: conf.bg, color: conf.text, border: `1px solid ${conf.border}`, fontWeight: 600 }}>
                            {account.confidence} confidence
                        </span>
                    )}
                </div>
            </div>
            {onRemove && (
                <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', padding: '4px' }}>
                    <X size={16} />
                </button>
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

    const handleFile = (f) => {
        if (!f) return;
        setFile(f);
        setError('');
    };

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
        } catch (e) {
            setError('Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>
                Upload a bank statement, insurance paper, or any financial document. Our AI will scan it and identify related accounts.
            </p>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById('doc-file-input').click()}
                style={{
                    borderRadius: '16px',
                    border: `2px dashed ${dragOver ? 'var(--deep-teal)' : 'var(--border)'}`,
                    backgroundColor: dragOver ? 'var(--pale-teal)' : '#fafafa',
                    padding: '36px 20px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
            >
                <Upload size={32} color={dragOver ? 'var(--deep-teal)' : 'var(--text-light)'} style={{ marginBottom: '8px' }} />
                <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>
                    {file ? `📄 ${file.name}` : 'Tap to select or drag & drop'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-light)' }}>PDF, Image, or Text file — max 10 MB</div>
                <input
                    id="doc-file-input"
                    type="file"
                    accept=".pdf,.txt,.jpg,.jpeg,.png"
                    style={{ display: 'none' }}
                    onChange={(e) => handleFile(e.target.files[0])}
                />
            </div>

            {file && (
                <button
                    onClick={handleAnalyse}
                    disabled={loading}
                    style={{
                        backgroundColor: 'var(--deep-teal)',
                        color: '#fff',
                        fontWeight: 700,
                        padding: '14px',
                        borderRadius: '12px',
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: loading ? 0.7 : 1,
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</> : '🔍 Analyse Document'}
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
        setLoading(true);
        setError('');
        try {
            const res = await detectAccountsFromText({ text, source });
            const accounts = res.data.accounts || [];
            onDetected(accounts.map(a => ({ ...a, detectedBy: source })));
        } catch (e) {
            setError('Analysis failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const placeholder = source === 'email'
        ? 'Paste email text here…\n\nExample: "Your HDFC Bank account XXXX1234 has been credited ₹5,000 on 01-Mar-2026."'
        : 'Paste SMS messages here…\n\nExample: "SBI: Acct XX1234 debited ₹2,000. Available bal: ₹18,500."';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>
                Paste {source === 'email' ? 'email' : 'SMS'} content here. The AI will identify financial accounts mentioned.
            </p>

            <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setError(''); }}
                placeholder={placeholder}
                rows={8}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '14px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    fontSize: '14px',
                    color: 'var(--text-dark)',
                    backgroundColor: '#fff',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: '1.6'
                }}
            />

            {/* Consent toggle */}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <div
                    onClick={() => setConsent(c => !c)}
                    style={{
                        width: '20px',
                        height: '20px',
                        minWidth: '20px',
                        borderRadius: '6px',
                        border: `2px solid ${consent ? 'var(--deep-teal)' : 'var(--border)'}`,
                        backgroundColor: consent ? 'var(--deep-teal)' : '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    {consent && <Check size={12} color="#fff" />}
                </div>
                <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                    I confirm this text does not contain any passwords or sensitive data I don't want to share.
                </span>
            </label>

            <button
                onClick={handleAnalyse}
                disabled={loading || !text.trim()}
                style={{
                    backgroundColor: 'var(--deep-teal)',
                    color: '#fff',
                    fontWeight: 700,
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: (loading || !text.trim()) ? 0.7 : 1,
                    border: 'none',
                    cursor: (loading || !text.trim()) ? 'not-allowed' : 'pointer'
                }}
            >
                {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</> : `🔍 Identify from ${source === 'email' ? 'Email' : 'SMS'}`}
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
        setSelectedType('');
        setCustomName('');
        setNote('');
        setSearch('');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ fontSize: '14px', color: 'var(--text-light)', margin: 0 }}>
                Manually enter any account you know about.
            </p>

            {/* Search */}
            <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                    type="text"
                    placeholder="Search account type…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '10px 10px 10px 36px',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        fontSize: '14px',
                        outline: 'none',
                        backgroundColor: '#fff'
                    }}
                />
            </div>

            {/* Account type grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '200px', overflowY: 'auto', padding: '4px 0' }}>
                {filtered.map(a => (
                    <button
                        key={a.id}
                        onClick={() => setSelectedType(a.id)}
                        style={{
                            padding: '8px 14px',
                            borderRadius: '20px',
                            border: `1.5px solid ${selectedType === a.id ? 'var(--deep-teal)' : 'var(--border)'}`,
                            backgroundColor: selectedType === a.id ? 'var(--pale-teal)' : '#fff',
                            color: selectedType === a.id ? 'var(--deep-teal)' : 'var(--text-dark)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s'
                        }}
                    >
                        {a.icon} {a.id}
                    </button>
                ))}
            </div>

            {selectedType && (
                <>
                    <input
                        type="text"
                        placeholder={`Institution / Provider name (e.g. SBI, LIC, HDFC)`}
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            fontSize: '14px',
                            outline: 'none',
                            backgroundColor: '#fff'
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Note (account no., policy no., any detail)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: '1px solid var(--border)',
                            fontSize: '14px',
                            outline: 'none',
                            backgroundColor: '#fff'
                        }}
                    />
                </>
            )}

            <button
                onClick={handleAdd}
                disabled={!selectedType}
                style={{
                    backgroundColor: 'var(--deep-teal)',
                    color: '#fff',
                    fontWeight: 700,
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    opacity: !selectedType ? 0.5 : 1,
                    border: 'none',
                    cursor: !selectedType ? 'not-allowed' : 'pointer'
                }}
            >
                <PlusCircle size={18} /> Add Account
            </button>
        </div>
    );
};

// ─── Main Screen ─────────────────────────────────────────────────
const AccountIdentifier = () => {
    const { navigate, userId } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('document');
    const [detectedAccounts, setDetectedAccounts] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [saveError, setSaveError] = useState('');

    const tabs = [
        { id: 'document', label: 'Document', icon: <Upload size={16} /> },
        { id: 'email', label: 'Email', icon: <Mail size={16} /> },
        { id: 'sms', label: 'SMS', icon: <MessageSquare size={16} /> },
        { id: 'manual', label: 'Manual', icon: <PenTool size={16} /> },
    ];

    const handleDetected = (newAccounts) => {
        if (!newAccounts.length) return;
        setDetectedAccounts(prev => {
            const makeKey = (a) => `${(a.type || '').toLowerCase()}:${(a.name || '').toLowerCase()}`;
            const existingKeys = new Set(prev.map(makeKey));
            const toAdd = newAccounts.filter(a => !existingKeys.has(makeKey(a)));
            return [...prev, ...toAdd];
        });
        setSaved(false);
        setSaveError('');
    };

    const handleRemove = (idx) => {
        setDetectedAccounts(prev => prev.filter((_, i) => i !== idx));
        setSaved(false);
    };

    const handleSave = async () => {
        if (!detectedAccounts.length) return;
        setSaving(true);
        setSaveError('');
        try {
            await mergeAccounts(userId, detectedAccounts);
            setSaved(true);
        } catch (e) {
            setSaveError('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 'var(--sat)',
            overflow: 'hidden',
            backgroundColor: 'var(--warm-white)',
            animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
        }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                    onClick={() => navigate('dashboard')}
                    style={{
                        width: '40px', height: '40px',
                        backgroundColor: 'var(--cream)',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--border)',
                        cursor: 'pointer'
                    }}
                >
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
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1,
                            padding: '9px 4px',
                            borderRadius: '10px',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            backgroundColor: activeTab === tab.id ? 'var(--deep-teal)' : 'var(--cream)',
                            color: activeTab === tab.id ? '#fff' : 'var(--text-mid)',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(74,139,139,0.3)' : 'none'
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Scrollable content */}
            <div className="scroll-container" style={{ flex: 1, padding: '0 20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                {/* Active tab panel */}
                <div style={{ backgroundColor: '#fff', borderRadius: '16px', padding: '20px', border: '1px solid var(--border)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    {activeTab === 'document' && <DocumentTab onDetected={handleDetected} />}
                    {activeTab === 'email' && <TextAnalysisTab source="email" onDetected={handleDetected} />}
                    {activeTab === 'sms' && <TextAnalysisTab source="sms" onDetected={handleDetected} />}
                    {activeTab === 'manual' && <ManualTab onDetected={handleDetected} />}
                </div>

                {/* Detected accounts list */}
                {detectedAccounts.length > 0 && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-dark)', margin: 0 }}>
                                Detected Accounts ({detectedAccounts.length})
                            </h3>
                            <button
                                onClick={() => { setDetectedAccounts([]); setSaved(false); }}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-light)', fontSize: '13px' }}
                            >
                                Clear all
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                            {detectedAccounts.map((acc, idx) => (
                                <AccountCard key={idx} account={acc} onRemove={() => handleRemove(idx)} />
                            ))}
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={saving || saved}
                            style={{
                                width: '100%',
                                backgroundColor: saved ? '#059669' : 'var(--gold)',
                                color: '#fff',
                                fontWeight: 700,
                                padding: '16px',
                                borderRadius: '14px',
                                fontSize: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                opacity: saving ? 0.7 : 1,
                                border: 'none',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                transition: 'background-color 0.3s'
                            }}
                        >
                            {saving
                                ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
                                : saved
                                    ? <><Check size={18} /> Saved to profile!</>
                                    : <><Save size={18} /> Save to my profile</>
                            }
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
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};

export default AccountIdentifier;
