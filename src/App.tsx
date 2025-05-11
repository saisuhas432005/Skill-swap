import React from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AuthGuard from "./auth/AuthGuard";

// Pages
import Index from "./pages/Index";
import Upload from "./pages/Upload";
import SkillSwap from "./pages/SkillSwap";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import DreamSwapDashboard from "./pages/DreamSwapDashboard";

import VideoFeedPage from "./pages/VideoFeedPage";
import MyProfilePage from "./pages/MyProfilePage";
import ConnectPage from "./pages/ConnectPage";
import MessagesPage from "./pages/MessagesPage";
import RecommendationsPage from "./pages/RecommendationsPage";

const queryClient = new QueryClient();

import { CallProvider } from "./call/CallContext";

const App = () => {
  console.log("App component rendering");
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <CallProvider>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route
                  path="/upload"
                  element={
                    <AuthGuard>
                      <Upload />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/skillswap"
                  element={
                    <AuthGuard>
                      <SkillSwap />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/profile/:userId"
                  element={
                    <AuthGuard>
                      <Profile />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/dashboard"
                  element={
                    <AuthGuard>
                      <Dashboard />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/dashboard/dreamswap"
                  element={
                    <AuthGuard>
                      <DreamSwapDashboard />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/video-feed"
                  element={
                    <AuthGuard>
                      <VideoFeedPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/my-profile"
                  element={
                    <AuthGuard>
                      <MyProfilePage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/connect"
                  element={
                    <AuthGuard>
                      <ConnectPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/messages"
                  element={
                    <AuthGuard>
                      <MessagesPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/recommendations"
                  element={
                    <AuthGuard>
                      <RecommendationsPage />
                    </AuthGuard>
                  }
                />
                <Route
                  path="/onboarding"
                  element={
                    <AuthGuard>
                      <Onboarding />
                    </AuthGuard>
                  }
                />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </CallProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
