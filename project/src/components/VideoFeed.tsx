
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share2, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import * as z from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";

type VideoWithUser = {
  id: string;
  title: string;
  description: string | null;
  video_url: string;
  created_at: string;
  detected_skill: string | null;
  user: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  like_count?: number;
  comment_count?: number;
  user_has_liked?: boolean;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    username: string;
    avatar_url: string | null;
  };
};

const commentSchema = z.object({
  comment: z.string().min(1, "Comment cannot be empty")
});

const VideoFeed = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const { toast } = useToast();
  
  const commentForm = useForm({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      comment: ""
    }
  });

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      // Fetch videos with user profiles joined
      const { data: videosData, error } = await supabase
        .from("videos")
        .select(`
          id, 
          title, 
          description, 
          video_url, 
          created_at,
          detected_skill,
          user_id,
          profiles (id, username, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedVideos: VideoWithUser[] = videosData.map(video => ({
        id: video.id,
        title: video.title,
        description: video.description,
        video_url: video.video_url,
        created_at: video.created_at,
        detected_skill: video.detected_skill,
        user: {
          id: video.profiles.id,
          username: video.profiles.username,
          full_name: video.profiles.full_name,
          avatar_url: video.profiles.avatar_url
        }
      }));

      // Add likes and comments counts
      await Promise.all([
        fetchLikesForVideos(formattedVideos),
        fetchCommentsCountForVideos(formattedVideos)
      ]);

      setVideos(formattedVideos);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Failed to load videos",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchLikesForVideos = async (videos: VideoWithUser[]) => {
    try {
      for (const video of videos) {
        // Get total like count
        const { count, error } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", video.id);
          
        if (error) throw error;
        
        video.like_count = count || 0;
        
        // Check if current user has liked
        if (user) {
          const { data, error: likeError } = await supabase
            .from("likes")
            .select("id")
            .eq("video_id", video.id)
            .eq("user_id", user.id)
            .maybeSingle();
            
          if (likeError) throw likeError;
          
          video.user_has_liked = !!data;
        }
      }
    } catch (error) {
      console.error("Error fetching likes:", error);
    }
  };
  
  const fetchCommentsCountForVideos = async (videos: VideoWithUser[]) => {
    try {
      for (const video of videos) {
        // Get comment count
        const { count, error } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("video_id", video.id);
          
        if (error) throw error;
        
        video.comment_count = count || 0;
      }
    } catch (error) {
      console.error("Error fetching comment counts:", error);
    }
  };

  const formatTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const secondsAgo = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (secondsAgo < 60) return "just now";
    if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
    if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`;
    return `${Math.floor(secondsAgo / 86400)}d ago`;
  };
  
  const handleLike = async (videoId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to like videos",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const video = videos.find(v => v.id === videoId);
      if (!video) return;
      
      if (video.user_has_liked) {
        // Unlike
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("video_id", videoId)
          .eq("user_id", user.id);
          
        if (error) throw error;
        
        setVideos(videos.map(v => {
          if (v.id === videoId) {
            return {
              ...v,
              like_count: (v.like_count || 0) - 1,
              user_has_liked: false
            };
          }
          return v;
        }));
      } else {
        // Like
        const { error } = await supabase
          .from("likes")
          .insert({
            video_id: videoId,
            user_id: user.id
          });
          
        if (error) throw error;
        
        setVideos(videos.map(v => {
          if (v.id === videoId) {
            return {
              ...v,
              like_count: (v.like_count || 0) + 1,
              user_has_liked: true
            };
          }
          return v;
        }));
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      toast({
        title: "Action failed",
        description: "Could not update like status",
        variant: "destructive",
      });
    }
  };
  
  const openComments = async (videoId: string) => {
    setActiveVideo(videoId);
    setLoadingComments(true);
    
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      
      const formattedComments: Comment[] = data.map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        user_id: comment.user_id,
        user: {
          username: comment.profiles.username,
          avatar_url: comment.profiles.avatar_url
        }
      }));
      
      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Failed to load comments",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoadingComments(false);
    }
  };
  
  const submitComment = async (values: z.infer<typeof commentSchema>) => {
    if (!user || !activeVideo) return;
    
    try {
      const { error } = await supabase
        .from("comments")
        .insert({
          video_id: activeVideo,
          user_id: user.id,
          content: values.comment
        });
        
      if (error) throw error;
      
      // Add new comment to list
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();
        
      const newComment: Comment = {
        id: `temp-${Date.now()}`,
        content: values.comment,
        created_at: new Date().toISOString(),
        user_id: user.id,
        user: {
          username: profileData?.username || "Anonymous",
          avatar_url: profileData?.avatar_url
        }
      };
      
      setComments([newComment, ...comments]);
      
      // Update comment count on video
      setVideos(videos.map(v => {
        if (v.id === activeVideo) {
          return {
            ...v,
            comment_count: (v.comment_count || 0) + 1
          };
        }
        return v;
      }));
      
      // Reset form
      commentForm.reset();
      
      toast({
        title: "Comment added",
        description: "Your comment has been posted",
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Failed to post comment",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };
  
  const shareVideo = (video: VideoWithUser) => {
    // For now, just simulate sharing
    toast({
      title: "Sharing video",
      description: `You shared "${video.title}" with your followers`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="overflow-hidden">
            <CardHeader className="p-4">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[100px]" />
                </div>
              </div>
            </CardHeader>
            <Skeleton className="h-[400px] w-full" />
            <CardFooter className="p-4">
              <div className="w-full space-y-2">
                <div className="flex space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                <Skeleton className="h-4 w-[300px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="text-xl font-medium mb-2">No videos yet</h3>
        <p className="text-muted-foreground mb-6">
          Be the first to upload and showcase your talent!
        </p>
        <Button 
          onClick={() => window.location.href = "/upload"}
          className="bg-spark hover:bg-spark-dark"
        >
          Upload Your Talent
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {videos.map((video) => (
        <Card key={video.id} className="overflow-hidden">
          <CardHeader className="p-4">
            <Link 
              to={`/profile/${video.user.id}`} 
              className="flex items-center space-x-4"
            >
              <Avatar>
                <AvatarImage src={video.user.avatar_url || ""} alt={video.user.username} />
                <AvatarFallback>
                  {video.user.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{video.user.username}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimeSince(video.created_at)}
                </p>
              </div>
              {video.detected_skill && (
                <div className="ml-auto bg-spark/10 text-spark-dark px-3 py-1 rounded-full text-xs font-medium">
                  {video.detected_skill}
                </div>
              )}
            </Link>
          </CardHeader>
          <div className="relative bg-black">
            <video 
              src={video.video_url} 
              controls 
              className="w-full max-h-[500px] object-contain"
              poster={video.video_url + "?poster=true"}
            />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
              <Play className="h-20 w-20 text-white opacity-80" />
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium">{video.title}</h3>
            {video.description && (
              <p className="text-muted-foreground text-sm mt-1">{video.description}</p>
            )}
          </CardContent>
          <CardFooter className="p-4 pt-0 flex justify-between">
            <div className="flex space-x-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className={`rounded-full ${video.user_has_liked ? 'text-red-500 hover:text-red-600' : ''}`}
                onClick={() => handleLike(video.id)}
              >
                <Heart className={`h-5 w-5 ${video.user_has_liked ? 'fill-red-500' : ''}`} />
                {video.like_count !== undefined && video.like_count > 0 && (
                  <span className="ml-1 text-xs">{video.like_count}</span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => openComments(video.id)}
              >
                <MessageCircle className="h-5 w-5" />
                {video.comment_count !== undefined && video.comment_count > 0 && (
                  <span className="ml-1 text-xs">{video.comment_count}</span>
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full"
                onClick={() => shareVideo(video)}
              >
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      ))}
      
      {/* Comments Dialog */}
      <Dialog open={!!activeVideo} onOpenChange={(open) => !open && setActiveVideo(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          
          {user && (
            <Form {...commentForm}>
              <form onSubmit={commentForm.handleSubmit(submitComment)} className="space-y-2">
                <FormField
                  control={commentForm.control}
                  name="comment"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="flex gap-2">
                          <Textarea
                            placeholder="Write a comment..."
                            className="resize-none flex-1"
                            {...field}
                          />
                          <Button type="submit" className="self-end bg-spark hover:bg-spark-dark">
                            Post
                          </Button>
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
          
          <div className="max-h-[300px] overflow-y-auto space-y-4">
            {loadingComments ? (
              <div className="space-y-4 py-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map(comment => (
                <div key={comment.id} className="flex gap-2">
                  <Link to={`/profile/${comment.user_id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user.avatar_url || ""} />
                      <AvatarFallback>
                        {comment.user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div>
                    <Link to={`/profile/${comment.user_id}`} className="text-sm font-medium hover:underline">
                      {comment.user.username}
                    </Link>
                    <p className="text-sm">{comment.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeSince(comment.created_at)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveVideo(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoFeed;
