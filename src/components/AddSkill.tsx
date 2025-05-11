
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

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

// These must match exactly what's allowed in the database constraint
const skillLevels = [
  "Beginner",
  "Intermediate", 
  "Advanced",
  "Expert"
];

const AddSkill = ({ onSkillAdded }: { onSkillAdded?: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [skillName, setSkillName] = useState("");
  const [skillLevel, setSkillLevel] = useState<string>("Beginner");
  const [category, setCategory] = useState<string>("Other");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddSkill = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to add skills.",
        variant: "destructive"
      });
      return;
    }

    if (!skillName.trim() || !skillLevel || !category) {
      setError("Please fill out all fields.");
      return;
    }

    // Validate that skillLevel is one of the allowed values
    if (!skillLevels.includes(skillLevel)) {
      setError(`Invalid skill level. Must be one of: ${skillLevels.join(", ")}`);
      return;
    }

    try {
      setIsSubmitting(true);

      // Check if skill already exists for this user to avoid duplicates
      const { data: existingSkills, error: checkError } = await supabase
        .from('skills')
        .select('id')
        .eq('user_id', user.id)
        .eq('skill_name', skillName.trim());

      if (checkError) {
        console.error("Check error:", checkError);
        throw new Error("Failed to check for existing skills.");
      }

      if (existingSkills && existingSkills.length > 0) {
        setError(`${skillName} is already in your profile.`);
        setIsSubmitting(false);
        return;
      }

      console.log("Inserting skill with level:", skillLevel);
      
      // Insert the new skill
      const { error: insertError } = await supabase
        .from('skills')
        .insert({
          user_id: user.id,
          skill_name: skillName.trim(),
          skill_level: skillLevel,  
          category: category
        });

      if (insertError) {
        console.error("Insert error details:", insertError);
        throw new Error(insertError.message || "Failed to add skill");
      }

      // Success! Clear form and show toast
      toast({
        title: "Skill added",
        description: `${skillName} has been added to your profile.`
      });

      // Reset form
      setSkillName("");
      setError(null);
      
      // Call callback if provided
      if (onSkillAdded) onSkillAdded();
      
    } catch (error: any) {
      console.error("Error adding skill:", error);
      setError(error.message || "Failed to add skill. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Skill</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleAddSkill} className="space-y-4">
          <div>
            <Input
              placeholder="Skill name"
              value={skillName}
              onChange={(e) => setSkillName(e.target.value)}
              className="mb-2"
            />
          </div>
          
          <div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {skillCategories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Select value={skillLevel} onValueChange={setSkillLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Skill Level" />
              </SelectTrigger>
              <SelectContent>
                {skillLevels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Adding..." : "Add Skill"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddSkill;
