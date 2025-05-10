
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { UserRound, AlertTriangle, Sparkles } from "lucide-react";
import { findSkillMatches, SkillMatch } from "@/ai/skillMatching";
import { isAiServiceAvailable } from "@/ai/utils";
import { AI_API_BASE } from "@/ai/config";

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

type MatchedUser = {
  id: string;
  name: string;
  profilePic: string | null;
  location: string;
  offeredSkill: string;
  wantedSkill: string;
  bio: string;
  matchScore: number;
};

const SkillSwap = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offeredCategory, setOfferedCategory] = useState("");
  const [offeredSkill, setOfferedSkill] = useState("");
  const [offeredLevel, setOfferedLevel] = useState("");
  const [wantedCategory, setWantedCategory] = useState("");
  const [wantedSkill, setWantedSkill] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [matches, setMatches] = useState<MatchedUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [userSkills, setUserSkills] = useState<{category: string; name: string; level: string}[]>([]);
  const [isAiAvailable, setIsAiAvailable] = useState<boolean | null>(null);
  const [useAiMatching, setUseAiMatching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Check AI service availability
    const checkAiService = async () => {
      const available = await isAiServiceAvailable(AI_API_BASE);
      setIsAiAvailable(available);
      
      if (!available) {
        setUseAiMatching(false);
        toast({
          title: "AI Service Unavailable",
          description: "The AI matching service is currently unavailable. We'll use standard matching instead.",
          variant: "destructive",
        });
      }
    };
    
    checkAiService();
    
    // Fetch user's existing skills if logged in
    const fetchUserSkills = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('skills')
          .select('*')
          .eq('user_id', user.id);
        
        if (error) throw error;
        
        if (data) {
          const skills = data.map(skill => ({
            category: skill.category,
            name: skill.skill_name,
            level: skill.skill_level
          }));
          setUserSkills(skills);
          
          // Pre-populate the first skill if available
          if (skills.length > 0) {
            setOfferedCategory(skills[0].category);
            setOfferedSkill(skills[0].name);
            setOfferedLevel(skills[0].level);
          }
        }
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };
    
    fetchUserSkills();
  }, [user, toast]);

  const findMatches = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to find skill swap matches.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate inputs
    if (!offeredCategory || !offeredSkill || !offeredLevel || !wantedCategory || !wantedSkill) {
      toast({
        title: "Incomplete information",
        description: "Please fill in all required fields to find matches.",
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);
    setMatches(null);
    
    try {
      // First, save the skill swap request
      const { data: requestData, error: requestError } = await supabase
        .from('skill_swap_requests')
        .insert({
          user_id: user.id,
          offer_skill: offeredSkill,
          want_skill: wantedSkill,
          description: additionalInfo,
          status: 'open'
        })
        .select()
        .single();
      
      if (requestError) throw requestError;
      
      // Check if we should use AI matching
      if (useAiMatching && isAiAvailable) {
        console.log("Calling findSkillMatches with:", { offeredSkill, wantedSkill, offeredLevel });
        // Use AI service for better matching
        const aiMatchResult = await findSkillMatches({
          offeredSkill: offeredSkill,
          wantedSkill: wantedSkill,
          offeredSkillLevel: offeredLevel,
          userId: user.id,
          maxMatches: 5
        });
        
        if (aiMatchResult.error) {
          console.warn("AI matching error:", aiMatchResult.error);
          // Fall back to database matching
        } else if (aiMatchResult.matches && aiMatchResult.matches.length > 0) {
          // Transform AI matches to our MatchedUser format
          const aiMatches: MatchedUser[] = await Promise.all(
            aiMatchResult.matches.map(async (match) => {
              // Get profile info for this user if not included in AI response
              let profileInfo = {
                full_name: match.fullName || "SkillSpark User",
                avatar_url: match.avatarUrl || null,
                bio: match.bio || ""
              };
              
              if (!match.fullName) {
                const { data } = await supabase
                  .from('profiles')
                  .select('full_name, avatar_url, bio')
                  .eq('id', match.userId)
                  .single();
                
                if (data) {
                  profileInfo = data;
                }
              }
              
              // Create match in database
              await supabase
                .from('matches')
                .insert({
                  request_id: requestData.id,
                  matched_user_id: match.userId,
                  match_score: match.matchScore * 100, // Convert to percentage
                  status: 'pending'
                });
              
              return {
                id: match.userId,
                name: profileInfo.full_name || "SkillSpark User",
                profilePic: profileInfo.avatar_url,
                location: "Global",
                offeredSkill: match.wantedSkill, // They offer what we want
                wantedSkill: match.offeredSkill, // They want what we offer
                bio: profileInfo.bio || `This user can help you learn ${match.wantedSkill}.`,
                matchScore: Math.round(match.matchScore * 100) // Convert to percentage
              };
            })
          );
          
          // Sort by match score
          aiMatches.sort((a, b) => b.matchScore - a.matchScore);
          
          setMatches(aiMatches);
          
          toast({
            title: `${aiMatches.length} AI-powered matches found!`,
            description: "Our AI found potential skill exchange partners for you.",
            variant: "default",
          });
          
          setLoading(false);
          return;
        }
      }
      
      // If AI matching is disabled, unavailable, or returned no matches, use database matching
      // Find potential matches (users who offer what this user wants)
      const { data: potentialMatches, error: matchError } = await supabase
        .from('skills')
        .select(`
          user_id,
          skill_name,
          skill_level,
          category,
          profiles:user_id(full_name, avatar_url)
        `)
        .eq('skill_name', wantedSkill)
        .neq('user_id', user.id);
      
      if (matchError) throw matchError;
      
      if (potentialMatches && potentialMatches.length > 0) {
        // Calculate match scores and create match entries in the database
        const matchedUsers: MatchedUser[] = [];
        
        for (const match of potentialMatches) {
          // Calculate a random match score (in a real app, this would be based on skill compatibility)
          const matchScore = Math.floor(Math.random() * (98 - 75) + 75);
          
          // Get or create user's location
          const location = "Global";
          
          // Extract profile info
          const profileInfo = match.profiles as any;
          
          // Create a match in the database
          const { error: createMatchError } = await supabase
            .from('matches')
            .insert({
              request_id: requestData.id,
              matched_user_id: match.user_id,
              match_score: matchScore,
              status: 'pending'
            });
          
          if (createMatchError) {
            console.error("Error creating match:", createMatchError);
            continue;
          }
          
          // Add to matched users for display
          matchedUsers.push({
            id: match.user_id,
            name: profileInfo.full_name || "SkillSpark User",
            profilePic: profileInfo.avatar_url,
            location: location,
            offeredSkill: match.skill_name,
            wantedSkill: offeredSkill, // They want what this user offers
            bio: `${profileInfo.full_name || "This user"} can help you learn ${match.skill_name} at a ${match.skill_level.toLowerCase()} level.`,
            matchScore: matchScore
          });
        }
        
        // Sort by match score
        matchedUsers.sort((a, b) => b.matchScore - a.matchScore);
        
        setMatches(matchedUsers);
        
        if (matchedUsers.length === 0) {
          toast({
            title: "No matches found",
            description: "We couldn't find any matches for your skill swap. Try different skills or check back later.",
            variant: "default",
          });
        } else {
          toast({
            title: `${matchedUsers.length} matches found!`,
            description: "We found potential skill exchange partners for you.",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "No matches found",
          description: "We couldn't find any matches for your skill swap. Try different skills or check back later.",
          variant: "default",
        });
      }
    } catch (error) {
      const e = error as Error;
      toast({
        title: "Error finding matches",
        description: e.message || "There was an error searching for matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="space-y-6">
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl gradient-text">DreamSwap Skill Exchange</CardTitle>
            <CardDescription>
              Specify what you can teach and what you want to learn. Our AI will find the perfect skill exchange partners for you.
            </CardDescription>
            
            {/* AI Matching Toggle */}
            {isAiAvailable && (
              <div className="flex items-center mt-2 space-x-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="ai-matching"
                    checked={useAiMatching}
                    onChange={(e) => setUseAiMatching(e.target.checked)}
                    className="rounded border-gray-300 text-spark-purple focus:ring-spark-purple"
                  />
                  <label htmlFor="ai-matching" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                    <Sparkles className="h-4 w-4 mr-1 text-spark-purple" />
                    Use AI-powered matching
                  </label>
                </div>
                <div className="text-xs text-gray-500">
                  (Finds better skill compatibility)
                </div>
              </div>
            )}
            
            {isAiAvailable === false && (
              <div className="flex items-center mt-2 text-sm text-amber-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                AI matching service unavailable. Using standard matching.
              </div>
            )}
          </CardHeader>
          
          <form onSubmit={findMatches}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-spark-purple/10 p-3 rounded-lg">
                    <h3 className="font-medium text-spark-dark mb-2">What I can offer</h3>
                  </div>
                  
                  {userSkills.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="existing-skill">Use an existing skill</Label>
                      <Select onValueChange={(value) => {
                        const skill = userSkills.find(s => s.name === value);
                        if (skill) {
                          setOfferedCategory(skill.category);
                          setOfferedSkill(skill.name);
                          setOfferedLevel(skill.level);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a skill" />
                        </SelectTrigger>
                        <SelectContent>
                          {userSkills.map((skill, index) => (
                            <SelectItem key={index} value={skill.name}>
                              {skill.name} ({skill.category}) - {skill.level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="offered-category">Skill Category</Label>
                    <Select value={offeredCategory} onValueChange={setOfferedCategory}>
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
                    <Label htmlFor="offered-skill">Specific Skill</Label>
                    <Input
                      id="offered-skill"
                      placeholder="e.g., JavaScript, Guitar, French"
                      value={offeredSkill}
                      onChange={(e) => setOfferedSkill(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="offered-level">Your Proficiency Level</Label>
                    <Select value={offeredLevel} onValueChange={setOfferedLevel}>
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
                </div>
                
                <div className="space-y-4">
                  <div className="bg-spark-blue/10 p-3 rounded-lg">
                    <h3 className="font-medium text-spark-brightBlue mb-2">What I want to learn</h3>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="wanted-category">Skill Category</Label>
                    <Select value={wantedCategory} onValueChange={setWantedCategory}>
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
                    <Label htmlFor="wanted-skill">Specific Skill</Label>
                    <Input
                      id="wanted-skill"
                      placeholder="e.g., JavaScript, Guitar, French"
                      value={wantedSkill}
                      onChange={(e) => setWantedSkill(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="additional-info">Additional Information (Optional)</Label>
                    <Textarea
                      id="additional-info"
                      placeholder="Share more details about your experience and goals..."
                      className="resize-none"
                      rows={3}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-spark-dark to-spark-brightBlue hover:opacity-90 transition-opacity"
                disabled={loading}
              >
                {loading ? "Finding matches..." : useAiMatching && isAiAvailable ? "Find My Perfect AI-Powered Skill Swap" : "Find My Perfect Skill Swap"}
              </Button>
            </CardFooter>
          </form>
        </Card>
        
        {matches && matches.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold gradient-text">Your Matches</h2>
            
            <div className="grid grid-cols-1 gap-4">
              {matches.map((user) => (
                <Card key={user.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row">
                    <div className="md:w-1/4 bg-gradient-to-br from-spark-purple/20 to-spark-blue/20 p-6 flex flex-col items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-spark-purple/30 flex items-center justify-center mb-3">
                        {user.profilePic ? (
                          <img src={user.profilePic} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <UserRound className="h-10 w-10 text-spark-dark" />
                        )}
                      </div>
                      <h3 className="font-medium text-spark-darkest">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.location}</p>
                      <div className="mt-3 bg-white/70 px-3 py-1 rounded-full">
                        <span className="text-xs font-medium text-spark-dark">
                          {user.matchScore}% Match
                        </span>
                      </div>
                    </div>
                    
                    <div className="md:w-3/4 p-6">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div className="bg-spark-purple/10 px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-spark-dark">
                            Offers: {user.offeredSkill}
                          </span>
                        </div>
                        <div className="bg-spark-blue/10 px-3 py-1 rounded-full">
                          <span className="text-xs font-medium text-spark-brightBlue">
                            Wants: {user.wantedSkill}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{user.bio}</p>
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          className="border-spark text-spark-dark hover:bg-spark-purple/10"
                          onClick={() => navigate(`/profile/${user.id}`)}
                        >
                          View Profile
                        </Button>
                        <Button 
                          className="bg-spark hover:bg-spark-dark"
                          onClick={() => navigate('/dashboard')}
                        >
                          Go to Dashboard
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {matches && matches.length === 0 && (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No matches found</h3>
            <p className="text-gray-500 mb-4">
              We couldn't find any matches for your skill exchange. Try selecting different skills or check back later.
            </p>
            <Button variant="outline" onClick={() => setMatches(null)}>
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillSwap;
