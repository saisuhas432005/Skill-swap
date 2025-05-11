import React, { useEffect, useRef } from "react";
import { useCall } from "../call/CallContext";

const CallVideo: React.FC = () => {
  const { remoteUsers } = useCall();
  const remoteVideoRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    remoteUsers.forEach((userTracks, uid) => {
      if (userTracks.videoTrack) {
        let container = remoteVideoRefs.current.get(uid);
        if (!container) {
          container = document.createElement("div");
          remoteVideoRefs.current.set(uid, container);
        }
        userTracks.videoTrack.play(container);
      }
    });
    return () => {
      remoteUsers.forEach((userTracks, uid) => {
        if (userTracks.videoTrack) {
          userTracks.videoTrack.stop();
        }
      });
      remoteVideoRefs.current.clear();
    };
  }, [remoteUsers]);

  return (
    <div className="call-video-container">
      <div>
        
        {[...remoteUsers.entries()].map(([uid, userTracks]) => (
          <div
            key={uid}
            style={{
              width: "320px",
              height: "240px",
              backgroundColor: "#000",
              marginTop: "10px",
            }}
          >
            <div
              ref={(el) => {
                if (el) {
                  userTracks.videoTrack?.play(el);
                  remoteVideoRefs.current.set(uid, el);
                }
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default CallVideo;
