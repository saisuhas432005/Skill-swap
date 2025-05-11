
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, UserRound } from "lucide-react";

// Skill categories
const skillCategories = [
  "Art & Design",
  "Music",
  "Programming",
  "Languages",
  "Cooking",
  "Fitness",
  "Photography",
  "Writing",
  "Dance",
  "Business",
  "Marketing",
  "Teaching",
];

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  
  // Profile image
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  // Skills
  const [teachSkills, setTeachSkills] = useState<{category: string; name: string; level: string}[]>([]);
  const [newTeachCategory, setNewTeachCategory] = useState("");
  const [newTeachSkill, setNewTeachSkill] = useState("");
  const [newTeachLevel, setNewTeachLevel] = useState("");
  
  const [learnSkills, setLearnSkills] = useState<{category: string; name: string}[]>([]);
  const [newLearnCategory, setNewLearnCategory] = useState("");
  const [newLearnSkill, setNewLearnSkill] = useState("");
  
  useEffect(() => {
    // Check if user already completed onboarding
    const checkProfile = async () => {
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profile) {
        if (profile.full_name) {
          setFullName(profile.full_name);
        }
        
        if (profile.username) {
          setUsername(profile.username);
        }
        
        if (profile.avatar_url) {
          setAvatarUrl(profile.avatar_url);
        }
      }
      
      const { data: skills } = await supabase
        .from('skills')
        .select('*')
        .eq('user_id', user.id);
      
      if (skills && skills.length > 0) {
        const teach = skills.map(skill => ({
          category: skill.category,
          name: skill.skill_name,
          level: skill.skill_level
        }));
        setTeachSkills(teach);
      }
    };
    
    checkProfile();
  }, [user]);
  
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
    }
  };
  
  const addTeachSkill = () => {
    if (!newTeachCategory || !newTeachSkill || !newTeachLevel) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields for the skill you can teach.",
        variant: "destructive",
      });
      return;
    }
    
    setTeachSkills([...teachSkills, {
      category: newTeachCategory,
      name: newTeachSkill,
      level: newTeachLevel
    }]);
    
    // Reset inputs
    setNewTeachCategory("");
    setNewTeachSkill("");
    setNewTeachLevel("");
  };
  
  const addLearnSkill = () => {
    if (!newLearnCategory || !newLearnSkill) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields for the skill you want to learn.",
        variant: "destructive",
      });
      return;
    }
    
    setLearnSkills([...learnSkills, {
      category: newLearnCategory,
      name: newLearnSkill
    }]);
    
    // Reset inputs
    setNewLearnCategory("");
    setNewLearnSkill("");
  };
  
  const removeTeachSkill = (index: number) => {
    const updatedSkills = [...teachSkills];
    updatedSkills.splice(index, 1);
    setTeachSkills(updatedSkills);
  };
  
  const removeLearnSkill = (index: number) => {
    const updatedSkills = [...learnSkills];
    updatedSkills.splice(index, 1);
    setLearnSkills(updatedSkills);
  };
  
  const generateUsername = () => {
    if (!user?.email) return "";
    const baseUsername = user.email.split('@')[0];
    return baseUsername + '_' + Math.random().toString(36).substring(2, 8);
  };
  
  const saveProfile = async () => {
    if (!user) return;
    
    if (!fullName) {
      toast({
        title: "Missing information",
        description: "Please provide your full name.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Generate a username if not provided
      const finalUsername = username || generateUsername();
      
      // Update profile
      const updates = {
        id: user.id,
        full_name: fullName,
        username: finalUsername, // Add username field here
        updated_at: new Date().toISOString(),
      };
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(updates);
      
      if (profileError) throw profileError;
      
      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);
        
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: publicURL } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        if (publicURL) {
          const { error: urlError } = await supabase
            .from('profiles')
            .update({ avatar_url: publicURL.publicUrl })
            .eq('id', user.id);
          
          if (urlError) throw urlError;
        }
      }
      
      // Save teaching skills
      if (teachSkills.length > 0) {
        const skillsToInsert = teachSkills.map(skill => ({
          user_id: user.id,
          category: skill.category,
          skill_name: skill.name,
          skill_level: skill.level
        }));
        
        const { error: skillsError } = await supabase
          .from('skills')
          .upsert(skillsToInsert, { onConflict: 'user_id, skill_name' });
        
        if (skillsError) throw skillsError;
      }
      
      // Save learning interests (as skill swap requests)
      if (learnSkills.length > 0) {
        for (const skill of learnSkills) {
          const matchingTeachSkill = teachSkills.find(t => 
            t.category === skill.category
          );
          
          if (matchingTeachSkill) {
            const { error: swapError } = await supabase
              .from('skill_swap_requests')
              .insert({
                user_id: user.id,
                offer_skill: matchingTeachSkill.name,
                want_skill: skill.name,
                description: `I want to learn ${skill.name} and can teach ${matchingTeachSkill.name}.`
              });
            
            if (swapError) throw swapError;
          }
        }
      }
      
      toast({
        title: "Profile completed",
        description: "Your profile has been set up successfully!",
      });
      
      navigate('/dashboard');
    } catch (error) {
      const e = error as Error;
      toast({
        title: "Error saving profile",
        description: e.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto max-w-4xl">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-2xl gradient-text">Complete Your Profile</CardTitle>
              <CardDescription>
                Welcome to SkillSpark! Complete your profile to match with others and share your talents.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6 grid grid-cols-3">
                  <TabsTrigger value="profile">Basic Info</TabsTrigger>
                  <TabsTrigger value="teach">Skills You Teach</TabsTrigger>
                  <TabsTrigger value="learn">Skills To Learn</TabsTrigger>
                </TabsList>
                
                <TabsContent value="profile" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input 
                          id="fullName" 
                          placeholder="Your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input 
                          id="username" 
                          placeholder="Choose a username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">Leave blank to auto-generate a username.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email" 
                          value={user?.email || ""} 
                          disabled 
                        />
                        <p className="text-xs text-gray-500">Your email is used for login and cannot be changed.</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <Label>Profile Picture</Label>
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <UserRound className="h-16 w-16 text-gray-400" />
                            )}
                          </div>
                          
                          <label 
                            htmlFor="avatar-upload" 
                            className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-spark cursor-pointer flex items-center justify-center"
                          >
                            <Upload className="h-4 w-4 text-white" />
                          </label>
                          <input 
                            id="avatar-upload" 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleAvatarChange}
                          />
                        </div>
                      </div>
                      <p className="text-center text-xs text-gray-500 mt-2">Click the icon to upload a profile picture</p>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="teach" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-spark-purple/10 p-3 rounded-lg">
                        <h3 className="font-medium text-spark-dark mb-2">Add Skills You Can Teach</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="teach-category">Skill Category</Label>
                        <Select value={newTeachCategory} onValueChange={setNewTeachCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {skillCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="teach-skill">Specific Skill</Label>
                        <Input
                          id="teach-skill"
                          placeholder="e.g., JavaScript, Guitar, French"
                          value={newTeachSkill}
                          onChange={(e) => setNewTeachSkill(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="teach-level">Your Proficiency Level</Label>
                        <Select value={newTeachLevel} onValueChange={setNewTeachLevel}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Beginner">Beginner</SelectItem>
                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                            <SelectItem value="Advanced">Advanced</SelectItem>
                            <SelectItem value="Expert">Expert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        type="button" 
                        onClick={addTeachSkill}
                        className="w-full bg-spark hover:bg-spark-dark"
                      >
                        Add Skill
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-4">Your Teaching Skills</h3>
                      
                      {teachSkills.length === 0 ? (
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No skills added yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {teachSkills.map((skill, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{skill.name}</p>
                                <div className="flex space-x-2 text-xs text-gray-500">
                                  <span>{skill.category}</span>
                                  <span>•</span>
                                  <span>{skill.level}</span>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeTeachSkill(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="learn" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="bg-spark-blue/10 p-3 rounded-lg">
                        <h3 className="font-medium text-spark-brightBlue mb-2">Add Skills You Want to Learn</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="learn-category">Skill Category</Label>
                        <Select value={newLearnCategory} onValueChange={setNewLearnCategory}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {skillCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="learn-skill">Specific Skill</Label>
                        <Input
                          id="learn-skill"
                          placeholder="e.g., JavaScript, Guitar, French"
                          value={newLearnSkill}
                          onChange={(e) => setNewLearnSkill(e.target.value)}
                        />
                      </div>
                      
                      <Button 
                        type="button" 
                        onClick={addLearnSkill}
                        className="w-full bg-spark hover:bg-spark-dark"
                      >
                        Add Skill
                      </Button>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-4">Skills You Want to Learn</h3>
                      
                      {learnSkills.length === 0 ? (
                        <div className="text-center p-6 bg-gray-50 rounded-lg">
                          <p className="text-gray-500">No skills added yet</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {learnSkills.map((skill, index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium">{skill.name}</p>
                                <div className="flex space-x-2 text-xs text-gray-500">
                                  <span>{skill.category}</span>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => removeLearnSkill(index)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Skip for Now
              </Button>
              
              <div className="flex space-x-2">
                {activeTab === "profile" ? (
                  <Button onClick={() => setActiveTab("teach")}>
                    Next: Teaching Skills
                  </Button>
                ) : activeTab === "teach" ? (
                  <Button onClick={() => setActiveTab("learn")}>
                    Next: Learning Skills
                  </Button>
                ) : (
                  <Button 
                    onClick={saveProfile} 
                    disabled={isLoading}
                    className="bg-spark hover:bg-spark-dark"
                  >
                    {isLoading ? "Saving..." : "Complete Profile"}
                  </Button>
                )}
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Onboarding;
