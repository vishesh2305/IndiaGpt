export interface User {
  _id: string;
  name: string;
  email: string;
  image?: string;
  language: string;
  location?: { city: string; state: string };
  createdAt: string;
}

export interface UserPreferences {
  language: string;
  voiceMode: "push-to-talk" | "continuous";
  autoTTS: boolean;
  locationEnabled: boolean;
  theme: "light";
}
