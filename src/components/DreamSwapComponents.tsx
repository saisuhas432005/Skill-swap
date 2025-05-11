
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, Star, UserRound, Video } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MatchProps {
  matchId: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  teachSkill: string;
  teachLevel: string;
  learnSkill: string;
  learnLevel: string;
  matchScore: number;
  status: string;
}

// Match Card Component
export const MatchCard = ({ match }: { match: MatchProps }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleRequestSwap = async () => {
    try {
      // Create a swap request in the database
      const { error } = await supabase.from('skill_swap_requests').insert({
        user_id: user?.id,
        offer_skill: match.learnSkill, // We offer what they want to learn
        want_skill: match.teachSkill, // We want what they teach
        status: 'pending'
      });
      
      if (error) throw error;
      
      // Create a match to connect the user with the matched person
      await supabase.from('matches').insert({
        request_id: match.matchId,
        matched_user_id: match.userId,
        match_score: match.matchScore,
        status: 'pending'
      });
      
      toast({
        title: "Swap requested",
        description: `You've requested a skill swap with ${match.name}. You'll be notified when they respond.`,
      });
    } catch (error) {
      console.error("Error requesting swap:", error);
      toast({
        title: "Request failed",
        description: "There was a problem sending your swap request. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card className="overflow-hidden">
      <div className="md:flex">
        <div className="md:w-1/3 bg-gradient-to-br from-spark-purple/10 to-spark-blue/10 p-6 flex flex-col items-center justify-center">
          <Avatar className="h-20 w-20 mb-4">
            <AvatarImage src={match.avatarUrl} />
            <AvatarFallback>
              <UserRound className="h-10 w-10" />
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg">{match.name}</h3>
          <div className="mt-4 bg-white/70 px-3 py-1 rounded-full flex items-center">
            <Star className="h-4 w-4 text-yellow-500 mr-1" />
            <span className="text-sm font-medium text-spark-dark">
              {match.matchScore}% Match
            </span>
          </div>
        </div>
        
        <div className="md:w-2/3 p-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="bg-spark-purple/10 border-spark-purple/20">
              Teaches: {match.teachSkill} ({match.teachLevel})
            </Badge>
            <Badge variant="outline" className="bg-spark-blue/10 border-spark-blue/20">
              Wants to learn: {match.learnSkill} ({match.learnLevel})
            </Badge>
          </div>
          
          <p className="text-gray-600 mb-6">
            This user is a great match for your skills! They can teach you {match.teachSkill} and are interested in learning {match.learnSkill}.
          </p>
          
          <Button 
            className="bg-gradient-to-r from-spark-purple to-spark-blue hover:opacity-90"
            onClick={handleRequestSwap}
            disabled={match.status !== 'available'}
          >
            {match.status === 'available' 
              ? 'Request Skill Swap' 
              : match.status === 'pending' 
              ? 'Request Sent' 
              : 'Already Connected'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Session Card Component
export const SessionCard = ({ 
  sessionId, 
  partnerName, 
  partnerAvatar, 
  scheduledTime, 
  duration,
  skill,
  status
}: { 
  sessionId: string;
  partnerName: string;
  partnerAvatar?: string;
  scheduledTime: Date;
  duration: number;
  skill: string;
  status: 'upcoming' | 'completed' | 'canceled';
}) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Use the correct badge variants that are available in the shadcn/ui Badge component
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'canceled':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={partnerAvatar} />
              <AvatarFallback>
                <UserRound className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{partnerName}</CardTitle>
              <CardDescription>{skill}</CardDescription>
            </div>
          </div>
          <Badge variant={getBadgeVariant(status)}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center mb-2">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="text-sm">{formatDate(scheduledTime)}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2" />
          <span className="text-sm">{duration} minutes</span>
        </div>
      </CardContent>
      {status === 'upcoming' && (
        <CardFooter>
          <Button className="w-full bg-spark-purple" variant="default">
            <Video className="h-4 w-4 mr-2" />
            Join Session
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// Credits Component
export const CreditsDisplay = ({ credits }: { credits: number }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Balance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-bold text-center text-spark-purple">
          {credits}
        </div>
        <p className="text-center text-sm text-gray-500 mt-1">
          Earn credits by teaching, spend them by learning
        </p>
      </CardContent>
    </Card>
  );
};

// Reviews Component
export const ReviewsList = ({ reviews }: { reviews: any[] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Reviews</CardTitle>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 my-4">No reviews yet</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-3 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={review.giver_avatar} />
                      <AvatarFallback>
                        <UserRound className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{review.giver_name}</span>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{review.comment}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// DreamSwap Dashboard Component for ./pages/DreamSwapDashboard.tsx
export const DreamSwapDashboardContent = () => {
  const [activeTab, setActiveTab] = useState("matches");
  const { user } = useAuth();
  
  // Placeholder data - in a real app, you'd fetch from your database
  const dummyMatches = [
    {
      matchId: '1',
      userId: '123',
      name: 'Alex Chen',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      teachSkill: 'JavaScript',
      teachLevel: 'Advanced',
      learnSkill: 'Spanish',
      learnLevel: 'Beginner',
      matchScore: 95,
      status: 'available'
    },
    {
      matchId: '2',
      userId: '456',
      name: 'Taylor Kim',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      teachSkill: 'Photography',
      teachLevel: 'Intermediate',
      learnSkill: 'Guitar',
      learnLevel: 'Beginner',
      matchScore: 85,
      status: 'pending'
    }
  ];

  const dummySessions = [
    {
      sessionId: '1',
      partnerName: 'Alex Chen',
      partnerAvatar: 'https://i.pravatar.cc/150?img=1',
      scheduledTime: new Date(Date.now() + 86400000), // Tomorrow
      duration: 60,
      skill: 'JavaScript Basics',
      status: 'upcoming' as const
    },
    {
      sessionId: '2',
      partnerName: 'Jordan Lee',
      partnerAvatar: 'https://i.pravatar.cc/150?img=3',
      scheduledTime: new Date(Date.now() - 86400000), // Yesterday
      duration: 45,
      skill: 'React Hooks',
      status: 'completed' as const
    }
  ];

  const dummyReviews = [
    {
      id: '1',
      giver_name: 'Jordan Lee',
      giver_avatar: 'https://i.pravatar.cc/150?img=3',
      rating: 5,
      comment: 'Great teacher! Explained React concepts very clearly.'
    },
    {
      id: '2',
      giver_name: 'Sam Johnson',
      giver_avatar: 'https://i.pravatar.cc/150?img=4',
      rating: 4,
      comment: 'Very knowledgeable and patient.'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>DreamSwap Dashboard</CardTitle>
            <CardDescription>
              Find skill exchange partners, schedule sessions, and grow your knowledge
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center mb-6">
              <Button className="bg-gradient-to-r from-spark-purple to-spark-blue hover:opacity-90 transition-opacity">
                Find My Perfect Match
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <CreditsDisplay credits={10} />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="matches">My Matches</TabsTrigger>
          <TabsTrigger value="sessions">Upcoming Sessions</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>
        
        <TabsContent value="matches" className="space-y-4">
          {dummyMatches.map(match => (
            <MatchCard key={match.matchId} match={match} />
          ))}
        </TabsContent>
        
        <TabsContent value="sessions">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dummySessions
              .filter(s => s.status === 'upcoming')
              .map(session => (
                <SessionCard key={session.sessionId} {...session} />
              ))}
            {dummySessions.filter(s => s.status === 'upcoming').length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <p className="text-gray-500">No upcoming sessions</p>
                  <Button variant="link" className="mt-2">Find a match</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dummySessions
              .filter(s => s.status === 'completed')
              .map(session => (
                <SessionCard key={session.sessionId} {...session} />
              ))}
            {dummySessions.filter(s => s.status === 'completed').length === 0 && (
              <Card className="col-span-full">
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <p className="text-gray-500">No past sessions</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="reviews">
          <ReviewsList reviews={dummyReviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
