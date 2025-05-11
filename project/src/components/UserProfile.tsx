
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Edit, Star, Camera, Bell, UserRound, MessageSquare, Heart, Share2, Plus, Check, X, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { useParams } from "react-router-dom";

// Form schemas
const profileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  full_name: z.string().optional(),
  bio: z.string().optional(),
});

const skillSchema = z.object({
  skill_name: z.string().min(2, "Skill name required"),
  skill_level: z.string(),
  category: z.string(),
});

import React from "react";
import CallInitiation from "./CallInitiation";

type UserProfileProps = {
  userId?: string | null;
  initialTab?: string;
};

const UserProfile: React.FC<UserProfileProps> = ({ userId: propUserId, initialTab }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab || "talents");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userSkills, setUserSkills] = useState<any[]>([]);
  const [userUploads, setUserUploads] = useState<any[]>([]);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const { toast } = useToast();
  const params = useParams();
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  // Update activeTab if initialTab prop changes
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);


  React.useEffect(() => {
    console.log("UserProfile useEffect: params.userId=", params.userId, "user.id=", user?.id);
    // Resolve userId prioritizing propUserId, then params.userId, then user.id
    const resolvedUserId = propUserId || params.userId || user?.id || null;
    console.log("UserProfile useEffect: resolved userId=", resolvedUserId);
    setProfileUserId(resolvedUserId);
    setIsCurrentUser(resolvedUserId === user?.id);
    console.log("UserProfile useEffect: isCurrentUser=", resolvedUserId === user?.id);

    if (resolvedUserId) {
      fetchUserProfile(resolvedUserId);
      fetchUserSkills(resolvedUserId);
      fetchUserUploads(resolvedUserId);
      fetchFollowCounts(resolvedUserId);
      checkFollowingStatus(resolvedUserId);
    }
  }, [propUserId, params.userId, user]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload to Supabase Storage
      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("profile_images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from("profile_images")
        .getPublicUrl(filePath);

      if (!publicURL) throw new Error("Could not get public URL");

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicURL.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been updated successfully",
      });

      // Refresh profile data
      fetchUserProfile(user.id);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload profile picture",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Upload to Supabase Storage
      const filePath = `${user.id}/cover_${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("profile_images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from("profile_images")
        .getPublicUrl(filePath);

      if (!publicURL) throw new Error("Could not get public URL");

      // Update profile with new cover image URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          cover_image_url: publicURL.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      toast({
        title: "Cover image updated",
        description: "Your cover image has been updated successfully",
      });

      // Refresh profile data
      fetchUserProfile(user.id);
    } catch (error) {
      console.error("Error uploading cover image:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload cover image",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };
  
  // Forms
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      full_name: "",
      bio: "",
    },
  });
  
  const skillForm = useForm({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      skill_name: "",
      skill_level: "Beginner",
      category: "Other",
    },
  });


  useEffect(() => {
    console.log("UserProfile useEffect: params.userId=", params.userId, "user.id=", user?.id);
    // If a specific user ID is provided in the URL, use that
    // Otherwise use the current logged-in user's ID
    const userId = params.userId || (user?.id || null);
    console.log("UserProfile useEffect: resolved userId=", userId);
    setProfileUserId(userId);
    setIsCurrentUser(userId === user?.id);
    console.log("UserProfile useEffect: isCurrentUser=", userId === user?.id);
    
    if (userId) {
      fetchUserProfile(userId);
      fetchUserSkills(userId);
      fetchUserUploads(userId);
      fetchFollowCounts(userId);
      checkFollowingStatus(userId);
    }
  }, [user, params.userId]);

  const fetchUserProfile = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
        
      if (error) throw error;
      
      setProfileData(data);
      
      // Update form defaults if this is the current user
      if (userId === user?.id) {
        profileForm.reset({
          username: data.username || "",
          full_name: data.full_name || "",
          bio: data.bio || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Failed to load profile",
        description: "Please try refreshing the page",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchUserSkills = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .eq("user_id", userId);
        
      if (error) throw error;
      
      // Filter duplicates by skill_name
      const uniqueSkills = data ? data.filter((skill, index, self) =>
        index === self.findIndex((s) => s.skill_name === skill.skill_name)
      ) : [];
      
      setUserSkills(uniqueSkills);
    } catch (error) {
      console.error("Error fetching skills:", error);
    }
  };
  
  const fetchUserUploads = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      setUserUploads(data || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
    }
  };
  
  const fetchFollowCounts = async (userId: string) => {
    try {
      // Get followers count
      const { count: followersCount, error: followersError } = await supabase
        .from("followers")
        .select("*", { count: 'exact', head: true })
        .eq("following_id", userId);
        
      if (followersError) throw followersError;
      
      setFollowers(followersCount || 0);
      
      // Get following count
      const { count: followingCount, error: followingError } = await supabase
        .from("followers")
        .select("*", { count: 'exact', head: true })
        .eq("follower_id", userId);
        
      if (followingError) throw followingError;
      
      setFollowing(followingCount || 0);
    } catch (error) {
      console.error("Error fetching follow counts:", error);
    }
  };
  
  const checkFollowingStatus = async (userId: string) => {
    if (!user || userId === user.id) return;
    
    try {
      const { data, error } = await supabase
        .from("followers")
        .select("*")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle();
        
      if (error) throw error;
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  };

  const toggleFollow = async () => {
    if (!user || !profileUserId || profileUserId === user.id) return;
    
    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", profileUserId);
          
        if (error) throw error;
        
        setFollowers(prev => Math.max(0, prev - 1));
      } else {
        // Follow
        const { error } = await supabase
          .from("followers")
          .insert({
            follower_id: user.id,
            following_id: profileUserId,
          });
          
        if (error) throw error;
        
        setFollowers(prev => prev + 1);
      }
      
      setIsFollowing(!isFollowing);
      
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing 
          ? `You have unfollowed ${profileData?.username || 'this user'}`
          : `You are now following ${profileData?.username || 'this user'}`,
      });
    } catch (error) {
      console.error("Error toggling follow:", error);
      toast({
        title: "Action failed",
        description: "Could not update following status",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleProfileUpdate = async (values: z.infer<typeof profileSchema>) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: values.username,
          full_name: values.full_name,
          bio: values.bio,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);
        
      if (error) throw error;
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
      
      // Refresh profile data
      fetchUserProfile(user.id);
      setIsEditProfileOpen(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Could not update profile information",
        variant: "destructive",
      });
    }
  };
  
  const handleAddSkill = async (values: z.infer<typeof skillSchema>) => {
    if (!user) return;

    // Normalize category to expected database values
    const categoryMap: Record<string, string> = {
      Music: "Music",
      Programming: "Programming",
      Art: "Art & Design",
      Design: "Art & Design",
      Sports: "Sports",
      Cooking: "Cooking",
      Languages: "Languages",
      Other: "Other",
    };

    const normalizedCategory = categoryMap[values.category] || "Other";

    try {
      const { error } = await supabase
        .from("skills")
        .insert({
          user_id: user.id,
          skill_name: values.skill_name,
          skill_level: values.skill_level.toLowerCase(),
          category: normalizedCategory,
        });

      if (error) {
        console.error("Supabase insert error:", error);
        console.error("Insert values:", {
          user_id: user.id,
          skill_name: values.skill_name,
          skill_level: values.skill_level,
          category: normalizedCategory,
        });
        throw error;
      }

      toast({
        title: "Skill added",
        description: "Your new skill has been added successfully",
      });

      // Reset form and close dialog
      skillForm.reset();
      setIsAddSkillOpen(false);

      // Refresh skills
      fetchUserSkills(user.id);
    } catch (error) {
      console.error("Error adding skill:", error);
      toast({
        title: "Could not add skill",
        description: "There was an error adding your skill",
        variant: "destructive",
      });
    }
  };
  

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <Skeleton className="h-48 w-full rounded-t-lg" />
          <div className="mt-16 px-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-16 w-full mb-4" />
            <div className="flex justify-between">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-800">User not found</h2>
          <p className="text-gray-600 mt-2">
            The requested profile could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <Card className="shadow-md mb-6">
        <div className="relative h-32 md:h-48 bg-gradient-to-r from-spark-purple/30 to-spark-blue/30 rounded-t-lg">
          {profileData.cover_image_url && (
            <img 
              src={profileData.cover_image_url} 
              alt="Cover" 
              className="absolute inset-0 w-full h-full object-cover rounded-t-lg"
            />
          )}
          
          {isCurrentUser && (
            <div className="absolute bottom-2 right-2">
              <label className="cursor-pointer">
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={handleCoverImageUpload} 
                  accept="image/*" 
                  disabled={isUploadingImage}
                />
                <div className="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full">
                  <Edit className="h-4 w-4" />
                </div>
              </label>
            </div>
          )}
          
          <div className="absolute -bottom-16 left-6">
            <div className="relative w-32 h-32 rounded-full">
              <div className="w-32 h-32 rounded-full bg-white p-1 shadow-md">
                {profileData.avatar_url ? (
                  <Avatar className="w-full h-full">
                    <AvatarImage 
                      src={profileData.avatar_url} 
                      alt={profileData.username} 
                      className="rounded-full object-cover"
                    />
                    <AvatarFallback className="text-3xl">
                      {profileData.username?.substring(0, 2).toUpperCase() || "US"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-full h-full rounded-full bg-spark-purple/20 flex items-center justify-center">
                    <UserRound className="h-16 w-16 text-spark-dark" />
                  </div>
                )}
              </div>
              {isCurrentUser && (
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    disabled={isUploadingImage}
                  />
                  <div className="bg-spark hover:bg-spark-dark text-white p-2 rounded-full shadow-md">
                    <Camera className="h-4 w-4" />
                  </div>
                </label>
              )}
            </div>
          </div>
          
          <div className="absolute top-4 right-4 flex space-x-2">
            {isCurrentUser && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditProfileOpen(true)}
                className="bg-white/80 hover:bg-white"
              >
                <Edit className="h-4 w-4 mr-1" /> Edit Profile
              </Button>
            )}
          </div>
        </div>
        
        <CardContent className="pt-20">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            <div>
              <h2 className="text-2xl font-bold">{profileData.full_name || profileData.username}</h2>
              <p className="text-gray-500">@{profileData.username}</p>
              <p className="mt-2 text-gray-700">{profileData.bio || "No bio yet."}</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end space-y-2">
              <div className="flex space-x-4">
                <div className="text-center">
                  <p className="text-lg font-semibold">{followers}</p>
                  <p className="text-sm text-gray-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{following}</p>
                  <p className="text-sm text-gray-500">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold">{userSkills.length}</p>
                  <p className="text-sm text-gray-500">Skills</p>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {!isCurrentUser && user && (
                  <Button 
                    variant={isFollowing ? "outline" : "default"} 
                    className={isFollowing ? "border-spark text-spark-dark" : "bg-spark hover:bg-spark-dark"}
                    onClick={toggleFollow}
                    disabled={isLoadingFollow}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="h-4 w-4 mr-1" /> Following
                      </>
                    ) : (
                      "Follow"
                    )}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    if (profileUserId) {
                      navigate(`/messages?user=${profileUserId}`);
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Removed call initiation UI as per request */}

      <Tabs defaultValue="talents" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 bg-gray-100">
          <TabsTrigger value="talents">Skills & Talents</TabsTrigger>
          <TabsTrigger value="uploads">Uploads</TabsTrigger>
        </TabsList>
        
        <TabsContent value="talents" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {userSkills.map((skill) => (
              <Card key={skill.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    {skill.skill_name}
                  </CardTitle>
                  <CardDescription>{skill.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <Badge 
                      variant="secondary" 
                      className="bg-spark-purple/10 hover:bg-spark-purple/20 text-spark-dark"
                    >
                      {skill.skill_level}
                    </Badge>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${
                            i < (skill.skill_level === "Beginner" ? 1 : skill.skill_level === "Intermediate" ? 3 : 5) 
                              ? "text-yellow-500 fill-yellow-500" 
                              : "text-gray-300"
                          }`} 
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {isCurrentUser && (
              <Card 
                className="border-dashed border-2 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => setIsAddSkillOpen(true)}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-spark-purple/10 flex items-center justify-center mb-3">
                    <Plus className="h-5 w-5 text-spark-dark" />
                  </div>
                  <h3 className="font-medium text-gray-700 mb-1">Add New Skill</h3>
                  <p className="text-sm text-gray-500">Share another talent or skill that you have</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="uploads" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {userUploads.map((upload) => (
              <Card key={upload.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <div className="relative">
                  <video 
                    className="h-40 w-full object-cover" 
                    poster={upload.video_url + "?poster=true"}
                  >
                    <source src={upload.video_url} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button variant="ghost" className="text-white rounded-full p-2">
                      <Play className="h-10 w-10" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-spark-darkest mb-1">{upload.title}</h3>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {new Date(upload.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex items-center gap-3">
                      <Button size="sm" variant="ghost" className="p-1 h-auto">
                        <Heart className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1 h-auto">
                        <MessageSquare className="h-4 w-4 text-gray-600" />
                      </Button>
                      <Button size="sm" variant="ghost" className="p-1 h-auto">
                        <Share2 className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {isCurrentUser && (
              <Card 
                className="border-dashed border-2 hover:bg-gray-50 cursor-pointer transition-colors h-64"
                onClick={() => window.location.href = "/upload"}
              >
                <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
                  <div className="w-12 h-12 rounded-full bg-spark-purple/10 flex items-center justify-center mb-3">
                    <Camera className="h-5 w-5 text-spark-dark" />
                  </div>
                  <h3 className="font-medium text-gray-700 mb-1">Upload New Talent</h3>
                  <p className="text-sm text-gray-500">Share your weekly talent showcase</p>
                  <Button className="mt-4 bg-spark hover:bg-spark-dark">Upload Video</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="full_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself" 
                        className="resize-none" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Share a brief description about yourself and your skills.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Skill Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
            <DialogDescription>
              Add a new skill or talent to your profile.
            </DialogDescription>
          </DialogHeader>
          <Form {...skillForm}>
            <form onSubmit={skillForm.handleSubmit(handleAddSkill)} className="space-y-4">
              <FormField
                control={skillForm.control}
                name="skill_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Piano, JavaScript, Photography" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={skillForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="Music">Music</option>
                        <option value="Programming">Programming</option>
                        <option value="Art">Art</option>
                        <option value="Design">Design</option>
                        <option value="Sports">Sports</option>
                        <option value="Cooking">Cooking</option>
                        <option value="Languages">Languages</option>
                        <option value="Other">Other</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={skillForm.control}
                name="skill_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skill Level</FormLabel>
                    <FormControl>
                      <select 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Add Skill</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserProfile;
