export interface TaskItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  tasks: TaskItem[];
  feedbackRequired: boolean;
  userFeedback: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface Manager {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  avatarGradient: string;
  introMessage: string;
  departmentName: string;
}

export interface OnboardingTrack {
  id: string;
  title: string;
  departmentId: string;
  manager: Manager;
  steps: OnboardingStep[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'manager' | 'system';
  text: string;
  timestamp: string;
}
