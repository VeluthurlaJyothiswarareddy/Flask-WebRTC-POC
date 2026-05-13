const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const joinButton = document.getElementById('joinButton');
const roomInput = document.getElementById('roomId');
const statusEl = document.getElementById('status');

const socket = io();
let pc;
let localStream;
let roomName;
let isInitiator = false;

const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

joinButton.addEventListener('click', async () => {
  roomName = roomInput.value.trim();
  if (!roomName) {
    alert('Please enter a room ID.');
    return;
  }

  joinButton.disabled = true;
  statusEl.textContent = 'Getting camera...';
  await startLocalMedia();
  socket.emit('join', { room: roomName });
});

socket.on('joined', (data) => {
  statusEl.textContent = `Joined room ${data.room} (${data.participantCount} participant(s))`;
});

socket.on('ready', async (data) => {
  isInitiator = socket.id === data.initiator;
  statusEl.textContent = isInitiator ? 'Starting call as initiator...' : 'Waiting for offer...';
  await prepareConnection();
  if (isInitiator) {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('signal', {
      room: roomName,
      type: 'offer',
      description: offer
    });
  }
});

socket.on('signal', async (data) => {
  if (!data || data.room !== roomName) {
    return;
  }

  if (data.type === 'offer') {
    statusEl.textContent = 'Received offer. Creating answer...';
    await prepareConnection();
    await pc.setRemoteDescription(new RTCSessionDescription(data.description));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socket.emit('signal', {
      room: roomName,
      type: 'answer',
      description: answer
    });
  } else if (data.type === 'answer') {
    statusEl.textContent = 'Call established!';
    await pc.setRemoteDescription(new RTCSessionDescription(data.description));
  } else if (data.type === 'candidate') {
    try {
      await pc.addIceCandidate(data.candidate);
    } catch (err) {
      console.warn('Failed to add ICE candidate', err);
    }
  }
});

socket.on('peer-left', () => {
  statusEl.textContent = 'Peer left the room.';
  if (remoteVideo.srcObject) {
    remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
    remoteVideo.srcObject = null;
  }
  if (pc) {
    pc.close();
    pc = null;
  }
});

async function startLocalMedia() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
}

async function prepareConnection() {
  if (pc) {
    return;
  }

  pc = new RTCPeerConnection(configuration);

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  pc.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('signal', {
        room: roomName,
        type: 'candidate',
        candidate: event.candidate
      });
    }
  };

  pc.onconnectionstatechange = () => {
    statusEl.textContent = `Connection state: ${pc.connectionState}`;
  };
}
