import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import Chip from '../components/Chip';
import { ArrowLeft, ArrowRight, Search, X, Check } from 'lucide-react';
import { updateUser } from '../services/api';

const Setup = () => {
    const {
        userName, setUserName,
        relationship, setRelationship,
        state, setState,
        employment, setEmployment,
        accounts, setAccounts,
        userId, navigate
    } = useContext(AppContext);

    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const relOptions = ['Spouse', 'Child (Son/Daughter)', 'Parent', 'Sibling', 'Legal heir/Other'];
    const stateOptions = ['Andhra Pradesh', 'Telangana', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Delhi', 'Other'];
    const empOptions = ['Salaried (Private)', 'Government Employee', 'Self-employed', 'Retired', 'Not sure'];
    const accOptions = [
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
        { id: 'Digital Wallet', icon: '📱' },
        { id: 'Social Media Account', icon: '📣' },
        { id: 'Post Office Savings', icon: '📮' },
        { id: 'Real Estate / Property', icon: '🏠' }
    ];

    const filteredAccOptions = accOptions.filter(opt =>
        searchTerm === '' || opt.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleAcc = (id) => {
        if (accounts.includes(id)) {
            setAccounts(accounts.filter(a => a !== id));
        } else {
            setAccounts([...accounts, id]);
        }
    };

    const handleToggleEmp = (id) => {
        setEmployment(employment === id ? '' : id);
    };

    const handleContinue = async () => {
        if (!userName || !relationship || accounts.length === 0) {
            alert("Please fill name, relationship, and select at least one account type.");
            return;
        }

        setLoading(true);
        try {
            await updateUser(userId, {
                name: userName,
                relationship,
                state,
                employment,
                accounts
            });
            navigate('chat');
        } catch (err) {
            console.error(err);
            alert("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
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
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center' }}>
                <button
                    onClick={() => navigate('onboarding')}
                    style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: 'var(--cream)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid var(--border)'
                    }}
                >
                    <ArrowLeft size={20} color="var(--deep-teal)" />
                </button>
            </div>

            {/* Main content scrollable */}
            <div className="scroll-container" style={{ flex: 1, padding: '0 20px 24px' }}>
                <h1 style={{ fontSize: '32px', color: 'var(--deep-teal)', marginBottom: '8px' }}>
                    Tell us about your situation
                </h1>
                <p style={{ color: 'var(--text-light)', fontSize: '15px', marginBottom: '32px' }}>
                    Personalises your guidance & document drafts
                </p>

                {/* Form fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-dark)' }}>
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Full Name"
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                backgroundColor: '#fff',
                                fontSize: '16px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-dark)' }}>
                            Relationship to the deceased
                        </label>
                        <select
                            value={relationship}
                            onChange={(e) => setRelationship(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                backgroundColor: '#fff',
                                fontSize: '16px',
                                appearance: 'none',
                                outline: 'none'
                            }}
                        >
                            <option value="" disabled>Select relation...</option>
                            {relOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-dark)' }}>
                            State of Residence (India)
                        </label>
                        <select
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                backgroundColor: '#fff',
                                fontSize: '16px',
                                appearance: 'none',
                                outline: 'none'
                            }}
                        >
                            <option value="" disabled>Select state...</option>
                            {stateOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-dark)' }}>
                            Employment Status of Deceased
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {empOptions.map(opt => (
                                <Chip
                                    key={opt}
                                    label={opt}
                                    selected={employment === opt}
                                    onToggle={() => handleToggleEmp(opt)}
                                />
                            ))}
                        </div>
                    </div>

                    <div style={{ paddingBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, color: 'var(--text-dark)' }}>
                            Accounts to Manage (Select all that apply)
                        </label>

                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-light)' }}>
                                <Search size={18} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search account types..."
                                value={searchTerm}
                                onFocus={() => setIsDropdownOpen(true)}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setIsDropdownOpen(true);
                                }}
                                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                                style={{
                                    width: '100%',
                                    boxSizing: 'border-box',
                                    padding: '12px 16px 12px 40px',
                                    borderRadius: '12px',
                                    border: isDropdownOpen ? '2px solid var(--gold)' : '1px solid var(--border)',
                                    fontSize: '14px',
                                    backgroundColor: '#fff',
                                    color: 'var(--text-dark)',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                            />

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: '100%',
                                    left: 0,
                                    right: 0,
                                    marginTop: '8px',
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    maxHeight: '240px',
                                    overflowY: 'auto',
                                    zIndex: 10
                                }}>
                                    {filteredAccOptions.map(opt => {
                                        const isSelected = accounts.includes(opt.id);
                                        return (
                                            <div
                                                key={opt.id}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleAcc(opt.id);
                                                }}
                                                style={{
                                                    padding: '12px 16px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--border)',
                                                    backgroundColor: isSelected ? 'var(--pale-teal)' : '#fff',
                                                    transition: 'background-color 0.2s',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between'
                                                }}
                                            >
                                                <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>
                                                    {opt.icon} {opt.id}
                                                </div>
                                                {isSelected && <Check size={18} color="var(--deep-teal)" />}
                                            </div>
                                        );
                                    })}
                                    {filteredAccOptions.length === 0 && (
                                        <div style={{ padding: '16px', color: 'var(--text-light)', textAlign: 'center', fontSize: '14px' }}>
                                            No accounts found for "{searchTerm}"
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Selected Chips */}
                        {accounts.length > 0 && (
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {accounts.map(accId => {
                                    const opt = accOptions.find(o => o.id === accId);
                                    if (!opt) return null;
                                    return (
                                        <div key={`chip-${opt.id}`} style={{
                                            display: 'flex', alignItems: 'center', gap: '6px',
                                            padding: '6px 12px', borderRadius: '16px',
                                            backgroundColor: 'var(--pale-teal)', border: '1px solid rgba(74,139,139,0.3)',
                                            fontSize: '13px', fontWeight: 600, color: 'var(--deep-teal)'
                                        }}>
                                            {opt.icon} {opt.id}
                                            <button
                                                onClick={() => handleToggleAcc(opt.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '16px', height: '16px', borderRadius: '50%',
                                                    backgroundColor: 'rgba(74,139,139,0.1)', color: 'var(--deep-teal)',
                                                    border: 'none', cursor: 'pointer', padding: 0
                                                }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
                backgroundColor: '#fff',
                paddingBottom: 'calc(16px + var(--sab))'
            }}>
                <button
                    onClick={handleContinue}
                    disabled={loading}
                    style={{
                        backgroundColor: 'var(--deep-teal)',
                        color: '#fff',
                        fontWeight: 600,
                        padding: '18px',
                        borderRadius: '16px',
                        width: '100%',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Setting up...' : 'Continue to Assistant'}
                    {!loading && <ArrowRight size={20} />}
                </button>
            </div>
        </div>
    );
};

export default Setup;
