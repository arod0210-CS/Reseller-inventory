# QA Backlog

This file is the shared task board between the QA Agent and Builder Agent.

## Status Labels

- Open
- Ready for Builder
- In Progress
- Retest Needed
- Passed
- Failed
- Blocked

---

## Issues

### Issue 001: Initial full app QA sweep
Severity: High  
Status: Passed  
Location: Full app  

Steps to reproduce:
1. Install dependencies.
2. Start the app.
3. Test all main screens, buttons, forms, navigation, save/load behavior, and mobile layout.
4. Run build/test/lint commands.

Expected behavior:
The app should install, run, build, and allow the user to complete the main inventory workflow without errors.

Actual behavior:
QA completed the initial install/build/static/runtime sweep. `npm install`, `npm test`, and `npm run build` passed. Local server started successfully on port 5174. QA found follow-up issues 002-006 and marked Issue 002 as the highest-priority Builder-ready bug.

Suggested fix:
Builder Agent should start with Issue 002, then continue through the remaining backlog items by priority.

Retest notes:
Initial QA sweep completed. Continue QA/Builder loop on Issue 002.

---

### Issue 002: Partial sale marks remaining inventory as sold
Severity: High  
Status: Passed  
Location: `inventory.js` → `normalizeItem()` / `recordSale()`  

Steps to reproduce:
1. Create an item with quantity `2` and sale status `available`.
2. Record a sale of quantity `1`.
3. Inspect the updated item and dashboard/finance available inventory metrics.

Expected behavior:
The item should remain available/listed with quantity `1`, while sale history records 1 unit sold.

Actual behavior:
The item becomes `sold`, and the remaining quantity disappears from available inventory/metrics.

Suggested fix:
Builder Agent should update inventory normalization so items with `quantity > 0` and sale history are not forced to `sold`. Add regression tests for partial sale behavior.

Builder Agent Task:
Fix partial sale incorrectly marking remaining inventory as sold.

Details:
- Problem: Selling 1 of 2 units makes the whole item sold.
- File or area likely involved: `inventory.js`, `tests/inventory.test.js` or `tests/finance.test.js`
- Expected result: Partial sale leaves quantity 1 and status available/listed.
- How to test: Create quantity 2 item, record sale quantity 1, verify quantity 1 and status not sold; run `npm test` and `npm run build`.
- Do not stop after this fix. After fixing, run build/test/lint and continue to the next issue.

Retest notes:
Passed QA retest. Manual Node regression confirms selling 1 of 2 units leaves quantity 1, saleStatus `available`, available inventory count 1, and correct finance metrics. `npm test` and `npm run build` passed after retest.

---

### Issue 003: Empty scanner lookup creates invalid draft text
Severity: Medium  
Status: Passed  
Location: `scanner.js` → `generateItemDescription()` / `runScannerLookup()`  

Steps to reproduce:
1. Open AI Scanner.
2. Leave barcode empty and do not upload a photo.
3. Click Scan / Look Up.

Expected behavior:
Scanner should show a clear validation message such as “enter barcode or upload photo” and should not create a draft.

Actual behavior:
Scanner creates a fake `Photo Item` draft and description includes `Barcode objectObject captured...`.

Suggested fix:
Builder Agent should guard empty scanner lookup input and fix `generateItemDescription()` so empty `input.barcode` does not fall back to stringifying the whole input object.

Builder Agent Task:
Fix empty scanner lookup creating invalid draft text.

Details:
- Problem: Empty scanner lookup generates `objectObject` description.
- File or area likely involved: `scanner.js`, `tests/scanner.test.js`, scanner UI toast text.
- Expected result: No draft is generated without barcode/photo; clear validation message appears.
- How to test: Run scanner lookup with `{}` and from UI with empty fields; run `npm test` and `npm run build`.
- Do not stop after this fix. After fixing, run build/test/lint and continue to the next issue.

Retest notes:
Passed QA retest. Manual scanner regression confirms `runScannerLookup({})` returns `draft: null`, `validationError: true`, and a clear validation message. `generateItemDescription({})` returns an empty string with no `objectObject` text. `npm test` and `npm run build` passed after retest.

---

### Issue 004: App startup can fail when localStorage is unavailable
Severity: High  
Status: Retest Needed  
Location: `storage.js` app startup/storage helpers  

Steps to reproduce:
1. Simulate blocked/unavailable `localStorage` by making `getItem`, `setItem`, or `removeItem` throw.
2. Load the app or call `getLanguage()` / `loadItems()`.

Expected behavior:
App should recover with in-memory/demo fallback or show a clear recoverable error state.

Actual behavior:
Storage calls throw and can break startup.

Suggested fix:
Builder Agent should wrap localStorage reads/writes in safe helpers and provide an in-memory fallback for seed/demo data and settings.

Builder Agent Task:
Harden storage against blocked localStorage.

Details:
- Problem: App can crash if localStorage is unavailable/private/blocked.
- File or area likely involved: `storage.js`, `tests/storage.test.js`
- Expected result: App still loads with fallback data or clear recoverable error state.
- How to test: Mock localStorage methods throwing in storage tests; run `npm test` and `npm run build`.
- Do not stop after this fix. After fixing, run build/test/lint and continue to the next issue.

Retest notes:
Builder fix complete. Added safe storage helpers with in-memory fallback for items, language, and scanner endpoint when localStorage access/getItem/setItem/removeItem fails. Added storage regression coverage for throwing localStorage methods. `npm test` and `npm run build` passed.

---

### Issue 005: Scanner backend endpoint guidance is misleading for GitHub Pages
Severity: Medium  
Status: Open  
Location: README and Settings → Scanner Backend  

Steps to reproduce:
1. Use the live GitHub Pages app.
2. Save `/api/scan-product` as the scanner endpoint.
3. Try AI scanner backend lookup.

Expected behavior:
User should understand GitHub Pages cannot run the Node endpoint and needs a deployed serverless/full URL endpoint.

Actual behavior:
README/settings imply `/api/scan-product` works generally, but GitHub Pages is static and cannot execute `api/scan-product.js`.

Suggested fix:
Builder Agent should clarify README and Settings helper text: `/api/scan-product` only works on Vercel/Netlify/serverless-style deploys; GitHub Pages requires a full external endpoint URL.

Builder Agent Task:
Clarify AI backend endpoint deployment requirements.

Details:
- Problem: `/api/scan-product` is misleading for GitHub Pages deployment.
- File or area likely involved: `README.md`, `i18n.js`, Settings scanner hint text.
- Expected result: Users know to deploy backend separately or use full URL on GitHub Pages.
- How to test: Read Settings text and README for clear deployment guidance; run `npm test` and `npm run build`.
- Do not stop after this fix. After fixing, run build/test/lint and continue to the next issue.

Retest notes:
Pending.

---

### Issue 006: Copy Item ID shows success even when copy fails
Severity: Low  
Status: Open  
Location: `app.js` label copy flow / `labels.js`  

Steps to reproduce:
1. Open an item label.
2. Click Copy Item ID in an environment where clipboard write fails or fallback copy returns false.

Expected behavior:
Show success only when copy succeeds; show a failure message when copy fails.

Actual behavior:
App shows copied toast regardless of `labels.copyItemId()` returning `false`.

Suggested fix:
Builder Agent should check the boolean return value and add a failure toast string.

Builder Agent Task:
Fix Copy Item ID success message accuracy.

Details:
- Problem: Copy failure still shows “copied.”
- File or area likely involved: `app.js`, `labels.js`, `i18n.js`
- Expected result: Success toast only when copy succeeds; failure toast otherwise.
- How to test: Mock `copyItemId` false/rejected and verify toast path; run `npm test` and `npm run build`.
- Do not stop after this fix. After fixing, run build/test/lint and continue to the next issue.

Retest notes:
Pending.
