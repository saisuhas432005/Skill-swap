
import { useEffect } from "react";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Features from "@/components/Features";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import VideoFeed from "@/components/VideoFeed";
import LoggedInUsers from "@/components/LoggedInUsers";
import { useAuth } from "@/context/AuthContext";

const Index = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {!user ? (
          <>
            <Hero />
            <HowItWorks />
            <Features />
          </>
        ) : (
          <div className="container mx-auto px-4 pt-24 pb-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <h2 className="text-2xl font-bold mb-6 gradient-text">Talent Showcase</h2>
                <VideoFeed />
              </div>
              <div className="space-y-6">
                <LoggedInUsers />
                <div className="bg-spark/5 rounded-lg p-4">
                  <h3 className="font-medium mb-2">Weekly Challenge</h3>
                  <p className="text-sm mb-4">
                    Upload your talent video for this week and get discovered!
                  </p>
                  <a 
                    href="/upload" 
                    className="inline-block px-4 py-2 bg-spark text-white rounded-md hover:bg-spark-dark transition-colors"
                  >
                    Upload Now
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
