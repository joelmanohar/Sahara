const puppeteer = require('puppeteer');
const fs = require('fs');
const { execSync } = require('child_process');

(async () => {
    const appUrl = 'http://localhost:3000';
    console.log('Launching browser...');
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultTimeout(30000);

    // Intercept response to capture the generated .docx
    let saved = false;
    page.on('response', async (response) => {
        try {
            const url = response.url();
            if (url.includes('/api/documents/generate') && response.request().method() === 'POST') {
                console.log('Captured document generation response from', url);
                const buffer = await response.buffer();
                fs.writeFileSync('/tmp/ui_sahara_test.docx', buffer);
                console.log('Saved /tmp/ui_sahara_test.docx (', buffer.length, 'bytes)');
                saved = true;
            }
        } catch (e) {
            console.error('Failed to capture response', e);
        }
    });

    console.log('Setting localStorage for a mock session');
    await page.goto('about:blank');
    await page.evaluate(() => {
        localStorage.setItem('token', 'test-token');
        localStorage.setItem('userId', 'test-user');
        localStorage.setItem('userName', 'Ramesh Kumar');
    });

    console.log('Opening app:', appUrl);
    await page.goto(appUrl, { waitUntil: 'networkidle2' });

    // Click Documents tab in bottom nav
    console.log('Navigating to Documents tab');
    const docsTab = await page.$x("//span[text()='Documents']/ancestor::button[1]");
    if (!docsTab || docsTab.length === 0) {
        console.error('Could not find Documents tab');
        await browser.close();
        process.exit(2);
    }
    await docsTab[0].click();

    // Wait for Documents header
    await page.waitForXPath("//h1[text()='Documents']", { timeout: 10000 });
    console.log('On Documents screen');

    // Click the Account Closure Request Download button (find card by name)
    const downloadBtnXpath = "//div[.//div[text()='Account Closure Request']]//button[last()]";
    const [downloadBtn] = await page.$x(downloadBtnXpath);
    if (!downloadBtn) {
        console.error('Could not find download button for Account Closure Request');
        await browser.close();
        process.exit(3);
    }
    await downloadBtn.click();
    console.log('Opened modal for Account Closure');

    // Fill modal inputs: deceasedName, accountNumber, IFSC, bankName
    await page.waitForSelector('div[style*="position: fixed"] input', { timeout: 5000 });
    console.log('Filling modal inputs');
    await page.evaluate(() => {
        const modal = document.querySelector('div[style*="position: fixed"]');
        if (!modal) return;
        const inputs = modal.querySelectorAll('input');
        if (inputs.length >= 1) {
            inputs[0].focus();
            inputs[0].value = 'Sushila Devi';
            inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (inputs.length >= 2) {
            inputs[1].value = '1234567890';
            inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (inputs.length >= 3) {
            inputs[2].value = 'SBIN0000123';
            inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (inputs.length >= 4) {
            inputs[3].value = 'Andheri Branch';
            inputs[3].dispatchEvent(new Event('input', { bubbles: true }));
        }
    });

    // Click Preview then Download
    const [previewBtn] = await page.$x("//button[.//text()[contains(., 'Preview')]]");
    if (previewBtn) {
        await previewBtn.click();
        await page.waitForTimeout(500);
    }

    const [downloadModalBtn] = await page.$x("//div[div[h3 or h4]]//button[text()='Download'] | //button[text()='Download']");
    if (!downloadModalBtn) {
        console.error('Could not find Download button in modal');
        await browser.close();
        process.exit(4);
    }

    console.log('Clicking Download in modal (this triggers API call)');
    await downloadModalBtn.click();

    // Wait for the response to be saved
    for (let i = 0; i < 20; i++) {
        if (saved && fs.existsSync('/tmp/ui_sahara_test.docx')) break;
        await new Promise(r => setTimeout(r, 300));
    }

    if (!fs.existsSync('/tmp/ui_sahara_test.docx')) {
        console.error('Document file not saved by the test');
        await browser.close();
        process.exit(5);
    }

    console.log('Verifying contents of the generated document');
    try {
        const xml = execSync('unzip -p /tmp/ui_sahara_test.docx word/document.xml').toString('utf8');
        if (xml.includes('Sushila Devi') && xml.includes('1234567890') && xml.includes('SBIN0000123')) {
            console.log('Verification passed: interpolated values found in document.xml');
            console.log('---- snippet ----');
            const start = xml.indexOf('Sushila Devi') - 60;
            console.log(xml.substr(Math.max(0, start), 200));
        } else {
            console.error('Verification failed: expected values not found in document.xml');
            process.exit(6);
        }
    } catch (e) {
        console.error('Failed to read document xml', e);
        process.exit(7);
    }

    await browser.close();
    console.log('E2E UI test completed successfully. File: /tmp/ui_sahara_test.docx');
    process.exit(0);
})();
