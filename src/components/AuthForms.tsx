
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface AuthFormProps {
  type: "login" | "register";
}

const AuthForms = ({ type }: AuthFormProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (type === "register" && !fullName) {
      toast({
        title: "Missing information",
        description: "Please enter your full name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!email) {
      toast({
        title: "Missing information",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }
    
    if (!password) {
      toast({
        title: "Missing information",
        description: "Please enter your password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (type === "login") {
        await signIn(email, password);
        toast({
          title: "Logged in successfully",
          description: "Welcome back to SkillSpark!",
        });
      } else {
        await signUp(email, password, fullName);
        toast({
          title: "Account created successfully",
          description: "Welcome to SkillSpark! You can now start sharing your talents.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Authentication error",
        description: error.message || "Failed to authenticate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="max-w-md w-full mx-auto p-4">
      <Card className="shadow-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center gradient-text">
            {type === "login" ? "Welcome back" : "Create an account"}
          </CardTitle>
          <CardDescription className="text-center">
            {type === "login" 
              ? "Enter your credentials to access your account" 
              : "Sign up to showcase your talents and connect with others"}
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {type === "register" && (
              <div className="space-y-2">
                <Label htmlFor="full-name">Full Name</Label>
                <Input
                  id="full-name"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Password</Label>
                {type === "login" && (
                  <Link to="/forgot-password" className="text-xs text-spark-dark hover:underline">
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-spark hover:bg-spark-dark"
              disabled={isLoading}
            >
              {isLoading 
                ? type === "login" ? "Logging in..." : "Creating account..." 
                : type === "login" ? "Log in" : "Create account"}
            </Button>
            
            <div className="text-center text-sm text-gray-600">
              {type === "login" ? (
                <>
                  Don't have an account?{" "}
                  <Link to="/register" className="font-medium text-spark-dark hover:underline">
                    Sign up
                  </Link>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <Link to="/login" className="font-medium text-spark-dark hover:underline">
                    Log in
                  </Link>
                </>
              )}
            </div>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          By continuing, you agree to SkillSpark's{" "}
          <a href="#" className="text-spark-dark hover:underline">Terms of Service</a>
          {" "}and{" "}
          <a href="#" className="text-spark-dark hover:underline">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default AuthForms;
