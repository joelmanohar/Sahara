import React, { useContext, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft, Info, Search, X, Check } from 'lucide-react';
// StepCard imported previously but not used in this screen

const Guidance = () => {
    const { navigate, selectedTask } = useContext(AppContext);

    // Dynamic guidance modules (Module 3)
    const modules = {
        gmail: {
            title: 'Gmail Account Handling',
            covers: ['Account recovery', 'Memorialization / deactivation', 'Data export (Google Takeout)'],
            officialLinks: [
                { label: 'Google Account Help - Close an account', url: 'https://support.google.com/accounts/answer/32046' },
                { label: 'Google: Inactive Account Manager', url: 'https://support.google.com/accounts/answer/3036546' },
                { label: 'Google Takeout', url: 'https://takeout.google.com/' }
            ],
            steps: [
                'Verify access: attempt password recovery using registered email/phone.',
                'If you have legal authority, prepare a court order or government ID proof.',
                'Use Google’s Inactive Account Manager to request data or follow their legal process for account closure.',
                'Download data via Google Takeout before requesting closure.'
            ],
            requiredDocs: ['Government ID (Aadhaar/PAN)', 'Death certificate (if applicable)', 'Court order / legal heir proof (if required)']
        },
        instagram: {
            title: 'Facebook / Instagram Memorialization',
            covers: ['Requesting memorialization', 'Account removal', 'Recovery steps'],
            officialLinks: [
                { label: 'Meta — Memorialization', url: 'https://www.facebook.com/help/1506822589577997' },
                { label: 'Instagram Help Center', url: 'https://help.instagram.com/264154560391256' }
            ],
            steps: [
                'Visit the official memorialization page and choose the correct form for the property you represent.',
                'Fill the online form with the deceased’s profile link and attach a copy of the death certificate.',
                'Provide proof of authority (e.g., executor, family member) if requested by Meta.',
                'Wait for confirmation email from Facebook/Instagram — processing may take several days.'
            ],
            requiredDocs: ['Death certificate (scanned)', 'Proof of relationship (family ID)', 'Government ID of requester']
        },
        subscriptions: {
            title: 'Subscription Cancellations',
            covers: ['Cancel recurring payments', 'Remove cards from services', 'Contacting merchants'],
            officialLinks: [
                { label: 'Google Play Subscriptions', url: 'https://support.google.com/googleplay/answer/7018481' },
                { label: 'Apple Subscriptions', url: 'https://support.apple.com/en-in/HT202039' }
            ],
            steps: [
                'List all recurring payments from bank statements and app stores.',
                'Sign in to each service (or contact support) and cancel subscriptions.',
                'Remove saved cards from merchant accounts or request merchant to stop recurring charges.',
                'If unable to access account, request chargeback through bank after gathering proof.'
            ],
            requiredDocs: ['Bank statements showing recurring charges', 'Login verification (if available)', 'Proof of relationship for requests']
        },
        upi: {
            title: 'UPI Wallets (Paytm, PhonePe)',
            covers: ['Account access', 'Wallet balance withdrawal', 'KYC & bank linkage'],
            officialLinks: [
                { label: 'Paytm Support', url: 'https://paytm.com/care' },
                { label: 'PhonePe Help', url: 'https://help.phonepe.com/' }
            ],
            steps: [
                'Identify linked bank accounts and UPI IDs from transaction history.',
                'Contact wallet support with death certificate and KYC to request balance transfer or closure.',
                'If wallet is KYC-linked to a bank account, ask the wallet provider to transfer funds to the nominee/beneficiary account.',
                'Escalate with bank if wallet provider requests bank confirmation.'
            ],
            requiredDocs: ['Death certificate', 'KYC documents of requester', 'Bank passbook / statement showing linkage']
        },
        demat: {
            title: 'Demat & Investment Accounts',
            covers: ['Transmission of securities', 'Nomination checks', 'Transfer to legal heirs'],
            officialLinks: [
                { label: 'NSDL - Transmission', url: 'https://www.nsdl.co.in/transmission.php' },
                { label: 'CDSL - Transmission', url: 'https://www.cdslindia.com/' }
            ],
            steps: [
                'Check whether nomination is present in demat account statements.',
                'If nominee exists, follow DP (depository participant) process to transfer holdings; provide death certificate & KYC.',
                'If no nominee, prepare transmission forms and legal heir certificates as per DP guidelines.',
                'Coordinate with broker/DP to execute transfer — this often requires original documents.'
            ],
            requiredDocs: ['Demat account statement', 'Death certificate', 'Legal heir certificate or succession certificate (if no nominee)', 'KYC of claimant']
        }
        ,
        bank: {
            title: 'Bank Accounts & Related Services',
            covers: ['Account access', 'Account closure / transmission', 'Nominee & beneficiary claims', 'Loans & lien clearance'],
            officialLinks: [
                { label: 'Reserve Bank of India', url: 'https://www.rbi.org.in/' },
                { label: 'NPCI / UPI (payments)', url: 'https://www.npci.org.in/' }
            ],
            steps: [
                'Gather account details: passbook, account number, branch IFSC and recent statements.',
                'Contact the bank branch where the account is held and inform them of the account holder’s death; ask for the bank’s specific transmission/closure process.',
                'If a nominee exists, submit the nominee’s KYC and the death certificate along with the bank claim/nomination form to transfer or close the account.',
                'If there is no nominee, follow the bank’s transmission procedure — banks generally require a legal heir certificate, succession certificate, or letter of indemnity depending on the balance and policy.',
                'For any loans or liened accounts, request a foreclosure/settlement statement and coordinate payment or transfer of the liability with legal heirs or the estate executor.'
            ],
            requiredDocs: ['Death certificate (original / attested copy)', 'Account passbook or statement', 'KYC of claimant (Aadhaar/PAN)', 'Legal heir certificate or succession certificate (if no nominee)', 'Loan documents (if applicable)']
        },
        insurance: {
            title: 'Life Insurance Claims',
            covers: ['Claim filing', 'Document submission', 'Nominee benefits'],
            officialLinks: [
                { label: 'IRDAI - Insurance Claims', url: 'https://www.irdai.gov.in/' },
                { label: 'LIC India', url: 'https://licindia.in/' }
            ],
            steps: [
                'Locate the original policy document and death certificate.',
                'Identify the nominee and collect their identification documents.',
                'Submit the claim form along with death certificate, policy document, and nominee\'s KYC.',
                'Track claim status through the insurer\'s portal or customer service.'
            ],
            requiredDocs: ['Death certificate', 'Original policy document', 'Nominee\'s KYC (Aadhaar/PAN)', 'Claim form (duly filled)', 'Police FIR (if accident)']
        },
        epf: {
            title: 'EPF / PF Claims',
            covers: ['EPF withdrawal', 'Form 10D', 'Transfer to new employer'],
            officialLinks: [
                { label: 'EPFO Portal', url: 'https://www.epfindia.gov.in/' },
                { label: 'Member Portal', url: 'https://unifiedportal-mem.epfindia.gov.in/' }
            ],
            steps: [
                'Login to the EPFO member portal with UAN and password.',
                'Verify KYC details are updated (Aadhaar, bank account).',
                'Submit composite claim form (Form 31) for withdrawal/settlement.',
                'For death claims, nominee needs to submit death certificate and Form 10D.'
            ],
            requiredDocs: ['UAN registered with Aadhaar', 'Bank account linked to UAN', 'Death certificate', 'Form 10D (for death claims)', 'Nominee ID proof']
        }
    };

    // (Previously used to limit modules; now we show all modules by default.)

    // Map task category to module key
    const taskCategoryToModuleMap = {
        'bank': 'bank',
        'insurance': 'insurance',
        'investment': 'demat',
        'pension': 'epf',
        'digital': 'gmail'
    };

    // Determine available modules: show all modules by default so users can
    // access any guidance topic regardless of their saved accounts.
    const getAvailableModules = () => {
        const keys = Object.keys(modules);
        // If there's a selected task, try to prioritize that module by moving
        // it to the front of the list for easier access.
        if (selectedTask && selectedTask.category) {
            const taskModuleKey = taskCategoryToModuleMap[selectedTask.category];
            if (taskModuleKey && modules[taskModuleKey]) {
                return [taskModuleKey, ...keys.filter(k => k !== taskModuleKey)];
            }
        }
        return keys;
    };

    const availableModules = getAvailableModules();

    // Determine initial selected module
    const getInitialSelected = () => {
        if (selectedTask && selectedTask.category) {
            const taskModuleKey = taskCategoryToModuleMap[selectedTask.category];
            if (taskModuleKey && availableModules.includes(taskModuleKey)) {
                return taskModuleKey;
            }
        }
        return availableModules[0] || 'bank';
    };

    const [selectedModules, setSelectedModules] = React.useState([getInitialSelected()]);
    const [searchTerm, setSearchTerm] = React.useState('');
    const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

    // Update selected when available modules change
    useEffect(() => {
        if (!availableModules.some(m => selectedModules.includes(m))) {
            setSelectedModules([availableModules[0] || 'bank']);
        }
    }, [availableModules, selectedModules]);

    const filteredModules = availableModules.filter(key =>
        searchTerm === '' ||
        modules[key].title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        modules[key].covers.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const toggleSelection = (key) => {
        if (selectedModules.includes(key)) {
            setSelectedModules(selectedModules.filter(m => m !== key));
        } else {
            setSelectedModules([...selectedModules, key]);
        }
    };

    // Get dynamic header info based on task or active module
    const getHeaderInfo = () => {
        if (selectedModules.length > 0) {
            const activeStepsCount = selectedModules.reduce((acc, key) => acc + (modules[key]?.steps?.length || 0), 0);

            return {
                badge: '📚',
                title: 'All Guidance Topics',
                subtitle: selectedModules.length === 1 ? modules[selectedModules[0]].title : `${selectedModules.length} Topics Selected`,
                steps: `${activeStepsCount} steps in total`,
                time: 'Process specific',
                visit: 'Requirements vary'
            };
        }
        // Default fallback
        return {
            badge: '📚',
            title: 'All Guidance Topics',
            subtitle: 'Select topics below',
            steps: 'Various steps',
            time: 'Process specific',
            visit: 'Requirements vary'
        };
    };

    const headerInfo = getHeaderInfo();

    return (
        <div style={{
            flex: 1, backgroundColor: 'var(--warm-white)',
            display: 'flex', flexDirection: 'column',
            paddingTop: 'var(--sat)', overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            /* Allow this flex container to shrink so .scroll-container can scroll */
            minHeight: 0
        }}>

            {/* Hero Header */}
            <div style={{
                backgroundColor: 'var(--deep-teal)', padding: '16px 20px 24px',
                color: '#fff', position: 'sticky', top: 0, zIndex: 3
            }}>
                <button
                    onClick={() => navigate('dashboard')}
                    style={{
                        width: '40px', height: '40px',
                        backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px'
                    }}
                >
                    <ArrowLeft size={20} color="#fff" />
                </button>

                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(201,169,110,0.4)', borderRadius: '20px',
                    color: 'var(--gold)', fontSize: '11px', fontWeight: 600,
                    letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '16px'
                }}>
                    {headerInfo.badge} {headerInfo.title}
                </div>

                <h1 style={{ fontSize: '32px', lineHeight: 1.2, margin: '0 0 16px 0', color: '#fff' }}>
                    {headerInfo.subtitle}
                </h1>

                <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>📄 {headerInfo.steps}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>⏱ {headerInfo.time}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>🏢 {headerInfo.visit}</span>
                </div>
            </div>

            <div className="scroll-container" style={{ flex: 1, padding: '24px 20px 24px' }}>

                {/* Callout */}
                <div style={{
                    backgroundColor: 'var(--pale-teal)', borderRadius: '16px',
                    padding: '16px', display: 'flex', gap: '12px', marginBottom: '32px',
                    border: '1px solid rgba(74,139,139,0.2)'
                }}>
                    <div style={{ color: 'var(--mid-teal)', marginTop: '2px' }}><Info size={20} /></div>
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.5, color: 'var(--text-dark)' }}>
                        <strong>RBI Direction applies:</strong> For balances under ₹5 lakhs with no nominee, a simplified claim using an indemnity bond is available — no succession certificate required.
                    </p>
                </div>

                <div style={{
                    fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
                    color: 'var(--text-light)', marginBottom: '16px'
                }}>
                    STEP-BY-STEP PROCESS
                </div>

                <div style={{ marginBottom: '24px', position: 'relative' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{ position: 'absolute', left: '12px', top: '10px', color: 'var(--text-light)' }}>
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Search process..."
                            value={searchTerm}
                            onFocus={() => {
                                setIsDropdownOpen(true);
                                setSearchTerm(''); // Clear to show all options on focus
                            }}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsDropdownOpen(true);
                            }}
                            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delay to allow click
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
                    </div>

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
                            maxHeight: '280px',
                            overflowY: 'auto',
                            zIndex: 10
                        }}>
                            {filteredModules.map(key => {
                                const isSelected = selectedModules.includes(key);
                                return (
                                    <div
                                        key={key}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelection(key);
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
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, color: 'var(--text-dark)', marginBottom: '4px' }}>
                                                {modules[key].title}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-mid)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {modules[key].covers.join(' · ')}
                                            </div>
                                        </div>
                                        {isSelected && <Check size={18} color="var(--deep-teal)" />}
                                    </div>
                                );
                            })}
                            {filteredModules.length === 0 && (
                                <div style={{ padding: '16px', color: 'var(--text-light)', textAlign: 'center', fontSize: '14px' }}>
                                    No processes found for "{searchTerm}"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Selected Chips */}
                {selectedModules.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
                        {selectedModules.map(key => (
                            <div key={`chip-${key}`} style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 12px', borderRadius: '16px',
                                backgroundColor: 'var(--pale-teal)', border: '1px solid rgba(74,139,139,0.3)',
                                fontSize: '13px', fontWeight: 600, color: 'var(--deep-teal)'
                            }}>
                                {modules[key].title}
                                <button
                                    onClick={() => toggleSelection(key)}
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
                        ))}
                    </div>
                )}

                {/* Process Steps Loop */}
                {selectedModules.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-light)' }}>
                        Please select a process category from the search bar above to view the guidance steps.
                    </div>
                ) : (
                    selectedModules.map((key) => {
                        const moduleData = modules[key];
                        return (
                            <div key={key} style={{
                                marginBottom: '24px',
                                paddingBottom: '24px',
                                borderBottom: '1px solid var(--border)'
                            }}>
                                <h2 style={{ margin: '8px 0 6px', color: 'var(--deep-teal)', fontSize: '18px' }}>{moduleData.title}</h2>
                                <div style={{ color: 'var(--text-mid)', marginBottom: '12px', fontSize: '13px' }}>
                                    Covers: {moduleData.covers.join(' · ')}
                                </div>

                                <div style={{ display: 'flex', gap: '18px', marginBottom: '16px', flexWrap: 'wrap' }}>
                                    {moduleData.officialLinks.map((l, i) => (
                                        <a key={i} href={l.url} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '13px' }}>
                                            {l.label}
                                        </a>
                                    ))}
                                </div>

                                <div style={{ marginBottom: '16px' }}>
                                    <h3 style={{ fontSize: '14px', margin: '6px 0', color: 'var(--text-dark)' }}>Exact Steps</h3>
                                    <ol style={{ color: 'var(--text-light)', lineHeight: 1.6, paddingLeft: '20px', margin: '8px 0' }}>
                                        {moduleData.steps.map((s, i) => <li key={i} style={{ marginBottom: '6px' }}>{s}</li>)}
                                    </ol>
                                </div>

                                <div>
                                    <h3 style={{ fontSize: '14px', margin: '6px 0', color: 'var(--text-dark)' }}>Required Documents</h3>
                                    <ul style={{ color: 'var(--text-light)', lineHeight: 1.6, paddingLeft: '20px', margin: '8px 0' }}>
                                        {moduleData.requiredDocs.map((d, i) => <li key={i} style={{ marginBottom: '4px' }}>{d}</li>)}
                                    </ul>
                                </div>
                            </div>
                        );
                    })
                )}

            </div>

            {/* Action Bar — flex child so scroll area resizes correctly */}
            <div style={{
                flexShrink: 0,
                backgroundColor: '#fff', borderTop: '1px solid var(--border)',
                padding: '16px 20px', marginBottom: 'var(--nav-h)'
            }}>
                <button
                    onClick={() => navigate('documents')}
                    style={{
                        backgroundColor: 'var(--deep-teal)', color: '#fff',
                        fontWeight: 600, padding: '16px', borderRadius: '16px',
                        width: '100%', fontSize: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}
                >
                    📝 Generate Claim Letter
                </button>
            </div>

        </div>
    );
};

export default Guidance;
