
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const LoggedInUsers = () => {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [followerCount, setFollowerCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchFollowerCount();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
      
    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }
    
    setProfileData(data);
  };
  
  const fetchFollowerCount = async () => {
    if (!user) return;
    
    const { count, error } = await supabase
      .from("followers")
      .select("*", { count: 'exact', head: true })
      .eq("following_id", user.id);
      
    if (error) {
      console.error("Error fetching followers:", error);
      return;
    }
    
    setFollowerCount(count || 0);
  };

  if (!user) {
    return null;
  }

  const userInitials = user.email ? user.email.substring(0, 2).toUpperCase() : "US";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Currently Logged In</CardTitle>
      </CardHeader>
      <CardContent>
        <Link to="/profile" className="block">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarImage 
                src={profileData?.avatar_url || ""} 
                alt={profileData?.username || user.email || "User"} 
              />
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{profileData?.username || user.email}</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="ml-auto">{followerCount} followers</Badge>
            </div>
          </div>
          
          {profileData?.bio && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{profileData.bio}</p>
          )}
        </Link>
      </CardContent>
    </Card>
  );
};

export default LoggedInUsers;
