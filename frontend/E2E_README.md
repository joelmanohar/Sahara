End-to-end UI test (headless)

This repo contains a Puppeteer-based E2E script that exercises the Documents flow and verifies generated .docx outputs.

How to run locally

1. Start the backend server (from project root):

```bash
cd backend
npm run start
```

2. Start the frontend dev server (in a separate terminal):

```bash
cd frontend
npm start
```

3. Run the E2E test (requires Chrome/Chromium; Puppeteer will manage a headless Chromium):

```bash
cd frontend
npm run e2e
```

What it does

- The script `frontend/scripts/e2e_ui_test.js` will open a headless browser, set a mock session in localStorage, and POST sample payloads to the backend `/api/documents/generate` endpoint for multiple document types.
- Each returned .docx is saved to `/tmp/ui_sahara_{type}.docx` and inspected to ensure expected fields were interpolated into the document XML.

Notes

- The test calls the backend directly (absolute URL http://localhost:5001) to avoid flakiness in the dev UI environment. If you want a pure UI-driven test (clicking modal Download), we can add a small test-mode hook and adapt the script.
- Files are written to `/tmp` for easy manual inspection. Remove them after verification if desired.
