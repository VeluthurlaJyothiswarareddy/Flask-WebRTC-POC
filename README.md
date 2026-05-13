# Flask WebRTC POC

A minimal proof-of-concept showing Python WebRTC signaling with Flask and a browser UI.

## What this does
- Serves a web page with local and remote video previews
- Uses Flask + Flask-SocketIO for signaling
- Uses WebRTC in the browser to establish a peer-to-peer call

## Run locally
1. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate
   pip install pyopenssl cryptography
   pip install -r requirements.txt
   ```
2. Start the Flask app:
   ```bash
   python app.py
   ```
3. Open two browser windows/tabs and visit `https://localhost:5000`.
   - If you access from another laptop on the same network, use `https://<host-ip>:5000`.
   - The browser will warn about the self-signed certificate; accept the exception to continue.
4. Use the same room name in both tabs to connect peers.

## Notes
- This is a basic signaling POC, not a production-ready deployment.
- For a full application, add room management, auth, STUN/TURN servers, and HTTPS.
