import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { INITIAL_GROUP_MATCHES } from '../data/initialData';
import {
  DecisionType,
  Goal,
  GroupStanding,
  Match,
  PlayerStat,
  TeamStat,
} from '../types/tournament';
import {
  calculateAllTeamStats,
  calculateBestThirds,
  calculateGroupStandings,
  calculatePlayerStats,
  resolveKnockoutMatches,
} from '../utils/calculator';

interface TournamentContextType {
  matches: Match[];
  groupMatches: Match[];
  knockoutMatches: Match[];
  groupStandings: Record<string, GroupStanding[]>;
  bestThirds: GroupStanding[];
  topScorers: PlayerStat[];
  topAssists: PlayerStat[];
  allTeamStats: TeamStat[];
  leastConceded: TeamStat[];
  mostGoals: TeamStat[];
  nextUnplayedMatch: Match | null;
  nextUserMatch: Match | null;
  knownPlayers: string[];
  totalMatchesPlayed: number;
  totalGoalsScored: number;
  saveMatch: (
    matchId: number,
    data: {
      homeScore: number;
      awayScore: number;
      goals: Goal[];
      winnerTeam?: string;
      decisionType?: DecisionType;
      homePenalties?: number;
      awayPenalties?: number;
    }
  ) => void;
  resetMatch: (matchId: number) => void;
  resetTournament: () => void;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
  seedDemoData: (numMatches?: number) => void;
}

const STORAGE_KEY = 'fifa_tournament_48_data_v2';

const TournamentContext = createContext<TournamentContextType | null>(null);

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Store raw matches data (group results + saved knockout results)
  const [groupMatchesState, setGroupMatchesState] = useState<Match[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.groupMatches && Array.isArray(parsed.groupMatches)) {
          // Merge with initial definitions to ensure no data loss
          return INITIAL_GROUP_MATCHES.map(initM => {
            const found = parsed.groupMatches.find((m: Match) => m.id === initM.id);
            return found ? { ...initM, ...found, goals: Array.isArray(found.goals) ? found.goals : [] } : initM;
          });
        }
      }
    } catch (e) {
      console.error('Error loading tournament data:', e);
    }
    return INITIAL_GROUP_MATCHES;
  });

  const [savedKnockoutData, setSavedKnockoutData] = useState<Record<number, Partial<Match>>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.knockoutData && typeof parsed.knockoutData === 'object') {
          return parsed.knockoutData;
        }
      }
    } catch (e) {
      console.error('Error loading knockout data:', e);
    }
    return {};
  });

  // 1. Group Standings
  const groupStandings = useMemo(() => {
    return calculateGroupStandings(groupMatchesState);
  }, [groupMatchesState]);

  // 2. Best Thirds
  const bestThirds = useMemo(() => {
    return calculateBestThirds(groupStandings);
  }, [groupStandings]);

  // 3. Resolved Knockout Matches (73 to 103)
  const knockoutMatches = useMemo(() => {
    return resolveKnockoutMatches(groupStandings, bestThirds, savedKnockoutData);
  }, [groupStandings, bestThirds, savedKnockoutData]);

  // 4. All Matches
  const matches = useMemo(() => {
    return [...groupMatchesState, ...knockoutMatches];
  }, [groupMatchesState, knockoutMatches]);

  // 5. Stats
  const { topScorers, topAssists } = useMemo(() => {
    return calculatePlayerStats(matches);
  }, [matches]);

  const { allTeamStats, leastConceded, mostGoals } = useMemo(() => {
    return calculateAllTeamStats(matches, groupStandings);
  }, [matches, groupStandings]);

  // 6. Next Matches
  const nextUnplayedMatch = useMemo(() => {
    return matches.find(m => !m.isFinished) || null;
  }, [matches]);

  const nextUserMatch = useMemo(() => {
    return (
      matches.find(m => {
        if (m.isFinished) return false;
        // User controls a specific resolved team (not just placeholder unless that's all there is)
        return Boolean(m.userControls && m.userControls.trim());
      }) || null
    );
  }, [matches]);

  // 7. Known players for autocomplete
  const knownPlayers = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) {
      if (Array.isArray(m.goals)) {
        for (const g of m.goals) {
          if (g?.player && g.player.trim()) set.add(g.player.trim());
          if (g?.assistPlayer && g.assistPlayer.trim()) set.add(g.assistPlayer.trim());
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [matches]);

  // Totals
  const totalMatchesPlayed = useMemo(() => {
    return matches.filter(m => m.isFinished).length;
  }, [matches]);

  const totalGoalsScored = useMemo(() => {
    return matches.reduce((acc, m) => {
      if (m.isFinished) {
        return acc + (m.homeScore || 0) + (m.awayScore || 0);
      }
      return acc;
    }, 0);
  }, [matches]);

  // Persistent Save
  useEffect(() => {
    try {
      const payload = {
        groupMatches: groupMatchesState,
        knockoutData: savedKnockoutData,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving tournament data:', e);
    }
  }, [groupMatchesState, savedKnockoutData]);

  // Action: Save Match Result
  const saveMatch = (
    matchId: number,
    data: {
      homeScore: number;
      awayScore: number;
      goals: Goal[];
      winnerTeam?: string;
      decisionType?: DecisionType;
      homePenalties?: number;
      awayPenalties?: number;
    }
  ) => {
    const updatedAt = new Date().toISOString();

    if (matchId <= 72) {
      // Group match
      setGroupMatchesState(prev =>
        prev.map(m => {
          if (m.id === matchId) {
            let winner: string | undefined = undefined;
            if (data.homeScore > data.awayScore) winner = m.homeTeam;
            else if (data.awayScore > data.homeScore) winner = m.awayTeam;

            return {
              ...m,
              homeScore: data.homeScore,
              awayScore: data.awayScore,
              goals: data.goals,
              isFinished: true,
              winnerTeam: winner,
              decisionType: 'regular',
              updatedAt,
            };
          }
          return m;
        })
      );
    } else {
      // Knockout match
      setSavedKnockoutData(prev => ({
        ...prev,
        [matchId]: {
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          goals: data.goals,
          isFinished: true,
          winnerTeam: data.winnerTeam,
          decisionType: data.decisionType || 'regular',
          homePenalties: data.homePenalties,
          awayPenalties: data.awayPenalties,
          updatedAt,
        },
      }));
    }
  };

  // Action: Reset single match
  const resetMatch = (matchId: number) => {
    if (matchId <= 72) {
      setGroupMatchesState(prev =>
        prev.map(m => {
          if (m.id === matchId) {
            return {
              ...m,
              homeScore: undefined,
              awayScore: undefined,
              goals: [],
              isFinished: false,
              winnerTeam: undefined,
              decisionType: undefined,
              homePenalties: undefined,
              awayPenalties: undefined,
              updatedAt: undefined,
            };
          }
          return m;
        })
      );
    } else {
      setSavedKnockoutData(prev => {
        const copy = { ...prev };
        delete copy[matchId];
        return copy;
      });
    }
  };

  // Action: Reset entire tournament
  const resetTournament = () => {
    setGroupMatchesState(INITIAL_GROUP_MATCHES);
    setSavedKnockoutData({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Export JSON
  const exportData = () => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      groupMatches: groupMatchesState,
      knockoutData: savedKnockoutData,
    };
    return JSON.stringify(data, null, 2);
  };

  // Import JSON
  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.groupMatches && Array.isArray(parsed.groupMatches)) {
        setGroupMatchesState(
          INITIAL_GROUP_MATCHES.map(initM => {
            const found = parsed.groupMatches.find((m: Match) => m.id === initM.id);
            return found ? { ...initM, ...found, goals: Array.isArray(found.goals) ? found.goals : [] } : initM;
          })
        );
        setSavedKnockoutData(parsed.knockoutData || {});
        return true;
      }
    } catch (e) {
      console.error('Import error:', e);
    }
    return false;
  };

  // Demo seed (for test simulation)
  const seedDemoData = (numMatches = 24) => {
    const samplePlayers: Record<string, string[]> = {
      'Porto': ['Taremi', 'Evanilson', 'Galeno', 'Pepê'],
      'Chelsea XI': ['Drogba', 'Hazard', 'Lampard', 'Terry'],
      'Holanda': ['Memphis Depay', 'Gakpo', 'Van Dijk', 'De Jong'],
      'Chelsea': ['Cole Palmer', 'Jackson', 'Enzo Fernández', 'Nkunku'],
      'França': ['Mbappé', 'Griezmann', 'Dembélé', 'Camavinga'],
      'Liverpool': ['Salah', 'Darwin Núñez', 'Luis Díaz', 'Mac Allister'],
      'Atlético Madrid': ['Griezmann', 'Morata', 'De Paul', 'Koke'],
      'Portugal': ['Cristiano Ronaldo', 'Bruno Fernandes', 'Bernardo Silva', 'Rafael Leão'],
      'Bayern': ['Harry Kane', 'Musiala', 'Sané', 'Müller'],
      'Brasil': ['Vinícius Jr.', 'Rodrygo', 'Neymar Jr.', 'Endrick'],
      'Argentina': ['Lionel Messi', 'Julián Álvarez', 'Lautaro Martínez', 'Di María'],
      'Barcelona': ['Lewandowski', 'Lamine Yamal', 'Raphinha', 'Pedri'],
      'Arsenal': ['Saka', 'Martinelli', 'Ødegaard', 'Havertz'],
      'Borussia Dortmund': ['Reus', 'Adeyemi', 'Brandt', 'Sancho'],
      'Itália': ['Chiesa', 'Barella', 'Retegui', 'Pellegrini'],
      'Fenerbahçe': ['Džeko', 'Tadić', 'Fred', 'Szymański'],
      'Marrocos': ['Ziyech', 'En-Nesyri', 'Hakimi', 'Brahim Díaz'],
      'Serie A XI': ['Osimhen', 'Kvaratskhelia', 'Dybala', 'Theo Hernández'],
      'Premier League XI': ['Haaland', 'De Bruyne', 'Son', 'Salah'],
      'Ligue 1 XI': ['Mbappé', 'Ben Yedder', 'David', 'Vitinha'],
      'Liverpool XI': ['Gerrard', 'Suárez', 'Torres', 'Fowler'],
      'Soccer Aid': ['Bolt', 'Ronaldinho', 'Roberto Carlos', 'Kaká'],
      'Napoli': ['Osimhen', 'Kvaratskhelia', 'Politano', 'Raspadori'],
      'Aston Villa': ['Watkins', 'Bailey', 'Douglas Luiz', 'McGinn'],
      'Bundesliga XI': ['Lewandowski', 'Robben', 'Ribéry', 'Aubameyang'],
      'Tottenham': ['Son Heung-min', 'Richarlison', 'Maddison', 'Kulusevski'],
      'Inter de Milão': ['Lautaro Martínez', 'Thuram', 'Barella', 'Calhanoglu'],
      'Espanha': ['Morata', 'Nico Williams', 'Lamine Yamal', 'Rodri'],
      'Real Madrid XI': ['Cristiano Ronaldo', 'Zidane', 'Ronaldo Fenômeno', 'Raúl'],
      'Real Madrid': ['Vinícius Jr.', 'Bellingham', 'Rodrygo', 'Valverde'],
      'Juventus XI': ['Del Piero', 'Nedvěd', 'Pirlo', 'Buffon'],
      'Galatasaray': ['Icardi', 'Zaha', 'Mertens', 'Kerem Aktürkoğlu'],
      'Ajax': ['Brobbey', 'Bergwijn', 'Berghuis', 'Taylor'],
      'Juventus': ['Vlahović', 'Chiesa', 'Yildiz', 'Rabiot'],
      'Manchester City': ['Haaland', 'De Bruyne', 'Foden', 'Bernardo Silva'],
      'PSG': ['Mbappé', 'Dembélé', 'Barcola', 'Hakimi'],
      'Manchester United': ['Bruno Fernandes', 'Rashford', 'Højlund', 'Garnacho'],
      'Sporting': ['Gyökeres', 'Trincão', 'Pedro Gonçalves', 'Edwards'],
      'Croácia': ['Modrić', 'Kramarić', 'Kovačić', 'Perišić'],
      'Alemanha': ['Musiala', 'Wirtz', 'Füllkrug', 'Havertz'],
      'Benfica': ['Di María', 'Rafa Silva', 'Arthur Cabral', 'Kökçü'],
      'Bélgica': ['Lukaku', 'De Bruyne', 'Doku', 'Trossard'],
      'Milan': ['Rafael Leão', 'Giroud', 'Pulisic', 'Theo Hernández'],
      'Seleção Clássica': ['Pelé', 'Maradona', 'Cruyff', 'Beckenbauer'],
      'Zlatan FC': ['Zlatan Ibrahimović', 'Pogba', 'Maxwell', 'Mkhitaryan'],
      'LALIGA XI': ['Messi', 'Cristiano Ronaldo', 'Iniesta', 'Xavi'],
    };

    setGroupMatchesState(prev =>
      prev.map((m, idx) => {
        if (idx < numMatches) {
          const hScore = Math.floor(Math.random() * 4);
          const aScore = Math.floor(Math.random() * 4);
          const goals: Goal[] = [];

          const homePool = samplePlayers[m.homeTeam] || ['Atacante 1', 'Meia 1'];
          const awayPool = samplePlayers[m.awayTeam] || ['Atacante 2', 'Meia 2'];

          for (let i = 0; i < hScore; i++) {
            const p = homePool[Math.floor(Math.random() * homePool.length)];
            const hasAssist = Math.random() > 0.4;
            const a = hasAssist ? homePool.filter(x => x !== p)[0] : undefined;
            goals.push({
              id: `demo_${m.id}_h_${i}`,
              minute: Math.floor(Math.random() * 88) + 1,
              player: p,
              team: m.homeTeam,
              assistPlayer: a,
            });
          }

          for (let i = 0; i < aScore; i++) {
            const p = awayPool[Math.floor(Math.random() * awayPool.length)];
            const hasAssist = Math.random() > 0.4;
            const a = hasAssist ? awayPool.filter(x => x !== p)[0] : undefined;
            goals.push({
              id: `demo_${m.id}_a_${i}`,
              minute: Math.floor(Math.random() * 88) + 1,
              player: p,
              team: m.awayTeam,
              assistPlayer: a,
            });
          }

          goals.sort((a, b) => a.minute - b.minute);

          return {
            ...m,
            homeScore: hScore,
            awayScore: aScore,
            goals,
            isFinished: true,
            winnerTeam: hScore > aScore ? m.homeTeam : aScore > hScore ? m.awayTeam : undefined,
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      })
    );
  };

  return (
    <TournamentContext.Provider
      value={{
        matches,
        groupMatches: groupMatchesState,
        knockoutMatches,
        groupStandings,
        bestThirds,
        topScorers,
        topAssists,
        allTeamStats,
        leastConceded,
        mostGoals,
        nextUnplayedMatch,
        nextUserMatch,
        knownPlayers,
        totalMatchesPlayed,
        totalGoalsScored,
        saveMatch,
        resetMatch,
        resetTournament,
        exportData,
        importData,
        seedDemoData,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

export const useTournament = () => {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
};
