const axios = require('axios');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
    console.log('Node E2E test starting');
    const backendUrl = 'http://localhost:5001/api/documents/generate';

    const payloads = {
        sbi: { type: 'sbi', userName: 'Ramesh Kumar', relationship: 'son', deceasedName: 'Sushila Devi', accountNumber: '1234567890', IFSC: 'SBIN0000123', branchName: 'Andheri Branch' },
        lic: { type: 'lic', userName: 'Ramesh Kumar', relationship: 'son', deceasedName: 'Sushila Devi', policyNumber: 'LIC123456' },
        epf: { type: 'epf', userName: 'Ramesh Kumar', relationship: 'son', deceasedName: 'Sushila Devi', UAN: '100200300' },
        transmission: { type: 'transmission', userName: 'Ramesh Kumar', relationship: 'son', deceasedName: 'Sushila Devi', dematAccountNo: 'DEMAT12345' },
        account_closure: { type: 'account_closure', userName: 'Ramesh Kumar', relationship: 'son', deceasedName: 'Sushila Devi', accountNumber: '1234567890', IFSC: 'SBIN0000123', bankName: 'Andheri Branch' }
    };

    for (const [key, payload] of Object.entries(payloads)) {
        console.log('Requesting document:', key);
        try {
            const res = await axios.post(backendUrl, payload, { responseType: 'arraybuffer', headers: { 'Content-Type': 'application/json' } });
            const buf = Buffer.from(res.data);
            const filename = `/tmp/ui_sahara_${key}.docx`;
            fs.writeFileSync(filename, buf);
            console.log('Saved', filename, buf.length, 'bytes');

            // Verify XML contains an expected field depending on type
            let expected = '';
            if (key === 'sbi' || key === 'account_closure') expected = payload.accountNumber || '1234567890';
            if (key === 'lic') expected = payload.policyNumber || 'LIC123456';
            if (key === 'epf') expected = payload.UAN || '100200300';
            if (key === 'transmission') expected = payload.dematAccountNo || 'DEMAT12345';

            const xml = execSync(`unzip -p ${filename} word/document.xml`).toString('utf8');
            if (xml.includes(expected) || (key === 'sbi' && xml.includes(payload.deceasedName))) {
                console.log('Verification passed for', key, '->', expected);
            } else {
                console.error('Verification failed for', key, 'expected:', expected);
                console.error('Snippet:', xml.substr(0, 200));
                process.exit(6);
            }
        } catch (e) {
            console.error('Failed to generate/verify', key, e.message || e);
            process.exit(7);
        }
    }

    console.log('All documents generated and verified. Summary:');
    Object.keys(payloads).forEach(k => {
        const f = `/tmp/ui_sahara_${k}.docx`;
        try {
            const s = fs.statSync(f);
            console.log(' -', f, s.size, 'bytes');
        } catch (e) {
            console.log(' -', f, 'missing');
        }
    });

    console.log('Node E2E test completed successfully.');
    process.exit(0);
})();
