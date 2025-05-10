
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";

type FollowButtonProps = {
  userId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  className?: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
};

const FollowButton = ({
  userId,
  onFollowChange,
  className = "",
  size = "default",
  variant = "outline"
}: FollowButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // Can't follow yourself
  const isCurrentUser = user?.id === userId;

  useEffect(() => {
    if (user && userId) {
      checkFollowStatus();
    }
  }, [user, userId]);

  const checkFollowStatus = async () => {
    if (!user || !userId || isCurrentUser) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .maybeSingle();
        
      if (error) throw error;
      
      setIsFollowing(!!data);
    } catch (error) {
      console.error('Error checking follow status:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFollowToggle = async () => {
    if (!user || isCurrentUser) return;
    
    try {
      setProcessing(true);
      
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        setIsFollowing(false);
        
        toast({
          title: "Unfollowed",
          description: "You are no longer following this user.",
        });
        
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        
        toast({
          title: "Following",
          description: "You are now following this user.",
        });
      }
      
      if (onFollowChange) {
        onFollowChange(isFollowing);
      }
      
    } catch (error) {
      console.error('Error toggling follow status:', error);
      toast({
        title: "Error",
        description: "Failed to update follow status. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };
  
  if (isCurrentUser) {
    return null; // Don't render for current user
  }
  
  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        Loading
      </Button>
    );
  }
  
  return (
    <Button
      variant={isFollowing ? "default" : variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={processing}
      className={className}
    >
      {processing ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : isFollowing ? (
        <UserCheck className="h-4 w-4 mr-2" />
      ) : (
        <UserPlus className="h-4 w-4 mr-2" />
      )}
      {isFollowing ? "Following" : "Follow"}
    </Button>
  );
};

export default FollowButton;
