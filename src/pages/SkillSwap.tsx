
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SkillSwapComponent from "@/components/SkillSwap";
import SwapSessions from "@/components/SwapSessions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SkillSwap = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto">
          <Tabs defaultValue="swap" className="w-full">
            <TabsList className="mb-8">
              <TabsTrigger value="swap">Find Skill Swaps</TabsTrigger>
              <TabsTrigger value="sessions">My Sessions</TabsTrigger>
            </TabsList>
            <TabsContent value="swap">
              <SkillSwapComponent />
            </TabsContent>
            <TabsContent value="sessions">
              <SwapSessions />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SkillSwap;
