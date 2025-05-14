import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom"; 
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import UserProfile from "../components/UserProfile";
import { supabase } from "../integrations/supabase/client";

const Profile = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchUsername, setSearchUsername] = useState<string | null>(null);
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New state for tab query param
  const [tab, setTab] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    let tabParam = params.get("tab");
    if (tabParam === "skills") {
      tabParam = "talents"; // map "skills" to "talents" for UserProfile tabs
    }
    if (search) {
      setSearchUsername(search);
    } else {
      setSearchUsername(null);
      setNotFound(false);
      setSearchResults([]);
    }
    setTab(tabParam);
  }, [location.search]);

  useEffect(() => {
    if (!searchUsername) {
      setResolvedUserId(userId || null);
    }
  }, [userId, searchUsername]);

  useEffect(() => {
    const fetchUsersByUsername = async (username: string) => {
      setLoading(true);
      console.log("Searching for username:", username);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .or(`username.ilike.%${username}%,full_name.ilike.%${username}%`);

      console.log("Supabase query result:", { data, error });

      if (error || !data || data.length === 0) {
        setNotFound(true);
        setSearchResults([]);
        setResolvedUserId(null);
      } else if (data.length === 1) {
        setResolvedUserId(data[0].id);
        setSearchResults([]);
        setNotFound(false);
      } else {
        setSearchResults(data);
        setResolvedUserId(null);
        setNotFound(false);
      }
      setLoading(false);
    };

    if (searchUsername) {
      fetchUsersByUsername(searchUsername);
    }
  }, [searchUsername]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [resolvedUserId]);

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow pt-24 pb-12">
          <div className="container mx-auto text-center py-20">
            <h2 className="text-3xl font-bold">User not found</h2>
            <p className="mt-4 text-gray-600">No user found with that username.</p>
            <button
              className="mt-6 px-4 py-2 bg-spark text-white rounded hover:bg-spark-dark"
              onClick={() => navigate("/")}
            >
              Go Home
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto">
          {loading && <p>Loading...</p>}
          {!loading && searchResults.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Search Results</h2>
              <ul className="space-y-2">
                {searchResults.map((user) => (
                  <li key={user.id}>
                    <Link 
                      to={`/profile/${user.id}`} 
                      className="text-spark hover:underline"
                    >
                      {user.full_name || user.username} (@{user.username})
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!loading && searchResults.length === 0 && resolvedUserId && (
            <UserProfile key={resolvedUserId} userId={resolvedUserId} initialTab={tab || undefined} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
