import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectSkillFromMedia, detectSkillFromText } from "@/ai/skillDetection";
import { isAiServiceAvailable, getConfidenceColorClass } from "@/ai/utils";
import { AI_API_BASE } from "@/ai/config";

const VideoUpload = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAiAvailable, setIsAiAvailable] = useState<boolean | null>(null);
  const [detectedSkill, setDetectedSkill] = useState<string | null>(null);
  const [detectionConfidence, setDetectionConfidence] = useState<number | null>(null);
  const { toast } = useToast();

  // Check AI service availability
  useEffect(() => {
    const checkAiService = async () => {
      const available = await isAiServiceAvailable(AI_API_BASE);
      setIsAiAvailable(available);
      
      if (!available) {
        toast({
          title: "AI Service Unavailable",
          description: "The AI skill detection service is currently unavailable. You can still upload your video.",
          variant: "destructive",
        });
      }
    };
    
    checkAiService();
  }, [toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate if it's a video file
      if (!file.type.startsWith("video/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload a video file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Video must be less than 50MB.",
          variant: "destructive",
        });
        return;
      }
      
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreviewUrl(url);
      
      // Reset any previously detected skills
      setDetectedSkill(null);
      setDetectionConfidence(null);
    }
  };

  const clearVideo = () => {
    if (videoPreviewUrl) {
      URL.revokeObjectURL(videoPreviewUrl);
    }
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setDetectedSkill(null);
    setDetectionConfidence(null);
  };

  const detectSkill = async () => {
    if (!videoFile && !description) {
      toast({
        title: "Missing content",
        description: "Please upload a video or provide a description to detect skills.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Analyzing content",
      description: "Using AI to detect skills in your content...",
    });
    
    try {
      let result;
      
      if (videoFile) {
        result = await detectSkillFromMedia(videoFile, description);
      } else {
        result = await detectSkillFromText(description);
      }
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setDetectedSkill(result.detectedSkill);
      setDetectionConfidence(result.confidence);
      
      if (result.detectedSkill) {
        setTags(result.detectedSkill + (result.category ? `, ${result.category}` : ''));
        
        toast({
          title: "Skill detected",
          description: `We detected "${result.detectedSkill}" with ${Math.round(result.confidence * 100)}% confidence.`,
        });
      } else {
        toast({
          title: "No skills detected",
          description: "We couldn't detect specific skills. Please add tags manually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Detection failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please upload a video to showcase your talent.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title) {
      toast({
        title: "Title required",
        description: "Please provide a title for your video.",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to upload videos.",
        variant: "destructive",
      });
      return;
    }
    
    // Attempt to detect skill if not already done and AI is available
    if (!detectedSkill && isAiAvailable && description) {
      try {
        await detectSkill();
      } catch (error) {
        console.error("Auto-detection error:", error);
        // Continue with upload even if detection fails
      }
    }
    
    // Start upload process
    setIsUploading(true);
    
    try {
      // Get current week and year for OneChance feature
      const now = new Date();
      const year = now.getFullYear();
      const weekNumber = Math.ceil((now.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000));
      
      // Removed weekly upload limit check to allow unlimited uploads
      // const { data: existingVideo, error: checkError } = await supabase
      //   .from('videos')
      //   .select('id')
      //   .eq('user_id', user.id)
      //   .eq('year', year)
      //   .eq('week_number', weekNumber)
      //   .maybeSingle();
      
      // if (checkError) throw checkError;
      
      // if (existingVideo) {
      //   toast({
      //     title: "Weekly upload limit reached",
      //     description: "You've already uploaded a video this week. Try again next week!",
      //     variant: "destructive",
      //   });
      //   setIsUploading(false);
      //   return;
      // }
      
      // Upload video file to Supabase storage
      const fileExt = videoFile.name.split('.').pop();
      const timestamp = Date.now();
      const filePath = `${user.id}/${year}_${weekNumber}_${timestamp}.${fileExt}`;
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);
      
      // Set the correct options for the upload including the owner
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(filePath, videoFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: publicURL } = supabase.storage
        .from('videos')
        .getPublicUrl(filePath);
      
      if (!publicURL) throw new Error("Failed to get video URL");
      
      // Use the detected skill if available, otherwise use the first tag
      const skillToSave = detectedSkill || tags.split(',')[0].trim() || null;
      
      // Save video record to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: title,
          description: description,
          video_url: publicURL.publicUrl,
          year: year,
          week_number: weekNumber,
          detected_skill: skillToSave
        });
      
      if (dbError) throw dbError;
      
      // If we detected a skill and it's not already in the user's profile, offer to add it
      if (skillToSave) {
        const { data: existingSkills } = await supabase
          .from('skills')
          .select('id')
          .eq('user_id', user.id)
          .eq('skill_name', skillToSave);
          
        if (!existingSkills || existingSkills.length === 0) {
          // We'll offer to add this skill to their profile after redirect
          sessionStorage.setItem('detected_skill', skillToSave);
        }
      }
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Success notification
      toast({
        title: "Upload successful!",
        description: "Your talent video has been uploaded. " + 
          (detectedSkill ? `We detected "${detectedSkill}" as your skill.` : ""),
        variant: "default",
      });
      
      // Reset form after a short delay
      setTimeout(() => {
        setIsUploading(false);
        // Redirect to dashboard
        navigate('/dashboard');
      }, 1000);
      
    } catch (error) {
      const e = error as Error;
      toast({
        title: "Upload failed",
        description: e.message || "There was an error uploading your video. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">OneChance Talent Upload</CardTitle>
          <CardDescription>
            Showcase your best talent in a 30-60 second video. You get one chance per week to impress the world!
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {!videoPreviewUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Label
                  htmlFor="video-upload"
                  className="flex flex-col items-center justify-center cursor-pointer space-y-3"
                >
                  <Upload className="h-10 w-10 text-gray-400" />
                  <div className="text-lg font-medium">Upload your talent video</div>
                  <div className="text-sm text-gray-500">
                    30-60 seconds, MP4, MOV or WEBM (max 50MB)
                  </div>
                  <Button type="button" variant="outline" className="mt-2">
                    Select Video
                  </Button>
                </Label>
              </div>
            ) : (
              <div className="relative">
                <video 
                  src={videoPreviewUrl} 
                  controls 
                  className="w-full h-auto rounded-lg"
                ></video>
                <button
                  type="button"
                  onClick={clearVideo}
                  className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded-full hover:bg-black"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <div>
              <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </Label>
              <Input
                id="title"
                placeholder="Give your talent video a title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe your talent and what makes it special..."
                className="resize-none"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            
            {/* AI Detection Section */}
            <div className="border border-dashed border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium">AI Skill Detection</h3>
                
                {isAiAvailable === false && (
                  <div className="flex items-center text-amber-500 text-sm">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span>AI Service Offline</span>
                  </div>
                )}
                
                {isAiAvailable === true && (
                  <div className="flex items-center text-green-500 text-sm">
                    <Check className="h-4 w-4 mr-1" />
                    <span>AI Service Online</span>
                  </div>
                )}
              </div>
              
              {detectedSkill ? (
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm">
                    Detected Skill: <span className="font-medium">{detectedSkill}</span>
                  </p>
                  {detectionConfidence !== null && (
                    <p className="text-sm">
                      Confidence: <span className={`font-medium ${getConfidenceColorClass(detectionConfidence)}`}>
                        {Math.round(detectionConfidence * 100)}%
                      </span>
                    </p>
                  )}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={detectSkill}
                  disabled={(!videoFile && !description) || isAiAvailable === false}
                  className="w-full"
                >
                  Detect Skills from {videoFile ? "Video" : "Description"}
                </Button>
              )}
            </div>
            
            <div>
              <Label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags (separate with commas)
              </Label>
              <Input
                id="tags"
                placeholder="e.g., singing, guitar, music"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Add relevant tags to help others discover your talent.
              </p>
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-spark h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Uploading... {uploadProgress}%
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                clearVideo();
                setTitle("");
                setDescription("");
                setTags("");
                setDetectedSkill(null);
                setDetectionConfidence(null);
              }}
              disabled={isUploading}
            >
              Clear All
            </Button>
            <Button 
              type="submit" 
              className="bg-spark hover:bg-spark-dark" 
              disabled={isUploading || !videoFile || !title}
            >
              {isUploading ? (
                <span className="flex items-center">Processing...</span>
              ) : (
                <span className="flex items-center">
                  <Check className="mr-2 h-4 w-4" /> Submit
                </span>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      <div className="mt-6 bg-spark-purple/10 p-4 rounded-lg">
        <h3 className="font-medium text-spark-dark mb-2">OneChance Guidelines:</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>You can upload one talent video per week</li>
          <li>Videos must be 30-60 seconds in length</li>
          <li>Content must follow our community guidelines</li>
          <li>Our AI will analyze your video to categorize your skill</li>
          <li>Weekly uploads reset every Monday at 12:00 AM UTC</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoUpload;