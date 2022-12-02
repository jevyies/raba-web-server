const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const webcamButton = document.getElementById("webcamButton");
const callBtn = document.getElementById("callBtn");
const webcamVideo = document.getElementById("video1");
const servers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

const pc = new RTCPeerConnection(servers);

let localStream = null;
let remoteStream = null;
openFunction = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: false,
  });
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });
  webcamVideo.srcObject = localStream;
}

socket.emit("join-room", ROOM_ID);
socket.on("someone-connected", async (room) => {
  console.log("someone connected");
});

// calling
callBtn.onclick = async () => {
  if(remoteStream == null) {
    addRemoteVideoStream();
  }
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("add-candidate", event.candidate.toJSON());
    }
  };

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };
  socket.emit("call_initiate", offer);

  socket.on("candidate-added", (candidate) => {
    const candidateObj = new RTCIceCandidate(candidate);
    pc.addIceCandidate(candidateObj);
  });
  
  socket.on("answer_call", (answer) => {
    const answerDescription = new RTCSessionDescription(answer);
    pc.setRemoteDescription(answerDescription);
  });
};


// someone calling
socket.on("someone_called", async (offer) => {
  var x = document.createElement("BUTTON");
  var t = document.createTextNode("Answer");
  x.appendChild(t);
  document.body.appendChild(x);

  x.onclick = async () => {
    if(remoteStream == null) {
      addRemoteVideoStream();
    }
    pc.onicecandidate = (event) => {
      event.candidate && socket.emit("add-candidate", event.candidate.toJSON());
    };

    const offerDescription = offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

    const answerDescription = await pc.createAnswer();
    await pc.setLocalDescription(answerDescription);

    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
    socket.emit("answer-call", answer);

    socket.on("candidate-added", (candidate) => {
      const candidateObj = new RTCIceCandidate(candidate);
      pc.addIceCandidate(candidateObj);
    });
  };
});
function addRemoteVideoStream() {
  let remoteVideo = document.createElement("video");
  document.getElementById('video-players').appendChild(remoteVideo);
  let remoteStream = new MediaStream();
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };
  pc.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };
  remoteVideo.srcObject = remoteStream;
  remoteVideo.addEventListener('loadedmetadata', () => {
    remoteVideo.play()
  })
}