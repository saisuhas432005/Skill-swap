
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ExternalLink, Play, Youtube } from "lucide-react";

type VideoRecommendation = {
  id: string;
  skill_name: string;
  video_title: string;
  video_url: string;
  type: string;
  thumbnail_url: string | null;
  description: string | null;
  created_at: string;
};

const SkillVideoRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [learnVideos, setLearnVideos] = useState<VideoRecommendation[]>([]);
  const [improveVideos, setImproveVideos] = useState<VideoRecommendation[]>([]);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  useEffect(() => {
    if (profileData) {
      fetchVideoRecommendations();
    }
  }, [profileData]);

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
  
  const fetchVideoRecommendations = async () => {
    try {
      setLoading(true);
      
      const offeredSkills = profileData?.offered_skills || [];
      const wantedSkills = profileData?.wanted_skills || [];
      
      if (offeredSkills.length > 0) {
        // Fetch videos for skills the user offers (to improve)
        const { data: improveData, error: improveError } = await supabase
          .from('videos_recommendations')
          .select('*')
          .in('skill_name', offeredSkills)
          .limit(10);
          
        if (improveError) throw improveError;
        
        setImproveVideos(improveData || []);
      }
      
      if (wantedSkills.length > 0) {
        // Fetch videos for skills the user wants to learn
        const { data: learnData, error: learnError } = await supabase
          .from('videos_recommendations')
          .select('*')
          .in('skill_name', wantedSkills)
          .limit(10);
          
        if (learnError) throw learnError;
        
        setLearnVideos(learnData || []);
      }
      
    } catch (error) {
      console.error('Error fetching video recommendations:', error);
      toast({
        title: 'Failed to load video recommendations',
        description: 'Please try refreshing the page',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleVideoClick = (video: VideoRecommendation) => {
    window.open(video.video_url, '_blank');
  };
  
  // Generate placeholder videos if none are available yet
  const generatePlaceholderVideos = (skill: string, isWanted: boolean) => {
    const placeholders = [];
    
    // Return 3 placeholder videos based on the skill
    for (let i = 1; i <= 3; i++) {
      placeholders.push({
        id: `placeholder-${i}-${skill}`,
        skill_name: skill,
        video_title: `${isWanted ? 'Learn' : 'Improve'} ${skill} - Tutorial ${i}`,
        video_url: `https://www.youtube.com/results?search_query=${skill}+tutorial`,
        type: 'YouTube',
        thumbnail_url: null,
        description: `Recommended ${skill} tutorial for ${isWanted ? 'beginners' : 'intermediate users'}`,
        created_at: new Date().toISOString()
      });
    }
    
    return placeholders;
  };
  
  const renderNoSkillsMessage = (type: 'learn' | 'improve') => (
    <div className="text-center py-12">
      <p className="text-muted-foreground">
        {type === 'learn' 
          ? 'Add skills you want to learn to get video recommendations'
          : 'Add skills you offer to get improvement video recommendations'
        }
      </p>
      <Button 
        className="mt-4"
        onClick={() => window.location.href = '/dashboard?tab=profile'}
      >
        Add Skills
      </Button>
    </div>
  );

  const renderVideoCard = (video: VideoRecommendation) => (
    <Card 
      className="overflow-hidden cursor-pointer h-full"
      onClick={() => handleVideoClick(video)}
    >
      <div className="relative h-40 bg-muted">
        {video.thumbnail_url ? (
          <img 
            src={video.thumbnail_url} 
            alt={video.video_title} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-r from-gray-700 to-gray-900">
            {video.type === 'YouTube' ? (
              <Youtube className="h-12 w-12 text-red-500" />
            ) : (
              <Play className="h-12 w-12 text-white" />
            )}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium truncate">{video.video_title}</h3>
        <p className="text-sm text-muted-foreground mt-1">Skill: {video.skill_name}</p>
        {video.description && (
          <p className="text-sm mt-2 line-clamp-2">{video.description}</p>
        )}
        <div className="flex justify-end mt-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      <Tabs defaultValue="learn">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="learn">Skills to Learn</TabsTrigger>
          <TabsTrigger value="improve">Skills to Improve</TabsTrigger>
        </TabsList>
        
        <TabsContent value="learn" className="pt-4">
          {loading ? (
            <div className="text-center py-8">Loading recommendations...</div>
          ) : profileData?.wanted_skills?.length > 0 ? (
            <div>
              {learnVideos.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {learnVideos.map(video => (
                      <CarouselItem key={video.id} className="md:basis-1/2 lg:basis-1/3">
                        {renderVideoCard(video)}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(profileData.wanted_skills || []).slice(0, 3).flatMap(skill => 
                    generatePlaceholderVideos(skill, true).map(video => (
                      <div key={video.id}>
                        {renderVideoCard(video)}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            renderNoSkillsMessage('learn')
          )}
        </TabsContent>
        
        <TabsContent value="improve" className="pt-4">
          {loading ? (
            <div className="text-center py-8">Loading recommendations...</div>
          ) : profileData?.offered_skills?.length > 0 ? (
            <div>
              {improveVideos.length > 0 ? (
                <Carousel className="w-full">
                  <CarouselContent>
                    {improveVideos.map(video => (
                      <CarouselItem key={video.id} className="md:basis-1/2 lg:basis-1/3">
                        {renderVideoCard(video)}
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(profileData.offered_skills || []).slice(0, 3).flatMap(skill => 
                    generatePlaceholderVideos(skill, false).map(video => (
                      <div key={video.id}>
                        {renderVideoCard(video)}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            renderNoSkillsMessage('improve')
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SkillVideoRecommendations;
