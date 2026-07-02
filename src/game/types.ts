export interface Team {
  id: string;
  name: string;
  emoji: string;
  colour: string;
  score: number;
}

export interface Player {
  name: string;
  teamId: string;
}

export interface GameState {
  gameName: string;
  currentLocation: number;
  currentChallenge?: string;
  teams: Team[];
  players: Player[];
}
