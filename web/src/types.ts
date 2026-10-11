export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  hasVoted: boolean;
}

export interface AuthResult {
  token: string;
  user: AuthUser;
}

export interface PollOption {
  id: string;
  label: string;
  colour: string | null;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
}

export interface OptionResult {
  optionId: string;
  label: string;
  colour: string | null;
  votes: number;
  percentage: number;
}

export interface ResultsPayload {
  pollId: string;
  question: string;
  total: number;
  results: OptionResult[];
  source: 'cache' | 'database';
}

export interface AdminStats {
  totalUsers: number;
  totalVotes: number;
  turnout: number;
  queueDepth: number;
  results: ResultsPayload;
  recentVotes: { voter: string; option: string; at: string }[];
}
