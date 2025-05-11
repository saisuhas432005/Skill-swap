
import { Camera, Users, Star, MessageSquare } from "lucide-react";

const features = [
  {
    icon: <Camera className="h-6 w-6 text-spark" />,
    title: "OneChance Video Upload",
    description: "Showcase your best talent in a short video once per week. Our AI analyzes your skills.",
  },
  {
    icon: <Users className="h-6 w-6 text-spark" />,
    title: "DreamSwap Skill Exchange",
    description: "Offer to teach what you know and request to learn what you want from others.",
  },
  {
    icon: <Star className="h-6 w-6 text-spark" />,
    title: "AI-Powered Matching",
    description: "Get matched with the perfect skill exchange partners based on your offerings and requests.",
  },
  {
    icon: <MessageSquare className="h-6 w-6 text-spark" />,
    title: "Connect & Learn",
    description: "Chat with your matches, schedule sessions, and start learning new skills immediately.",
  },
];

const Features = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Platform Features</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            SkillSwap combines two powerful concepts to help you discover, showcase, and exchange talents
            with others around the world.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow hover-scale"
            >
              <div className="bg-spark-purple/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2 text-spark-darkest">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-white p-8 rounded-xl shadow-md max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-spark-darkest">OneChance</h3>
              <p className="text-gray-600 mb-4">
                Our unique OneChance feature gives you a weekly opportunity to showcase your best talent in a
                30-60 second video. This creates a high-quality platform where only your best work is shared.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-spark rounded-full mr-2"></div>
                  Weekly talent showcase opportunity
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-spark rounded-full mr-2"></div>
                  AI skill detection and categorization
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-spark rounded-full mr-2"></div>
                  Build a portfolio of your best work
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4 text-spark-darkest">DreamSwap</h3>
              <p className="text-gray-600 mb-4">
                DreamSwap connects people who want to exchange skills. Offer what you're good at and request
                what you want to learn, and our AI will find your perfect skill exchange partners.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-spark rounded-full mr-2"></div>
                  Smart skill exchange matching
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-spark rounded-full mr-2"></div>
                  Two-way learning opportunity
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="w-2 h-2 bg-spark rounded-full mr-2"></div>
                  Real-time chat with your matches
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
