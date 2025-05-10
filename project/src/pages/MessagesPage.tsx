import * as React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EnhancedUserChat from "../components/EnhancedUserChat";

import { useCall } from "../call/CallContext";
import IncomingCallPopup from "../components/IncomingCallPopup";
import CallVideo from "../components/CallVideo";

const MessagesPage = () => {
  const { incomingCall } = useCall();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Messages</h1>
        <EnhancedUserChat />
        {incomingCall && (
          <IncomingCallPopup callerName={incomingCall.from} />
        )}
        <CallVideo />
      </main>
      <Footer />
    </div>
  );
};

export default MessagesPage;
