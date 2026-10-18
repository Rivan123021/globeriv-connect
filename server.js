/** GlobeRiv Connect demo sync and signaling server. Node 20+, no npm dependencies.
 * Deploy as a persistent Node web service, not GitHub Pages.
 * This is an experimental shared-state demo, NOT production-grade authorization.
 */
'use strict';
const http = require('node:http'), fs = require('node:fs'), crypto = require('node:crypto');
const PORT = process.env.PORT || 3000, ORIGIN = process.env.FRONTEND_ORIGIN || 'https://rivan123021.github.io';
const FILE = process.env.DATA_FILE || './globeriv-server-data.json';
let stored = { version: 0, state: { users: {}, requests: [], friends: [], messages: [], groups: {}, calls: [], deletedUsers: {} }, events: [] };
try { stored = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { }
let writing = Promise.resolve();
function persist() { const snapshot = JSON.stringify(stored); writing = writing.then(() => fs.promises.writeFile(FILE + '.tmp', snapshot).then(() => fs.promises.rename(FILE + '.tmp', FILE))).catch(console.error); return writing }
const headers = { 'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Cache-Control': 'no-store' };
function reply(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', ...headers }); res.end(JSON.stringify(obj)) }
function allowed(req) { return !req.headers.origin || req.headers.origin === ORIGIN }
function body(req) { return new Promise((resolve, reject) => { let s = '', len = 0; req.on('data', b => { len += b.length; if (len > 2_500_000) { reject(Error('Payload too large')); req.destroy() } else s += b }); req.on('end', () => { try { resolve(JSON.parse(s || '{}')) } catch { reject(Error('Invalid JSON')) } }); req.on('error', reject) }) }
const name = n => typeof n === 'string' && /^[a-z0-9_]{3,20}$/.test(n);
const uniqueBy = (items, key) => Array.from(new Map(items.map(x => [key(x), x])).values());
http.createServer(async (req, res) => {
    if (!allowed(req)) return reply(res, 403, { error: 'Origin not allowed' });
    if (req.method === 'OPTIONS') { res.writeHead(204, headers); return res.end() }
    const u = new URL(req.url, 'http://localhost');
    try {
        if (req.method === 'GET' && u.pathname === '/health') return reply(res, 200, { ok: true, version: stored.version });
        if (req.method === 'GET' && u.pathname === '/state') return reply(res, 200, { version: stored.version, state: stored.state });
        if (req.method === 'POST' && u.pathname === '/state') {
            const p = await body(req), s = p.state;
            if (!s || typeof s !== 'object' || !s.users || !Array.isArray(s.messages) || !Array.isArray(s.requests) || !Array.isArray(s.friends) || !s.groups) return reply(res, 400, { error: 'Bad state' });
            // Merge additive data, but allow deletions when the sender held a recent snapshot.
            // This is NOT a secure authorization layer. Do not deploy with real user data.
            if (Number(p.version) === stored.version) { stored.state = s }
            else {
                const d = stored.state;
                d.users = { ...d.users, ...s.users }; d.deletedUsers = { ...d.deletedUsers, ...(s.deletedUsers || {}) };
                d.requests = uniqueBy([...d.requests, ...s.requests], r => r.from + '>' + r.to);
                d.friends = uniqueBy([...d.friends, ...s.friends], x => [...x].sort().join('|'));
                d.messages = uniqueBy([...d.messages, ...s.messages], m => String(m.id || m.at + '|' + m.from + '|' + m.to));
                d.calls = uniqueBy([...(d.calls || []), ...(s.calls || [])], x => String(x.id || x.at + '|' + x.from + '|' + x.to));
                d.groups = { ...d.groups, ...s.groups };
            }
            stored.version++; await persist(); return reply(res, 200, { version: stored.version, state: stored.state });
        }
        if (req.method === 'POST' && u.pathname === '/register') {
            const p = await body(req), n = String(p.username || '').toLowerCase();
            if (!name(n)) return reply(res, 400, { error: 'Invalid username' });
            if (stored.state.users[n] || stored.state.deletedUsers[n]) return reply(res, 409, { error: 'Username taken' });
            // The existing local demo handles passwords locally; no server account security here.
            return reply(res, 200, { available: true });
        }
        if (req.method === 'POST' && u.pathname === '/signal') {
            const p = await body(req); if (!name(p.from) || !name(p.to) || typeof p.type !== 'string' || !p.payload || typeof p.payload !== 'object') return reply(res, 400, { error: 'Bad signal' });
            stored.events.push({ id: crypto.randomUUID(), from: p.from, to: p.to, type: p.type, payload: p.payload, at: Date.now() });
            stored.events = stored.events.filter(e => Date.now() - e.at < 120000).slice(-3000);
            await persist(); return reply(res, 200, { ok: true });
        }
        if (req.method === 'GET' && u.pathname === '/signal') {
            const n = u.searchParams.get('user'); if (!name(n)) return reply(res, 400, { error: 'Invalid user' });
            const events = stored.events.filter(e => e.to === n && (!u.searchParams.get('after') || e.id !== u.searchParams.get('after')));
            return reply(res, 200, { events: events.slice(-100) });
        }
        return reply(res, 404, { error: 'Not found' });
    } catch (e) { console.error(e); reply(res, 500, { error: 'Server error' }) }
}).listen(PORT, '0.0.0.0', () => console.log('GlobeRiv demo backend running on ' + PORT));
