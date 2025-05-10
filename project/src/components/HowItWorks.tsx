
import { Check } from "lucide-react";

const steps = [
  {
    number: 1,
    title: "Create an account",
    description: "Sign up and join our community of talented individuals looking to grow and share their skills.",
    color: "from-spark-purple/70 to-spark-purple/20",
  },
  {
    number: 2,
    title: "Upload your talent video",
    description: "Record a 30-60 second video showcasing your best talent. You get one chance per week to shine.",
    color: "from-spark/70 to-spark/20",
  },
  {
    number: 3,
    title: "Specify your skill exchange",
    description: "Tell us what skill you can offer to teach and what skill you want to learn from others.",
    color: "from-spark-blue/70 to-spark-blue/20",
  },
  {
    number: 4,
    title: "Get matched",
    description: "Our AI connects you with the perfect skill exchange partners based on your preferences.",
    color: "from-spark-brightBlue/70 to-spark-brightBlue/20",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">How SkillSwap Works</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform makes it easy to showcase your talents and connect with others for skill exchanges. 
            Here's how to get started:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div 
              key={step.number} 
              className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow animate-fade-in"
              style={{ animationDelay: `${step.number * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                <span className="text-white font-bold">{step.number}</span>
              </div>
              <h3 className="text-xl font-semibold mb-2 text-spark-darkest">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-spark-purple/10 to-spark-blue/10 p-8 rounded-xl max-w-4xl mx-auto">
          <h3 className="text-2xl font-semibold mb-4 text-center text-spark-darkest">Why SkillSwap?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start space-x-3">
              <div className="mt-1 bg-spark-purple/20 p-1 rounded-full">
                <Check className="h-4 w-4 text-spark-dark" />
              </div>
              <p className="text-gray-700">One weekly chance to showcase your best work keeps content quality high</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-1 bg-spark-purple/20 p-1 rounded-full">
                <Check className="h-4 w-4 text-spark-dark" />
              </div>
              <p className="text-gray-700">AI-powered talent detection helps categorize and recommend your skills</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-1 bg-spark-purple/20 p-1 rounded-full">
                <Check className="h-4 w-4 text-spark-dark" />
              </div>
              <p className="text-gray-700">Smart matching algorithm finds the perfect skill exchange partners</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="mt-1 bg-spark-purple/20 p-1 rounded-full">
                <Check className="h-4 w-4 text-spark-dark" />
              </div>
              <p className="text-gray-700">Build a portfolio of skills and grow your network of talented individuals</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
