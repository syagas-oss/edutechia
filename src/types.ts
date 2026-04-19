export interface Activity {
  title: string;
  objective: string;
  duration: string;
  steps: string[];
  adaptations: string[];
  assessment: string[];
}

export interface WebhookResponse {
  type: "clarification" | "final_activity" | "error";
  message: string;
  missingFields?: string[];
  profile?: any;
  activity?: Activity;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  type: 'text' | 'activity' | 'error';
  activityData?: Activity;
  timestamp: string;
}
