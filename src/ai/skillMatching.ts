import { AI_API_BASE } from "./config";

export type SkillMatch = {
  userId: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  offeredSkill: string;
  wantedSkill: string;
  matchScore: number;
};

interface ApiMatch {
  id?: string;
  userId?: string;
  name?: string;
  avatar_url?: string | null;
  bio?: string;
  offered_skill: string;
  wanted_skill: string;
  match_score?: number;
}

export async function findSkillMatches(params: {
  offeredSkill: string;
  wantedSkill: string;
  offeredSkillLevel?: string;
  userId: string;
  maxMatches?: number;
}): Promise<{ matches?: SkillMatch[]; error?: unknown }> {
  try {
    const response = await fetch(AI_API_BASE + "/match-skill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        offered_skill: params.offeredSkill,
        wanted_skill: params.wantedSkill
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API Error (${response.status}): ${errorText}` };
    }

    const data = await response.json();

    if (!data.matches) {
      return { error: "No matches found in response" };
    }

    // Map API matches to SkillMatch type
    const matches: SkillMatch[] = data.matches.slice(0, params.maxMatches || 5).map((match: ApiMatch) => ({
      userId: match.id || match.userId || "",
      fullName: match.name,
      avatarUrl: match.avatar_url || null,
      bio: match.bio || "",
      offeredSkill: match.offered_skill,
      wantedSkill: match.wanted_skill,
      matchScore: match.match_score || 0,
    }));

    return { matches };
  } catch (error: unknown) {
    return { error };
  }
}

export async function detectSkill(videoUrl: string): Promise<{ detected_skill?: string; error?: unknown }> {
  try {
    const response = await fetch(AI_API_BASE + "/detect-skill", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ video_url: videoUrl })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API Error (${response.status}): ${errorText}` };
    }

    const data = await response.json();

    return { detected_skill: data.detected_skill };
  } catch (error: unknown) {
    return { error };
  }
}
