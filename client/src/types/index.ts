import { 
  TournamentResult, 
  SummaryResult, 
  PlayerLevel, 
  TournamentCategoryType 
} from "@shared/schema";

export interface FileWithPath extends File {
  path?: string;
}

export interface UploadedFile {
  file: FileWithPath;
  id: string;
  name: string;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  parsed?: boolean;
}

export interface CategoryColors {
  [key: string]: {
    bg: string;
    text: string;
    light: string;
  };
}

export const CATEGORY_COLORS: CategoryColors = {
  "PHASE_DAY_1": {
    bg: "bg-primary-500",
    text: "text-primary-800",
    light: "bg-primary-100"
  },
  "PHASE_DAY_2_PLUS": {
    bg: "bg-success-500",
    text: "text-success-800",
    light: "bg-success-100"
  },
  "OTHER_CURRENCY": {
    bg: "bg-warning-500",
    text: "text-warning-800",
    light: "bg-warning-100"
  },
  "OTHER_TOURNAMENTS": {
    bg: "bg-accent-500",
    text: "text-accent-800",
    light: "bg-accent-100"
  }
};

export const CATEGORY_LABELS: Record<TournamentCategoryType, string> = {
  "PHASE_DAY_1": "Phase Day 1",
  "PHASE_DAY_2_PLUS": "Phase Day 2+",
  "OTHER_CURRENCY": "Outras Moedas",
  "OTHER_TOURNAMENTS": "Outros Torneios"
};

export interface HistoryItem {
  id: string;
  date: string;
  totalTournaments: number;
  netProfit: number;
  submittedToPolarize: boolean;
}
