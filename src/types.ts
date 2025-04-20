export interface CareerPersonality {
  enjoyedSubjects: string;
  dislikedSubjects: string;
  hobbies: string;
  workEnvironment: string;
  motivation: string;
  lifestyle?: string;
}

export interface CareerPathway {
  dreamCareer: string;
  educationLevel: string;
  learningFormat: string;
  selfDescription?: string;
}

export interface ResumeAnalysis {
  resumeText: string;
  jobDescription: string;
}

export type Section = 'explore' | 'pathway' | 'resume';