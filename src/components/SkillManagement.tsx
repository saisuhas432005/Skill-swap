
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const skillCategories = [
  "Art & Design",
  "Business & Finance",
  "Education",
  "Engineering",
  "Health & Fitness",
  "Languages",
  "Music",
  "Programming",
  "Science",
  "Other"
];

const skillLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

const SkillManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  
  // Skill input states
  const [activeTab, setActiveTab] = useState("offered");
  const [skillName, setSkillName] = useState("");
  const [skillCategory, setSkillCategory] = useState("Other");
  const [skillLevel, setSkillLevel] = useState("Beginner");
  
  // Lists of skills
  const [offeredSkills, setOfferedSkills] = useState<string[]>([]);
  const [wantedSkills, setWantedSkills] = useState<string[]>([]);
  
  // Popular skills for suggestions
  const [popularSkills, setPopularSkills] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
      fetchPopularSkills();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      
      setProfileData(data);
      
      // Set offered and wanted skills from profile
      if (data.offered_skills && Array.isArray(data.offered_skills)) {
        setOfferedSkills(data.offered_skills);
      }
      
      if (data.wanted_skills && Array.isArray(data.wanted_skills)) {
        setWantedSkills(data.wanted_skills);
      }
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Failed to load profile data',
        description: 'Please try refreshing the page',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchPopularSkills = async () => {
    try {
      // Get the most common skills from the skills table
      const { data, error } = await supabase
        .from('skills')
        .select('skill_name')
        .order('created_at', { ascending: false })
        .limit(20);
        
      if (error) throw error;
      
      if (data) {
        // Extract unique skill names
        const uniqueSkills = [...new Set(data.map(item => item.skill_name))];
        setPopularSkills(uniqueSkills.slice(0, 10)); // Take top 10
      }
      
    } catch (error) {
      console.error('Error fetching popular skills:', error);
    }
  };

  const addSkill = async () => {
    if (!skillName.trim()) {
      toast({
        title: 'Skill name required',
        description: 'Please enter a skill name',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const trimmedSkill = skillName.trim();
      
      if (activeTab === "offered") {
        // Check if skill already exists in the array
        if (offeredSkills.includes(trimmedSkill)) {
          toast({
            title: 'Skill already added',
            description: `${trimmedSkill} is already in your offered skills`,
            variant: 'destructive'
          });
          return;
        }
        
        // Add to offered skills
        const updatedSkills = [...offeredSkills, trimmedSkill];
        setOfferedSkills(updatedSkills);
        
        // Also add to the skills table for better tracking
        const { error } = await supabase
          .from('skills')
          .insert({
            user_id: user?.id,
            skill_name: trimmedSkill,
            skill_level: skillLevel,
            category: skillCategory
          });
          
        if (error) {
          console.error("Error adding to skills table:", error);
          // Continue anyway since we're still updating the profile
        }
        
      } else {
        // Check if skill already exists in the array
        if (wantedSkills.includes(trimmedSkill)) {
          toast({
            title: 'Skill already added',
            description: `${trimmedSkill} is already in your wanted skills`,
            variant: 'destructive'
          });
          return;
        }
        
        // Add to wanted skills
        const updatedSkills = [...wantedSkills, trimmedSkill];
        setWantedSkills(updatedSkills);
      }
      
      // Reset the form
      setSkillName("");
      
      toast({
        title: 'Skill added',
        description: `${skillName} has been added to your ${activeTab === "offered" ? "offered" : "wanted"} skills`,
      });
      
    } catch (error) {
      console.error('Error adding skill:', error);
      toast({
        title: 'Failed to add skill',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };
  
  const removeSkill = async (skill: string, type: "offered" | "wanted") => {
    try {
      if (type === "offered") {
        setOfferedSkills(offeredSkills.filter(s => s !== skill));
      } else {
        setWantedSkills(wantedSkills.filter(s => s !== skill));
      }
      
      toast({
        title: 'Skill removed',
        description: `${skill} has been removed from your ${type} skills`,
      });
      
    } catch (error) {
      console.error('Error removing skill:', error);
      toast({
        title: 'Failed to remove skill',
        description: 'Please try again',
        variant: 'destructive'
      });
    }
  };
  
  const saveSkillsToProfile = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          offered_skills: offeredSkills,
          wanted_skills: wantedSkills,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Skills saved',
        description: 'Your skill profile has been updated',
      });
      
    } catch (error) {
      console.error('Error saving skills:', error);
      toast({
        title: 'Failed to save skills',
        description: 'Please try again',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-8">Loading skill profile...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Your Skills</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="space-y-4"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offered">Skills I Offer</TabsTrigger>
            <TabsTrigger value="wanted">Skills I Want</TabsTrigger>
          </TabsList>
          
          <TabsContent value="offered" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Add skills you can teach or offer to others</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {offeredSkills.map(skill => (
                  <Badge key={skill} className="flex items-center gap-1 px-2 py-1">
                    {skill}
                    <button 
                      onClick={() => removeSkill(skill, "offered")} 
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </Badge>
                ))}
                {offeredSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No offered skills added yet</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="Add a skill you can offer"
                      value={skillName}
                      onChange={(e) => setSkillName(e.target.value)}
                      list="popular-skills"
                    />
                    <datalist id="popular-skills">
                      {popularSkills.map(skill => (
                        <option key={skill} value={skill} />
                      ))}
                    </datalist>
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={addSkill}
                  >
                    <PlusCircle className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Select value={skillLevel} onValueChange={setSkillLevel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Skill Level" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillLevels.map(level => (
                        <SelectItem key={level} value={level}>
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={skillCategory} onValueChange={setSkillCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {skillCategories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="wanted" className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Add skills you want to learn</h3>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {wantedSkills.map(skill => (
                  <Badge key={skill} className="flex items-center gap-1 px-2 py-1">
                    {skill}
                    <button 
                      onClick={() => removeSkill(skill, "wanted")} 
                      className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove</span>
                    </button>
                  </Badge>
                ))}
                {wantedSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">No wanted skills added yet</p>
                )}
              </div>
              
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="Add a skill you want to learn"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    list="popular-skills"
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={addSkill}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <Button 
            onClick={saveSkillsToProfile}
            className="w-full"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save Skills to Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SkillManagement;
