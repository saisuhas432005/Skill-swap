
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoFeed from "@/components/VideoFeed";
import UserProfile from "@/components/UserProfile";
import SocialFeatures from "@/components/SocialFeatures";
import SkillManagement from "@/components/SkillManagement";
import SkillVideoRecommendations from "@/components/SkillVideoRecommendations";
import EnhancedUserChat from "@/components/EnhancedUserChat";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || "feed");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update URL without navigating
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', value);
    window.history.pushState({}, '', newUrl);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto">
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
           
            
            <TabsContent value="feed">
              <VideoFeed />
            </TabsContent>
            
            <TabsContent value="profile">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <UserProfile />
                </div>
                {/* Removed SkillManagement to avoid duplicate skill sections */}
                {/* <div>
                  <SkillManagement />
                </div> */}
              </div>
            </TabsContent>
            
            <TabsContent value="connect">
              <SocialFeatures />
            </TabsContent>
            
            <TabsContent value="messages">
              <EnhancedUserChat />
            </TabsContent>
            
            <TabsContent value="dreamswap">
              <DreamSwapDashboard />
            </TabsContent>
            
            <TabsContent value="videos">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Skill-Based Recommendations</h2>
                <p className="text-muted-foreground">
                  Videos tailored to help you learn new skills and improve existing ones
                </p>
              </div>
              <SkillVideoRecommendations />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

// DreamSwapDashboard component
const DreamSwapDashboard = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>DreamSwap Dashboard</CardTitle>
          <CardDescription>
            Manage your skill swap sessions, matches, and credit balance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center mb-6">
            <Button className="bg-gradient-to-r from-spark-purple to-spark-blue hover:opacity-90 transition-opacity">
              Find My Perfect Match
            </Button>
          </div>
          <p className="text-center text-sm text-gray-500 mb-4">
            Coming soon: Enhanced matching, session scheduling, and skill swapping features!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
