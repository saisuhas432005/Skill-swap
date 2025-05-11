import React from "react";
import { useCall } from "../call/CallContext";
import { Button } from "./ui/button";

type IncomingCallPopupProps = {
  callerName: string;
};

const IncomingCallPopup: React.FC<IncomingCallPopupProps> = ({ callerName }) => {
  const { acceptCall, rejectCall } = useCall();

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded p-4 z-50 w-72">
      <p className="mb-4 font-semibold">{callerName} is calling you</p>
      <div className="flex justify-between">
        <Button variant="default" onClick={acceptCall}>Accept</Button>
        <Button variant="destructive" onClick={rejectCall}>Reject</Button>
      </div>
    </div>
  );
};

export default IncomingCallPopup;
