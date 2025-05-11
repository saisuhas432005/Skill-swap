
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mic, MicOff, Video, VideoOff, Monitor, PhoneOff } from "lucide-react";

type VideoCallInterfaceProps = {
  isVideoCall: boolean;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isVideoEnabled: boolean;
  setIsVideoEnabled: (enabled: boolean) => void;
  isScreenSharing: boolean;
  toggleScreenSharing: () => void;
  endCall: () => void;
  peerName: string;
  peerAvatar: string;
};

const VideoCallInterface = ({
  isVideoCall,
  isMuted,
  setIsMuted,
  isVideoEnabled,
  setIsVideoEnabled,
  isScreenSharing,
  toggleScreenSharing,
  endCall,
  peerName,
  peerAvatar
}: VideoCallInterfaceProps) => {
  // For the demo, we'll just show placeholder video areas
  const [callDuration, setCallDuration] = useState(0);
  
  // Update call duration every second
  useState(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  });
  
  // Format seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full h-[600px] flex flex-col">
      <CardContent className="flex-1 p-0 flex flex-col">
        {/* Video Container */}
        <div className="flex-1 bg-black relative flex items-center justify-center">
          {isVideoCall ? (
            <>
              {/* This would be replaced with actual video streams */}
              <div className="text-white text-center">
                <p className="text-xl mb-4">Video Call with {peerName}</p>
                <p className="text-sm opacity-70">Duration: {formatDuration(callDuration)}</p>
                {!isVideoEnabled && (
                  <div className="mt-6">
                    <Avatar className="h-24 w-24 mx-auto">
                      <AvatarImage src={peerAvatar} />
                      <AvatarFallback>{peerName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <p className="mt-2">Camera is turned off</p>
                  </div>
                )}
              </div>
              
              {/* Self Video */}
              <div 
                className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden border-2 border-white flex items-center justify-center"
              >
                {isVideoEnabled ? (
                  <div className="text-xs text-white">Your camera</div>
                ) : (
                  <Avatar>
                    <AvatarFallback>YOU</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </>
          ) : (
            <div className="text-white text-center">
              <Avatar className="h-24 w-24 mx-auto mb-4">
                <AvatarImage src={peerAvatar} />
                <AvatarFallback>{peerName.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <p className="text-xl mb-2">{peerName}</p>
              <p className="text-sm opacity-70">Audio call • {formatDuration(callDuration)}</p>
            </div>
          )}
          
          {isScreenSharing && (
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <Monitor className="h-4 w-4 mr-2" />
              Sharing your screen
            </div>
          )}
        </div>
        
        {/* Call Controls */}
        <div className="bg-background p-4 flex justify-center space-x-4">
          <Button 
            variant={isMuted ? "destructive" : "outline"}
            size="icon"
            onClick={() => setIsMuted(!isMuted)}
            className="rounded-full h-12 w-12"
          >
            {isMuted ? <MicOff /> : <Mic />}
          </Button>
          
          {isVideoCall && (
            <Button 
              variant={isVideoEnabled ? "outline" : "destructive"}
              size="icon"
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
              className="rounded-full h-12 w-12"
            >
              {isVideoEnabled ? <Video /> : <VideoOff />}
            </Button>
          )}
          
          {isVideoCall && (
            <Button 
              variant={isScreenSharing ? "secondary" : "outline"}
              size="icon"
              onClick={toggleScreenSharing}
              className="rounded-full h-12 w-12"
            >
              <Monitor />
            </Button>
          )}
          
          <Button 
            variant="destructive"
            size="icon"
            onClick={endCall}
            className="rounded-full h-12 w-12"
          >
            <PhoneOff />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCallInterface;
