export type MatchStage = 'group' | 'round_32' | 'round_16' | 'quarter' | 'semi' | 'final';

export type DecisionType = 'regular' | 'extra_time' | 'penalties';

export interface Goal {
  id: string;
  minute: number;
  player: string;
  team: string;
  assistPlayer?: string;
}

export interface Match {
  id: number; // 1 to 103
  stage: MatchStage;
  roundNumber?: number; // 1, 2, 3 for group stage
  roundLabel: string; // 'Rodada 1', 'Rodada 2', 'Rodada 3', '16-Avos de Final', etc.
  group?: string; // 'A' to 'L' for group matches
  
  // Teams
  homeTeam: string;
  awayTeam: string;
  userControls: string; // Exact team the user controls
  
  // For knockout placeholder tracking
  homePlaceholder?: string; // e.g. "1º A", "Vencedor Jogo 1"
  awayPlaceholder?: string; // e.g. "2º I", "Vencedor Jogo 14"
  userControlsPlaceholder?: string; // e.g. "2º Grupo I", "Vencedor Jogo 14"
  
  // Score & results
  homeScore?: number;
  awayScore?: number;
  goals: Goal[];
  isFinished: boolean;
  
  // Knockout tiebreaker
  winnerTeam?: string;
  decisionType?: DecisionType;
  homePenalties?: number;
  awayPenalties?: number;
  
  updatedAt?: string;
}

export interface GroupStanding {
  position: number;
  group: string;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  status: 'qualified_top2' | 'qualified_best3' | 'eliminated_3rd' | 'eliminated_4th' | 'pending';
  bestThirdRank?: number; // 1 to 8 if among best 3rds
}

export interface PlayerTeamBreakdown {
  team: string;
  goals: number;
  assists: number;
  contributions: number;
  matchesPlayed: number;
  avgGoals: number;
  avgAssists: number;
}

export interface PlayerGoalEvent {
  matchId: number;
  roundLabel: string;
  stage: MatchStage;
  team: string;
  opponent: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  minute: number;
  assistPlayer?: string;
  isPenalty?: boolean;
}

export interface PlayerAssistEvent {
  matchId: number;
  roundLabel: string;
  stage: MatchStage;
  team: string;
  opponent: string;
  homeTeam: string;
  awayTeam: string;
  homeScore?: number;
  awayScore?: number;
  minute: number;
  scorer: string;
}

export interface PlayerProfile {
  name: string;
  teams: string[];
  primaryTeam: string;
  goals: number;
  assists: number;
  contributions: number;
  matchesPlayed: number;
  avgGoals: number;
  avgAssists: number;
  avgContributions: number;
  byTeam: PlayerTeamBreakdown[];
  goalEvents: PlayerGoalEvent[];
  assistEvents: PlayerAssistEvent[];
}

export interface PlayerStat {
  player: string;
  team: string; // Ex: "Liverpool / Holanda" or single team
  teams: string[]; // List of all teams
  goals: number;
  assists: number;
  contributions: number;
  matchesPlayed: number;
  avgGoals: number;
  avgAssists: number;
  avgContributions: number;
  byTeam?: PlayerTeamBreakdown[];
}

export interface TeamScorerItem {
  player: string;
  goals: number;
  assists: number;
  contributions: number;
}

export interface TeamProfile {
  team: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
  winRate: number;
  matches: Array<{
    match: Match;
    opponent: string;
    isHome: boolean;
    result: 'win' | 'draw' | 'loss' | 'pending';
    scoreText: string;
    teamGoals: Goal[];
  }>;
  scorers: TeamScorerItem[];
}

export interface TeamStat {
  team: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  avgGoalsFor: number;
  avgGoalsAgainst: number;
}

export interface TeamInfo {
  name: string;
  shortName: string;
  type: 'club' | 'national' | 'classic' | 'allstar';
  colors: {
    primary: string;
    secondary: string;
    text: string;
    border: string;
  };
  country?: string;
}
