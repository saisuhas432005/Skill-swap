
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoggedInUsers from "./LoggedInUsers";
import UserChat from "./UserChat";

const SocialFeatures = () => {
  const [activeTab, setActiveTab] = useState("follow");

  return (
    <div className="space-y-6">
      <Tabs defaultValue="follow" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="follow">Follow Users</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="discover">Discover</TabsTrigger>
        </TabsList>
        
        <TabsContent value="follow">
          <div className="mb-6">
            <h2 className="font-bold text-2xl mb-2">Connect with Other Users</h2>
            <p className="text-gray-600">
              Find and follow other users to expand your network. When users follow each other, you'll be able to chat!
            </p>
          </div>
          <LoggedInUsers />
        </TabsContent>
        
        <TabsContent value="chat">
          <div className="mb-6">
            <h2 className="font-bold text-2xl mb-2">Chat with Connections</h2>
            <p className="text-gray-600">
              Chat with users who follow you back. Share knowledge, ask questions, or arrange skill swapping sessions.
            </p>
          </div>
          <UserChat />
        </TabsContent>
        
        <TabsContent value="discover">
          <div className="mb-6">
            <h2 className="font-bold text-2xl mb-2">Discover Content</h2>
            <p className="text-gray-600">
              Find videos and learning resources shared by the community.
            </p>
          </div>
          <CommunityVideosSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Community Videos Section
const CommunityVideosSection = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="col-span-full">
        <p className="text-center text-gray-500 py-12">
          Content discovery features coming soon! Check back later for community-shared videos and resources.
        </p>
      </div>
    </div>
  );
};

export default SocialFeatures;
