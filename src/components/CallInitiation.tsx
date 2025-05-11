import React, { useState } from "react";
import { useCall } from "../call/CallContext";
import { Button } from "./ui/button";

type CallInitiationProps = {
  calleeId: string;
  calleeName: string;
};

const CallInitiation: React.FC<CallInitiationProps> = ({ calleeId, calleeName }) => {
  const { joinCall } = useCall();
  const [isCalling, setIsCalling] = useState(false);

  const handleCall = async () => {
    setIsCalling(true);
    try {
      // Generate a unique channel name for the call, e.g., based on user IDs and timestamp
      const channel = `call_${Date.now()}_${calleeId}`;
      // TODO: Obtain token from backend if needed
      await joinCall(channel, null);
      // TODO: Signal the callee about the incoming call with channel info
      alert(`Calling ${calleeName}...`);
    } catch (error) {
      console.error("Error initiating call:", error);
      alert("Failed to start call.");
    } finally {
      setIsCalling(false);
    }
  };

  return (
    <Button onClick={handleCall} disabled={isCalling}>
      {isCalling ? "Calling..." : `Call ${calleeName}`}
    </Button>
  );
};

export default CallInitiation;
