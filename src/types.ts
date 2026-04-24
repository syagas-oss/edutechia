export interface Activity {
  title: string;
  objective?: string;
  description?: string;
  duration?: string;
  estimated_time_minutes?: number | string;
  passage?: string;
  questions?: string[];
  steps?: string[];
  instructions?: string[];
  adaptations?: string[];
  difficulty_level?: string;
  assessment?: string[];
  resources_required?: string[];
  closure?: string;
}

export interface WebhookResponse {
  type: "clarification" | "final_activity" | "error";
  message: string;
  missingFields?: string[];
  profile?: any;
  activity?: Activity;
}

export interface ContextData {
  stage?: string;
  subject?: string;
  duration?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  type: 'text' | 'activity' | 'error';
  activityData?: Activity;
  contextData?: ContextData;
  timestamp: string;
}
