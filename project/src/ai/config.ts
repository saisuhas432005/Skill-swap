export const AI_API_BASE = process.env.REACT_APP_AI_API_BASE || "https://skill-ai-api-1.onrender.com";

export const API_ENDPOINTS = {
  DETECT_SKILL: AI_API_BASE + "/detect-skill",
  MATCH_SKILL: AI_API_BASE + "/match-skill",
};

export const API_TIMEOUT = Number(process.env.REACT_APP_API_TIMEOUT) || 10000; // 10 seconds timeout
