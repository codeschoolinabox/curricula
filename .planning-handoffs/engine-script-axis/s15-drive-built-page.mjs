/**
 * SPIKE S15 — drive the PRODUCTION build in a real browser, cross-origin
 * isolated, and read the rendered measurement table.
 *
 * Lives in the scratchpad, never in the repo tree. Serves build/ with COOP/COEP
 * (which `docusaurus serve` does not), then opens /spiralearn/script-axis-spike
 * with playwright chromium and prints what the page rendered.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } =
	await import('file:///Users/master/Documents/0-teach-code/0-spiralearn/0-curriculum-committee/0-curricula/node_modules/playwright/index.mjs');

const ROOT = process.argv[2];
const PORT = 8137;
const TYPES = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.mjs': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.svg': 'image/svg+xml',
	'.png': 'image/png',
	'.ico': 'image/x-icon',
	'.woff2': 'font/woff2',
};

const server = http.createServer(function serve(request, response) {
	const urlPath = decodeURIComponent(request.url.split('?')[0]);
	let filePath = path.join(ROOT, urlPath.replace(/^\/spiralearn/, ''));
	if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
		filePath = path.join(filePath, 'index.html');
	}
	const headers = {
		'Cross-Origin-Opener-Policy': 'same-origin',
		'Cross-Origin-Embedder-Policy': 'require-corp',
		'Cross-Origin-Resource-Policy': 'same-origin',
	};
	if (!fs.existsSync(filePath)) {
		response.writeHead(404, headers);
		response.end('not found: ' + filePath);
		return;
	}
	headers['Content-Type'] = TYPES[path.extname(filePath)] ?? 'text/plain';
	response.writeHead(200, headers);
	fs.createReadStream(filePath).pipe(response);
});

await new Promise(function listen(resolve) {
	server.listen(PORT, resolve);
});
console.log('serving ' + ROOT + ' on http://localhost:' + PORT);

const browser = await chromium.launch({
	args: ['--enable-features=SharedArrayBuffer'],
});
const page = await browser.newPage();
page.on('console', function onConsole(message) {
	console.log('  [page console] ' + message.type() + ': ' + message.text());
});
page.on('pageerror', function onPageError(error) {
	console.log('  [page error] ' + String(error));
});

await page.goto('http://localhost:' + PORT + '/spiralearn/script-axis-spike', {
	waitUntil: 'networkidle',
});
await page.waitForTimeout(4000);

const isolated = await page.evaluate(function readIsolated() {
	return String(globalThis.crossOriginIsolated);
});
const rendered = await page.evaluate(function readPre() {
	const pre = document.querySelector('pre');
	return pre ? pre.textContent : '(no <pre> found)';
});

console.log('');
console.log('SPIKE S15 crossOriginIsolated: ' + isolated);
console.log('SPIKE S15 rendered:');
console.log(rendered);

await browser.close();
server.close();
process.exit(0);
