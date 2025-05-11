import { AI_API_BASE } from "./config";

export async function isAiServiceAvailable(baseUrl: string = AI_API_BASE): Promise<boolean> {
  try {
    const response = await fetch(baseUrl + "/health");
    return response.ok;
  } catch (error) {
    console.error("AI service availability check failed:", error);
    return false;
  }
}

export function getConfidenceColorClass(confidence: number): string {
  if (confidence >= 0.8) {
    return "text-green-600";
  } else if (confidence >= 0.5) {
    return "text-yellow-600";
  } else {
    return "text-red-600";
  }
}
