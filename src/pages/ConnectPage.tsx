import * as React from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SocialFeatures from "../components/SocialFeatures";

const ConnectPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 container mx-auto">
        <h1 className="text-3xl font-bold mb-6">Connect</h1>
        <SocialFeatures />
      </main>
      <Footer />
    </div>
  );
};

export default ConnectPage;
