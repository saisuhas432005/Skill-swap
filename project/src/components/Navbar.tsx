import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserMenu from "./UserMenu";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() === "") return;
    navigate(`/profile?search=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white py-4 px-6 shadow-sm fixed w-full z-50">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-gradient-to-br from-spark-dark to-spark rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="font-bold text-xl">SkillSwap</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center space-x-2">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-spark-purple"
            />
            <Button type="submit" className="bg-spark text-white hover:bg-spark-dark">
              Search
            </Button>
          </form>

          {/* Desktop Navigation */}
          {/* ...rest of your navbar links and components */}
            {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
           
            <Link to="/" className="text-gray-600 hover:text-spark-dark">Home</Link>
            <Link to="/video-feed" className="text-gray-600 hover:text-spark-dark">Video Feed</Link>
            <Link to="/my-profile" className="text-gray-600 hover:text-spark-dark">My Profile</Link>
            <Link to="/messages" className="text-gray-600 hover:text-spark-dark">Messages</Link>
            <Link to="/skillswap" className="text-gray-600 hover:text-spark-dark">DreamSwap</Link>
            
            {user ? (
              <UserMenu />
            ) : (
              <div className="space-x-2">
                <Link to="/login">
                  <Button variant="outline" className="border-spark hover:bg-spark hover:text-white">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-spark hover:bg-spark-dark text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            {user && <UserMenu />}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleMenu}
              className="text-gray-700 ml-2"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden pt-4 pb-2 animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 mb-4 px-2">
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-spark-purple flex-grow"
              />
              <Button type="submit" className="bg-spark text-white hover:bg-spark-dark">
                Search
              </Button>
            </form>
            <div className="flex flex-col space-y-3 px-2">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-spark-dark px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/" 
                className="text-gray-600 hover:text-spark-dark px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                to="/video-feed" 
                className="text-gray-600 hover:text-spark-dark px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Video Feed
              </Link>
              <Link 
                to="/my-profile" 
                className="text-gray-600 hover:text-spark-dark px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                My Profile
              </Link>
              <Link 
                to="/connect" 
                className="text-gray-600 hover:text-spark-dark px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Connect
              </Link>
              <Link 
                to="/messages" 
                className="text-gray-600 hover:text-spark-dark px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Messages
              </Link>
              <Link 
                to="/skillswap" 
                className="text-gray-600 hover:text-spark-dark px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                DreamSwap
              </Link>
              <Link 
                to="/recommendations" 
                className="text-gray-600 hover:text-spark-dark px-2 py-1"
                onClick={() => setIsMenuOpen(false)}
              >
                Recommendations
              </Link>
              <Link to="/profile?tab=skills" className="text-gray-600 hover:text-spark-dark px-2 py-1" onClick={() => setIsMenuOpen(false)}>
                Add Skills
              </Link>
              {!user && (
                <div className="pt-2 flex flex-col space-y-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      variant="outline" 
                      className="w-full border-spark hover:bg-spark hover:text-white"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      className="w-full bg-spark hover:bg-spark-dark text-white"
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};



export default Navbar;
