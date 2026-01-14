
export interface MindMapData {
  name: string;
  children?: MindMapData[];
  description?: string;
}

export interface ClaritySynthesis {
  birdsEyeView: string;
  coreConflict: string;
  keyInsights: string[];
  actionableSteps: string[];
  mindMap: MindMapData;
  mindMapImageUrl?: string;
}

export interface ProbingQuestion {
  id: number;
  question: string;
  answer: string;
}

export enum AppStep {
  INITIAL_INPUT = 'INITIAL_INPUT',
  PROBING = 'PROBING',
  PROCESSING = 'PROCESSING',
  RESULT = 'RESULT'
}
