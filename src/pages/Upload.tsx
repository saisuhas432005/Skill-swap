import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import VideoUpload from "../components/VideoUpload";

const Upload = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto">
          <VideoUpload />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Upload;
