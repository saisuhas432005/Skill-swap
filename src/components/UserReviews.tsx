
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { format } from "date-fns";

type Review = {
  id: string;
  reviewer_id: string;
  reviewed_id: string;
  session_id: string | null;
  rating: number;
  review_text: string | null;
  badges: string[] | null;
  created_at: string;
  reviewer: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

type UserReviewsProps = {
  userId?: string;
  limit?: number;
  showTitle?: boolean;
};

const UserReviews = ({ userId, limit, showTitle = true }: UserReviewsProps) => {
  const { userId: profileId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  
  const targetUserId = userId || profileId || user?.id;
  
  useEffect(() => {
    if (targetUserId) {
      fetchReviews();
    }
  }, [targetUserId]);
  
  const fetchReviews = async () => {
    if (!targetUserId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviewer_id(username, full_name, avatar_url)
        `)
        .eq('reviewed_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(limit || 50);
      
      if (error) throw error;
      
      if (data) {
        // Ensure the data matches our Review type
        const typedReviews: Review[] = data.map(review => ({
          ...review,
          reviewer: review.reviewer || null,
          badges: review.badges as string[] || null
        }));
        setReviews(typedReviews);
        
        if (typedReviews.length > 0) {
          const totalRating = typedReviews.reduce((sum, review) => sum + review.rating, 0);
          setAverageRating(totalRating / typedReviews.length);
        }
      }
    } catch (error: any) {
      console.error("Error fetching reviews:", error);
      toast({
        title: "Error loading reviews",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-3">
                <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/5"></div>
                </div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (reviews.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium text-gray-700 mb-2">No reviews yet</h3>
        <p className="text-gray-500">
          This user hasn't received any reviews for their skill swap sessions.
        </p>
      </div>
    );
  }
  
  // Removed the duplicate StarRating component that was here
  
  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reviews</h3>
          {averageRating !== null && (
            <div className="flex items-center space-x-2">
              <StarRating rating={Math.round(averageRating)} />
              <span className="text-sm font-medium">
                {averageRating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>
      )}
      
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4 mb-3">
                <Avatar>
                  {review.reviewer?.avatar_url ? (
                    <AvatarImage src={review.reviewer.avatar_url} alt={review.reviewer.full_name || review.reviewer.username} />
                  ) : (
                    <AvatarFallback>
                      {(review.reviewer?.full_name || review.reviewer?.username || "User").substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="font-medium">
                    {review.reviewer?.full_name || review.reviewer?.username || "User"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {format(new Date(review.created_at), "MMM d, yyyy")}
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <StarRating rating={review.rating} />
              </div>
              
              {review.review_text && (
                <p className="text-sm text-gray-700 mb-3">
                  {review.review_text}
                </p>
              )}
              
              {review.badges && review.badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {review.badges.map(badge => (
                    <Badge key={badge} variant="outline" className="bg-spark-purple/10 text-spark-dark border-spark-purple/20">
                      {badge}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default UserReviews;
