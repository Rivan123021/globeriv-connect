# GlobeRiv Connect — typing / group-call update

Deploy both updated files:
1. In the GitHub Pages repository `globeriv`, replace `index.html` and commit it.
2. In the Render-connected repository, replace `server.js` and commit it. Wait for the Render deployment to show **Live**.
3. Refresh the website on both devices (close old tabs or hard-refresh) to get the updated HTML.
4. Test typing in a one-to-one chat from Chrome to Safari/Firefox. Next, type in a group; the other participants should see the avatar and animated dots.
5. Test group audio/video with three or more disposable accounts on different browsers, then try someone joining later.

## Browser limitations

Phone browsers may block autoplay sound, especially before the user interacts with the page, while the page is backgrounded, or when the device is in silent mode. GlobeRiv Connect tries to prime its ringtone on a normal tap and replays it for incoming calls, but a webpage cannot force silent-mode audio or guarantee background ringing. Reliable alerts when the app is closed need Web Push notifications / an installed app with permissions and a secure push backend.

WebRTC mesh calls require all peers to establish connections; restrictive networks may need TURN. The existing backend is experimental and **insecure**, exposing the test account/message state. Do not use actual passwords, personal messages, or public real users until proper authentication, permission-checked APIs, and secure storage are implemented.
