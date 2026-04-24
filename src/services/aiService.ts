import { API_CONFIG } from "../config/api";
import { getSessionId } from "../lib/storage";
import { Activity, ProviderMeta } from "../types";

type LabAction =
  | "expert_debate"
  | "stress_test"
  | "curriculum_mapping"
  | "parent_summary"
  | "critic_mirror";

interface LabSuccessResponse<T> {
  ok: true;
  type: LabAction | string;
  data: T;
  message?: string;
  aiProviderStatus?: ProviderMeta["aiProviderStatus"];
  usedFallback?: boolean;
  providerFailureReason?: string;
  responseDiagnostics?: ProviderMeta["responseDiagnostics"];
}

interface LabErrorResponse {
  ok: false;
  type: string;
  data: null;
  message?: string;
  error?: {
    code?: string;
    message?: string;
  };
}

type LabResponse<T> = LabSuccessResponse<T> | LabErrorResponse;

function parseRobustJson(text: string) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
      } catch (e) {}
    }
    const firstBracket = trimmed.indexOf("[");
    const lastBracket = trimmed.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      try {
        return JSON.parse(trimmed.slice(firstBracket, lastBracket + 1));
      } catch (e) {}
    }
    throw error;
  }
}

function extractLabData<T>(payload: unknown): T {
  const response = payload as Partial<LabResponse<T>> | undefined;

  if (!response || typeof response !== "object") {
    throw new Error("n8n returned an empty or invalid lab response.");
  }

  if (response.ok === false) {
    throw new Error(response.error?.message || response.message || "n8n returned a controlled lab error.");
  }

  if (response.usedFallback) {
    console.warn("n8n lab workflow returned degraded fallback:", {
      type: response.type,
      aiProviderStatus: response.aiProviderStatus,
      providerFailureReason: response.providerFailureReason,
      responseDiagnostics: response.responseDiagnostics,
    });
  }

  if ("data" in response && response.data !== undefined) {
    return response.data as T;
  }

  return payload as T;
}

async function callLabAction<T>(action: LabAction, activity: Activity): Promise<T> {
  try {
    const response = await fetch(API_CONFIG.labWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        sessionId: getSessionId(),
        action,
        activity,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`n8n lab webhook error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return extractLabData<T>(data);
  } catch (error) {
    console.error("n8n lab API call failed:", error);
    throw error;
  }
}

export const aiService = {
  async getExpertDebate(activity: Activity) {
    const response = await callLabAction<unknown>("expert_debate", activity);
    return typeof response === "string" ? parseRobustJson(response) : response;
  },

  async getStressTest(activity: Activity) {
    const response = await callLabAction<unknown>("stress_test", activity);
    return typeof response === "string" ? parseRobustJson(response) : response;
  },

  async getCurriculumMapping(activity: Activity) {
    return await callLabAction<string>("curriculum_mapping", activity);
  },

  async getParentSummary(activity: Activity) {
    return await callLabAction<string>("parent_summary", activity);
  },

  async getCriticMirror(activity: Activity) {
    const response = await callLabAction<unknown>("critic_mirror", activity);
    return typeof response === "string" ? parseRobustJson(response) : response;
  },
};
