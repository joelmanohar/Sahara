import React, { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { ArrowLeft } from 'lucide-react';
import DocCard from '../components/DocCard';
import { generateDoc } from '../services/docgen';
import { generateDocument, updateTask } from '../services/api';

const Documents = () => {
    const { navigate, userName, relationship, state: userState, tasks, setTasks, userId, docFields, setDocFields } = useContext(AppContext);

    const [modalOpen, setModalOpen] = useState(false);
    const [selectedType, setSelectedType] = useState(null);
    const [fields, setFields] = useState({});
    const [showPreview, setShowPreview] = useState(false);
    const [errors, setErrors] = useState({});

    const openModal = (type) => {
        setSelectedType(type);
        // Prefill from context if available
        setFields({ ...(docFields[type] || {}), deceasedName: (docFields[type] && docFields[type].deceasedName) || '' });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedType(null);
    };

    const handleSubmit = async () => {
        // Basic validation
        const errs = {};
        if (!fields.deceasedName || fields.deceasedName.trim().length < 2) errs.deceasedName = 'Required';
        if ((selectedType === 'transmission') && (!fields.dematAccountNo || fields.dematAccountNo.trim().length < 6)) errs.dematAccountNo = 'Enter valid demat account number';
        if ((selectedType === 'lic') && (!fields.policyNumber || fields.policyNumber.trim().length < 4)) errs.policyNumber = 'Required';
        if ((selectedType === 'epf') && (!fields.UAN || fields.UAN.trim().length < 6)) errs.UAN = 'Required';
        if ((selectedType === 'account_closure' || selectedType === 'sbi') && (!fields.accountNumber || fields.accountNumber.trim().length < 6)) errs.accountNumber = 'Required';
        setErrors(errs);
        if (Object.keys(errs).length > 0) return;

        const payload = { userName, relationship, state: userState || 'Maharashtra', ...fields };

        // save to session context for reuse
        setDocFields(prev => ({ ...prev, [selectedType]: fields }));

        try {
            const resp = await generateDocument(selectedType, payload);
            const url = window.URL.createObjectURL(new Blob([resp.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedType.toUpperCase()}_Sahara.docx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            try {
                await generateDoc(selectedType, payload);
            } catch (e) {
                console.error('Document generation failed', e);
            }
        }

        // update task status if exists
        try {
            if (!userId) return;
            const map = {
                sbi: 'SBI',
                lic: 'LIC',
                epf: 'EPF',
                account_closure: 'Account',
                transmission: 'Demat'
            };
            const needle = map[selectedType] || '';
            const idx = tasks.findIndex(t => (t.name && t.name.includes(needle)) || (t.category && t.category === selectedType));
            if (idx >= 0) {
                const res = await updateTask(userId, idx, 'done');
                if (res && res.data) setTasks(res.data);
            }
        } catch (err) {
            console.error('Failed to update task status', err);
        }

        closeModal();
    };

    const renderPreview = (type, data) => {
        // Lightweight HTML preview renderer that mirrors template text
        const { userName, relationship, deceasedName, accountNumber, dematAccountNo, policyNumber, UAN, IFSC, bankName } = data;
        if (type === 'transmission') {
            return (
                <div>
                    <div><strong>Demat Transmission Request</strong></div>
                    <div style={{ marginTop: 8 }}>To, The Depository Participant / Broker</div>
                    <div style={{ marginTop: 8 }}>Date: {new Date().toLocaleDateString('en-IN')}</div>
                    <div style={{ marginTop: 8 }}>Subject: Transmission of securities on account of death of the holder</div>
                    <div style={{ marginTop: 8 }}>I, {userName}, am the {relationship} of the deceased {deceasedName || '[Deceased Name]'}, holding Demat Account No: {dematAccountNo || '[Demat Account No]'}.</div>
                </div>
            );
        }
        if (type === 'lic') {
            return (
                <div>
                    <div><strong>LIC Policy Death Claim</strong></div>
                    <div style={{ marginTop: 8 }}>Policy Number: {policyNumber || '[Policy Number]'}</div>
                    <div style={{ marginTop: 8 }}>I, {userName}, am the {relationship} of the policyholder late {deceasedName || '[Deceased Name]'}. Please process the claim.</div>
                </div>
            );
        }
        if (type === 'epf') {
            return (
                <div>
                    <div><strong>EPF Form 10D Cover Letter</strong></div>
                    <div style={{ marginTop: 8 }}>UAN: {UAN || '[UAN]'}</div>
                    <div style={{ marginTop: 8 }}>I, {userName}, am submitting this as the {relationship} of late {deceasedName || '[Deceased Name]'}. Please find enclosed Form 10D.</div>
                </div>
            );
        }
        if (type === 'account_closure' || type === 'sbi') {
            return (
                <div>
                    <div><strong>Account Closure Request</strong></div>
                    <div style={{ marginTop: 8 }}>Account Number: {accountNumber || '[Account Number]'}</div>
                    <div style={{ marginTop: 8 }}>IFSC: {IFSC || '[IFSC]'}</div>
                    <div style={{ marginTop: 8 }}>Bank: {bankName || '[Bank Name]'}</div>
                    <div style={{ marginTop: 8 }}>I, {userName}, hereby request the closure of account number {accountNumber || '[Account Number]'} held in the name of the late {deceasedName || '[Deceased Name]'}. I am the {relationship} and enclose required documents.</div>
                </div>
            );
        }
        return <div>Preview not available for this document type.</div>;
    };

    return (
        <div style={{
            flex: 1, backgroundColor: 'var(--warm-white)',
            display: 'flex', flexDirection: 'column',
            paddingTop: 'var(--sat)', overflow: 'hidden',
            animation: 'slideUp 0.3s cubic-bezier(0.22, 1, 0.36, 1)'
        }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center' }}>
                <button
                    onClick={() => navigate('dashboard')}
                    style={{
                        width: '40px', height: '40px',
                        backgroundColor: 'var(--cream)', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1px solid var(--border)'
                    }}
                >
                    <ArrowLeft size={20} color="var(--deep-teal)" />
                </button>
            </div>

            <div className="scroll-container" style={{ flex: 1, padding: '0 20px 100px' }}>

                <h1 style={{ fontSize: '36px', color: 'var(--deep-teal)', marginBottom: '8px' }}>
                    Documents
                </h1>
                <p style={{ color: 'var(--text-light)', fontSize: '15px', marginBottom: '32px' }}>
                    Ready-to-print letters & forms
                </p>

                <DocCard
                    icon="�"
                    name="Transmission Request Letter"
                    meta="Demat / securities transmission"
                    onDownload={() => openModal('transmission')}
                />

                <DocCard
                    icon="🛡"
                    name="LIC Insurance Claim"
                    meta="Death claim · Policy number required"
                    onDownload={() => openModal('lic')}
                />

                <DocCard
                    icon="📊"
                    name="EPF Form 10D / 20"
                    meta="Pension / PF withdrawal · Family member"
                    onDownload={() => openModal('epf')}
                />

                <DocCard
                    icon="📄"
                    name="Account Closure Request"
                    meta="Bank account closure / nomination checks"
                    onDownload={() => openModal('account_closure')}
                />

                <DocCard
                    icon="�"
                    name="Transmission Request Letter"
                    meta="Demat / securities transmission"
                    onDownload={() => openModal('transmission')}
                />

                {modalOpen && (
                    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
                        <div style={{ width: '560px', background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: 'var(--shadow-lg)' }}>
                            <h3 style={{ marginTop: 0 }}>{selectedType === 'lic' ? 'LIC Claim Details' : selectedType === 'epf' ? 'EPF Details' : selectedType === 'transmission' ? 'Demat Transmission Details' : 'Account Closure Details'}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <label style={{ fontSize: 13 }}>Deceased / Account Holder Name</label>
                                <input value={fields.deceasedName || ''} onChange={e => setFields(f => ({ ...f, deceasedName: e.target.value }))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                {errors.deceasedName && <div style={{ color: 'crimson', fontSize: 12 }}>{errors.deceasedName}</div>}

                                {(selectedType === 'transmission') && (
                                    <>
                                        <label style={{ fontSize: 13 }}>Demat Account Number</label>
                                        <input value={fields.dematAccountNo || ''} onChange={e => setFields(f => ({ ...f, dematAccountNo: e.target.value }))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                        {errors.dematAccountNo && <div style={{ color: 'crimson', fontSize: 12 }}>{errors.dematAccountNo}</div>}
                                    </>
                                )}

                                {(selectedType === 'lic') && (
                                    <>
                                        <label style={{ fontSize: 13 }}>Policy Number</label>
                                        <input value={fields.policyNumber || ''} onChange={e => setFields(f => ({ ...f, policyNumber: e.target.value }))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                        {errors.policyNumber && <div style={{ color: 'crimson', fontSize: 12 }}>{errors.policyNumber}</div>}
                                    </>
                                )}

                                {(selectedType === 'epf') && (
                                    <>
                                        <label style={{ fontSize: 13 }}>UAN Number</label>
                                        <input value={fields.UAN || ''} onChange={e => setFields(f => ({ ...f, UAN: e.target.value }))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                        {errors.UAN && <div style={{ color: 'crimson', fontSize: 12 }}>{errors.UAN}</div>}
                                    </>
                                )}

                                {(selectedType === 'account_closure' || selectedType === 'sbi') && (
                                    <>
                                        <label style={{ fontSize: 13 }}>Account Number</label>
                                        <input value={fields.accountNumber || ''} onChange={e => setFields(f => ({ ...f, accountNumber: e.target.value }))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                        {errors.accountNumber && <div style={{ color: 'crimson', fontSize: 12 }}>{errors.accountNumber}</div>}

                                        <label style={{ fontSize: 13 }}>IFSC (optional)</label>
                                        <input value={fields.IFSC || ''} onChange={e => setFields(f => ({ ...f, IFSC: e.target.value }))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }} />

                                        <label style={{ fontSize: 13 }}>Bank / Branch Name (optional)</label>
                                        <input value={fields.bankName || ''} onChange={e => setFields(f => ({ ...f, bankName: e.target.value }))} style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }} />
                                    </>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '12px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={closeModal} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent' }}>Cancel</button>
                                        <button onClick={() => setShowPreview(p => !p)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border)', background: 'white' }}>{showPreview ? 'Hide Preview' : 'Preview'}</button>
                                    </div>
                                    <div>
                                        <button onClick={handleSubmit} style={{ padding: '10px 14px', borderRadius: '10px', background: 'var(--deep-teal)', color: '#fff' }}>Download</button>
                                    </div>
                                </div>

                                {showPreview && (
                                    <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                                        <h4 style={{ margin: '6px 0' }}>Preview</h4>
                                        <div style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6 }}>
                                            {renderPreview(selectedType, { userName, relationship, state: userState || 'Maharashtra', ...fields })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* CTA */}
                <div style={{
                    backgroundColor: 'var(--cream)',
                    borderRadius: '20px',
                    padding: '24px',
                    marginTop: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-dark)', marginBottom: '6px' }}>
                        Need another document?
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-light)', marginBottom: '20px' }}>
                        Tell the assistant what you need
                    </p>
                    <button
                        onClick={() => navigate('chat')}
                        style={{
                            backgroundColor: 'var(--deep-teal)',
                            color: '#fff',
                            fontWeight: 600,
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontSize: '15px'
                        }}
                    >
                        Ask Assistant
                    </button>
                </div>

            </div>
        </div>
    );
};

export default Documents;
