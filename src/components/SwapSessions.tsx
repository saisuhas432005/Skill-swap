
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Clock, 
  Video, 
  MessageSquare, 
  Star, 
  Check, 
  X,
  ArrowRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

// Define TypeScript types
interface Profile {
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Match {
  id: string;
  request_id: string;
  matched_user_id: string;
  created_at: string;
  status: string;
  match_score: number | null;
  matched_user?: Profile;
  skill_swap_request?: {
    offer_skill: string;
    want_skill: string;
  };
}

interface Session {
  id: string;
  request_id: string;
  match_id: string;
  requester_id: string;
  recipient_id: string;
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  status: string;
  room_id: string | null;
  created_at: string;
  updated_at: string;
  requester_profile?: Profile | null;
  recipient_profile?: Profile | null;
  match?: Match | null;
}

// SwapSessions component
const SwapSessions = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    const fetchSessions = async () => {
      if (!user) return;

      setLoading(true);

      try {
        const { data: requesterSessions, error: requesterError } = await supabase
          .from('swap_sessions')
          .select(`
            *,
            requester_profile:profiles!swap_sessions_requester_id_fkey (username, full_name, avatar_url),
            recipient_profile:profiles!swap_sessions_recipient_id_fkey (username, full_name, avatar_url),
            match:matches!swap_sessions_match_id_fkey (
              id,
              request_id,
              matched_user_id,
              created_at,
              status,
              match_score,
              matched_user:profiles!matches_matched_user_id_fkey (username, full_name, avatar_url),
              skill_swap_request:skill_swap_requests!matches_request_id_fkey (offer_skill, want_skill)
            )
          `)
          .eq('requester_id', user.id);

        if (requesterError) {
          console.error("Error fetching requester sessions:", requesterError);
          toast({
            title: "Error fetching sessions",
            description: requesterError.message,
            variant: "destructive",
          });
        }

        const { data: recipientSessions, error: recipientError } = await supabase
          .from('swap_sessions')
          .select(`
            *,
            requester_profile:profiles!swap_sessions_requester_id_fkey (username, full_name, avatar_url),
            recipient_profile:profiles!swap_sessions_recipient_id_fkey (username, full_name, avatar_url),
            match:matches!swap_sessions_match_id_fkey (
              id,
              request_id,
              matched_user_id,
              created_at,
              status,
              match_score,
              matched_user:profiles!matches_matched_user_id_fkey (username, full_name, avatar_url),
              skill_swap_request:skill_swap_requests!matches_request_id_fkey (offer_skill, want_skill)
            )
          `)
          .eq('recipient_id', user.id);

        if (recipientError) {
          console.error("Error fetching recipient sessions:", recipientError);
          toast({
            title: "Error fetching sessions",
            description: recipientError.message,
            variant: "destructive",
          });
        }

        // Type-safe handling of the returned data
        const allSessionsData = [...(requesterSessions || []), ...(recipientSessions || [])];
        
        // Ensure the data conforms to our Session interface
        const typedSessions: Session[] = allSessionsData.map(sessionData => {
          // Create a properly typed session object
          const session: Session = {
            id: sessionData.id,
            request_id: sessionData.request_id,
            match_id: sessionData.match_id,
            requester_id: sessionData.requester_id,
            recipient_id: sessionData.recipient_id,
            scheduled_at: sessionData.scheduled_at,
            started_at: sessionData.started_at,
            ended_at: sessionData.ended_at,
            status: sessionData.status,
            room_id: sessionData.room_id,
            created_at: sessionData.created_at,
            updated_at: sessionData.updated_at,
            // Safely type the profiles
            requester_profile: sessionData.requester_profile as Profile | null,
            recipient_profile: sessionData.recipient_profile as Profile | null,
            // Safely type the match with its nested properties
            match: sessionData.match ? {
              ...sessionData.match,
              matched_user: sessionData.match.matched_user as Profile,
              skill_swap_request: sessionData.match.skill_swap_request as { 
                offer_skill: string; 
                want_skill: string; 
              }
            } : null
          };
          
          return session;
        });
        
        setSessions(typedSessions);
      } catch (error: any) {
        console.error("Unexpected error fetching sessions:", error);
        toast({
          title: "Unexpected error",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user, toast]);
  
  const handleAcceptSession = async (sessionId: string) => {
    if (!user) return;
  
    try {
      const { error } = await supabase
        .from('swap_sessions')
        .update({ status: 'confirmed' })
        .eq('id', sessionId);
  
      if (error) throw error;
  
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'confirmed' } 
            : session
        )
      );
  
      toast({
        title: "Session accepted",
        description: "You've successfully accepted the skill swap session.",
      });
    } catch (error: any) {
      console.error("Error accepting session:", error);
      toast({
        title: "Error accepting session",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  
  const handleDeclineSession = async (sessionId: string) => {
    if (!user) return;
  
    try {
      const { error } = await supabase
        .from('swap_sessions')
        .update({ status: 'declined' })
        .eq('id', sessionId);
  
      if (error) throw error;
  
      // Update local state
      setSessions(prevSessions => 
        prevSessions.map(session => 
          session.id === sessionId 
            ? { ...session, status: 'declined' } 
            : session
        )
      );
  
      toast({
        title: "Session declined",
        description: "You've declined the skill swap session.",
      });
    } catch (error: any) {
      console.error("Error declining session:", error);
      toast({
        title: "Error declining session",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredSessions = sessions.filter(session => {
    const isUpcoming = new Date(session.created_at) >= new Date();
    return activeTab === 'upcoming' ? isUpcoming : !isUpcoming;
  });

  if (loading) {
    return <p>Loading sessions...</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <Button 
          variant={activeTab === 'upcoming' ? 'default' : 'outline'}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Sessions
        </Button>
        <Button 
          variant={activeTab === 'past' ? 'default' : 'outline'}
          onClick={() => setActiveTab('past')}
          className="ml-2"
        >
          Past Sessions
        </Button>
      </div>

      {filteredSessions.length === 0 ? (
        <p>No {activeTab} sessions found.</p>
      ) : (
        <div className="grid gap-4">
          {filteredSessions.map(session => {
            const isRequester = session.requester_id === user?.id;
            const partnerProfile = isRequester ? session.recipient_profile : session.requester_profile;
            const offerSkill = session.match?.skill_swap_request?.offer_skill;
            const wantSkill = session.match?.skill_swap_request?.want_skill;
            const sessionTime = session.scheduled_at ? format(parseISO(session.scheduled_at), 'MMM dd, yyyy - hh:mm a') : 'To be scheduled';

            return (
              <Card key={session.id}>
                <CardContent className="relative p-6">
                  <div className="flex items-start">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={partnerProfile?.avatar_url || ""} alt={partnerProfile?.username || "Skill Swapper"} />
                      <AvatarFallback>{partnerProfile?.username?.substring(0, 2).toUpperCase() || "SS"}</AvatarFallback>
                    </Avatar>
                    <div className="ml-4 flex-1">
                      <h3 className="text-lg font-semibold">{partnerProfile?.full_name || partnerProfile?.username || "Skill Swapper"}</h3>
                      <p className="text-sm text-gray-500">
                        {isRequester ? `Teaching ${offerSkill} and learning ${wantSkill}` : `Learning ${offerSkill} and teaching ${wantSkill}`}
                      </p>
                      <div className="mt-2 flex items-center text-gray-600">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>{sessionTime}</span>
                      </div>
                    </div>
                    
                    {session.status === 'pending' && (
                      <div className="absolute top-4 right-4 flex space-x-2">
                        <Button variant="ghost" size="icon" onClick={() => handleAcceptSession(session.id)}>
                          <Check className="h-4 w-4 text-green-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeclineSession(session.id)}>
                          <X className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                    
                    {session.status === 'confirmed' && (
                      <Badge className="absolute top-4 right-4">Confirmed</Badge>
                    )}
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <Clock className="mr-2 h-4 w-4" />
                      Reschedule
                    </Button>
                    <Button variant="outline" size="sm">
                      <Video className="mr-2 h-4 w-4" />
                      Start Video Call
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Send Message
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SwapSessions;
