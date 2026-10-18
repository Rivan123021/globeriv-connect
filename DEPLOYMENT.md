# GlobeRiv Connect: cross-browser development setup

This package contains `index.html` (GitHub Pages frontend) and `server.js` (experimental HTTPS backend). Both files must be deployed: GitHub Pages cannot execute server.js. No Node installation is required on your own computer.

## Deployment for testing only

1. Create a GitHub repository containing `index.html` and `server.js`.
2. Create a **Node Web Service** on a hosting platform such as Render, linked to the same repository.
   - Build command: `echo ready`
   - Start command: `node server.js`
   - Node runtime: 20+
   - Environment: `FRONTEND_ORIGIN=https://rivan123021.github.io`
   - Set `DATA_FILE` to a path on **persistent disk** if your host supports one. Without persistent disk, accounts/chats reset when the host restarts or redeploys.
3. Copy the HTTPS URL assigned to the hosted backend (such as `https://your-project.onrender.com`).
4. Open `index.html` and replace `https://REPLACE-WITH-YOUR-SERVER.onrender.com` with that URL. Do not append `/state` or `/signal`.
5. Commit `index.html` to GitHub and enable GitHub Pages (main branch, root directory).
6. Open the published website on two different browsers and try test usernames only. A server health check is `https://your-project.onrender.com/health`.

## Important security / reliability limitations

**Do not launch this as a public app or use real passwords.** The current UI was originally a browser-only prototype and its persistence relies on a shared JSON state. This bridge was added for cross-browser *development tests*, NOT for a secure public release.

- `/state` currently exchanges one shared state snapshot without authenticated access controls. It may expose test-account passwords and messages; anyone who finds your public backend URL may read or modify them.
- `/signal` isn't authenticated; callers aren't verified. Internet WebRTC also needs TURN for restrictive networks.
- Whole-state updates can overwrite concurrent changes. The server attempts to merge some conflicts but this is not transaction-safe or suitable for production.
- Online presence and typing indicators still use local browser storage and aren't yet globally synchronized.
- Profile pictures / voice data stored in localStorage may exceed browser or host limits.
- A public launch requires hashed passwords, server-verified sessions, permission-checked per-user endpoints, database transactions, rate limits, secure media storage, and authenticated real-time presence/signaling.

Use this bundle **only with disposable dummy accounts in a private test deployment**. Do not share its public URL or create real accounts until these safeguards are implemented.
