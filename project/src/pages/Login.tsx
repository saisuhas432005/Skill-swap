
import { useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthForms from "@/components/AuthForms";

const Login = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12 flex items-center">
        <div className="container mx-auto">
          <AuthForms type="login" />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
