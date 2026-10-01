// Ai generated
export interface Match {
  id: string;
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  status: 'LIVE' | 'UPCOMING' | 'FINISHED';
  tournamentName: string;
  date: string;
}

export interface Tournament {
  id: string;
  title: string;
  prizePool: string;
  startDate: string;
  endDate: string;
  status: 'Ongoing' | 'Upcoming' | 'Completed';
}