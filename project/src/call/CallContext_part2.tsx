export const CallProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [client] = useState<any>(
    AgoraRTC ? AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }) : null
  );
  const [localAudioTrack, setLocalAudioTrack] = useState<any | null>(null);
  const [localVideoTrack, setLocalVideoTrack] = useState<any | null>(null);
  const [remoteUsers, setRemoteUsers] = useState(
    new Map<
      number,
      { videoTrack: any | null; audioTrack: any | null }
    >()
  );
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ from: string; channel: string } | null>(
    null
  );
  const [callAccepted, setCallAccepted] = useState(false);
  const [currentChannel, setCurrentChannel] = useState<string | null>(null);

  const joinCall = async (channel: string, token: string | null, uid?: number) => {
    if (!callAccepted) {
      console.warn("Call not accepted yet. Cannot join call.");
      return;
    }
    if (!client) {
      console.error("AgoraRTC client not initialized");
      return;
    }
    try {
      // Explicitly check and request media permissions
      const audioPermission = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });
      const videoPermission = await navigator.permissions.query({
        name: "camera" as PermissionName,
      });

      if (audioPermission.state === "denied" || videoPermission.state === "denied") {
        alert("Please allow microphone and camera permissions to start the call.");
        return;
      }

      if (audioPermission.state !== "granted" || videoPermission.state !== "granted") {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      }
    } catch (err) {
      console.error("Media permissions denied or error:", err);
      alert("Media permissions are required to start the call.");
      return;
    }
    await client.join("YOUR_AGORA_APP_ID", channel, token || null, uid || null);
    const [microphoneTrack, cameraTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
    setLocalAudioTrack(microphoneTrack);
    setLocalVideoTrack(cameraTrack);
    await client.publish([microphoneTrack, cameraTrack]);
    setCurrentChannel(channel);
  };

  // Simulated signaling: initiate a call to a callee
  const initiateCall = (calleeId: string, channel: string) => {
    // In a real app, send signaling message to callee via backend or WebSocket
    console.log(`Initiating call to ${calleeId} on channel ${channel}`);
    // Simulate callee receiving incoming call
    setIncomingCall({ from: calleeId, channel });
  };

  const acceptCallHandler = async () => {
    if (!incomingCall) return;
    console.log("Accepting call from", incomingCall.from);
    setCallAccepted(true);
    await joinCall(incomingCall.channel, null);
    setIncomingCall(null);
  };

  const rejectCallHandler = () => {
    // TODO: Signal rejection to caller via backend or WebSocket
    console.log("Call rejected");
    setIncomingCall(null);
  };

  const leaveCall = async () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    if (client) {
      await client.leave();
    }
    setLocalAudioTrack(null);
    setLocalVideoTrack(null);
    setRemoteUsers(new Map());
    setCallAccepted(false);
    setCurrentChannel(null);
  };

  const toggleAudio = () => {
    if (!localAudioTrack) return;
    if (isAudioMuted) {
      localAudioTrack.setEnabled(true);
      setIsAudioMuted(false);
    } else {
      localAudioTrack.setEnabled(false);
      setIsAudioMuted(true);
    }
  };

  const toggleVideo = () => {
    if (!localVideoTrack) return;
    if (isVideoMuted) {
      localVideoTrack.setEnabled(true);
      setIsVideoMuted(false);
    } else {
      localVideoTrack.setEnabled(false);
      setIsVideoMuted(true);
    }
  };

  // Handle remote users published/unpublished
  useEffect(() => {
    if (!client) return;
    const handleUserPublished = async (user, mediaType) => {
      await client.subscribe(user, mediaType);
      setRemoteUsers((prev) => {
        const newMap = new Map(prev);
        if (mediaType === "video") {
          newMap.set(user.uid, {
            videoTrack: user.videoTrack,
            audioTrack: newMap.get(user.uid)?.audioTrack || null,
          });
        } else if (mediaType === "audio") {
          newMap.set(user.uid, {
            videoTrack: newMap.get(user.uid)?.videoTrack || null,
            audioTrack: user.audioTrack,
          });
          user.audioTrack?.play();
        }
        return newMap;
      });
    };

    const handleUserUnpublished = (user, mediaType) => {
      setRemoteUsers((prev) => {
        const newMap = new Map(prev);
        if (mediaType === "video") {
          const userTracks = newMap.get(user.uid);
          if (userTracks) {
            newMap.set(user.uid, { videoTrack: null, audioTrack: userTracks.audioTrack });
          }
        } else if (mediaType === "audio") {
          const userTracks = newMap.get(user.uid);
          if (userTracks) {
            newMap.set(user.uid, { videoTrack: userTracks.videoTrack, audioTrack: null });
          }
        }
        return newMap;
      });
    };

    client.on("user-published", handleUserPublished);
    client.on("user-unpublished", handleUserUnpublished);

    return () => {
      client.off("user-published", handleUserPublished);
      client.off("user-unpublished", handleUserUnpublished);
    };
  }, [client]);

  return (
    <CallContext.Provider
      value={{
        client,
        localAudioTrack,
        localVideoTrack,
        remoteUsers,
        joinCall,
        leaveCall,
        toggleAudio,
        toggleVideo,
        isAudioMuted,
        isVideoMuted,
        incomingCall,
        acceptCall: acceptCallHandler,
        rejectCall: rejectCallHandler,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};
