
import { API_ENDPOINTS, API_TIMEOUT } from './config';

/**
 * Represents the response from the skill detection API
 */
export interface SkillDetectionResponse {
  detectedSkill: string;
  confidence: number;
  relatedSkills?: string[];
  category?: string;
  error?: string;
}

/**
 * Detects skills from video URL
 * 
 * @param videoUrl - URL of the video to analyze
 * @param text - Optional text description to help with detection
 * @returns Promise with the detected skill information
 */
export async function detectSkillFromVideoUrl(
  videoUrl: string,
  text?: string
): Promise<SkillDetectionResponse> {
  try {
    // Set up AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    // Make the API request
    const response = await fetch(API_ENDPOINTS.DETECT_SKILL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        video_url: videoUrl,
        description: text 
      }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return {
      detectedSkill: data.detected_skill || '',
      confidence: data.confidence || 0.8,
      category: data.category,
      relatedSkills: data.related_skills
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        detectedSkill: '',
        confidence: 0,
        error: 'Request timed out. The AI service might be unavailable.',
      };
    }
    
    console.error('Skill detection error:', error);
    return {
      detectedSkill: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Detects skills from various media types
 * 
 * @param file - Video, audio, or text file to analyze
 * @param text - Optional text description to help with detection
 * @returns Promise with the detected skill information
 */
export async function detectSkillFromMedia(
  file: File,
  text?: string
): Promise<SkillDetectionResponse> {
  try {
    // Create a FormData object to send the file and text
    const formData = new FormData();
    formData.append('file', file);
    
    if (text) {
      formData.append('description', text);
    }
    
    // Set up AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    // Make the API request
    const response = await fetch(API_ENDPOINTS.DETECT_SKILL, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return {
      detectedSkill: data.detected_skill || '',
      confidence: data.confidence || 0.8,
      category: data.category,
      relatedSkills: data.related_skills
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        detectedSkill: '',
        confidence: 0,
        error: 'Request timed out. The AI service might be unavailable.',
      };
    }
    
    console.error('Skill detection error:', error);
    return {
      detectedSkill: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Detects skills from text description only
 * 
 * @param text - Text description to analyze
 * @returns Promise with the detected skill information
 */
export async function detectSkillFromText(text: string): Promise<SkillDetectionResponse> {
  try {
    // Set up AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
    
    // Make the API request
    const response = await fetch(API_ENDPOINTS.DETECT_SKILL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description: text }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    return {
      detectedSkill: data.detected_skill || '',
      confidence: data.confidence || 0.8,
      category: data.category,
      relatedSkills: data.related_skills
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return {
        detectedSkill: '',
        confidence: 0,
        error: 'Request timed out. The AI service might be unavailable.',
      };
    }
    
    console.error('Skill detection error:', error);
    return {
      detectedSkill: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
