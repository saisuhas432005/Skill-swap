
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24 bg-gradient-to-b from-spark-purple/30 to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-6 inline-block p-2 bg-spark-purple/50 rounded-full">
            <div className="bg-white px-4 py-1 rounded-full">
              <span className="text-sm font-medium text-spark-dark">Discover. Showcase. Exchange.</span>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-text">
            Ignite Your Potential with SkillSwap
          </h1>
          
          <p className="text-lg md:text-xl text-gray-600 mb-8 md:mb-10">
            A revolutionary platform that helps you showcase your unique talent and connect with others to 
            exchange skills. One chance per week to shine — a lifetime to learn.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="bg-spark hover:bg-spark-dark text-white w-full sm:w-auto">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/upload">
              <Button size="lg" variant="outline" className="border-spark hover:bg-spark-purple/20 text-spark-dark w-full sm:w-auto">
                Upload Your Talent
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-spark-purple/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-spark-dark text-xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-spark-darkest">OneChance</h3>
              <p className="text-gray-600">
                Showcase your best talent in a 30-60 second video once per week. Our AI detects your skill 
                type and helps others discover your unique abilities.
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-spark-blue/40 rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-spark-brightBlue text-xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-spark-darkest">DreamSwap</h3>
              <p className="text-gray-600">
                Offer a skill you have and request one you want to learn. Our matching system connects you with 
                the perfect skill exchange partners.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-spark-purple/20 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-72 h-72 bg-spark-blue/20 rounded-full filter blur-3xl"></div>
    </div>
  );
};

export default Hero;
