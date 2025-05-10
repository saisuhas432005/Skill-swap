
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { DreamSwapDashboardContent } from "@/components/DreamSwapComponents";
import VideoRecommendationManager from "@/components/VideoRecommendationManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DreamSwapDashboard = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto">
          <Tabs defaultValue="dashboard">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="videos">Video Manager</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>DreamSwap Dashboard</CardTitle>
                    <CardDescription>Manage your skill swap sessions and matches</CardDescription>
                  </CardHeader>
                </Card>
              </div>
              <DreamSwapDashboardContent />
            </TabsContent>
            
            <TabsContent value="videos">
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Video Recommendation Manager</CardTitle>
                    <CardDescription>Add helpful videos for skills in our community</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Help our community by adding video recommendations for skills. These videos will be shown 
                      to users who are looking to learn or improve specific skills.
                    </p>
                  </CardContent>
                </Card>
              </div>
              <VideoRecommendationManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DreamSwapDashboard;
