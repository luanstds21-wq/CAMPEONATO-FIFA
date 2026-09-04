import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { INITIAL_GROUP_MATCHES } from '../data/initialData';
import {
  DecisionType,
  Goal,
  GroupStanding,
  Match,
  PlayerProfile,
  PlayerStat,
  TeamProfile,
  TeamStat,
} from '../types/tournament';
import {
  calculateAllTeamStats,
  calculateBestThirds,
  calculateGroupStandings,
  calculatePlayerStats,
  getPlayerProfile as calcPlayerProfile,
  getTeamProfile as calcTeamProfile,
  resolveKnockoutMatches,
} from '../utils/calculator';

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

interface TournamentContextType {
  matches: Match[];
  groupMatches: Match[];
  knockoutMatches: Match[];
  groupStandings: Record<string, GroupStanding[]>;
  bestThirds: GroupStanding[];
  topScorers: PlayerStat[];
  topAssists: PlayerStat[];
  topContributions: PlayerStat[];
  allTeamStats: TeamStat[];
  leastConceded: TeamStat[];
  mostGoals: TeamStat[];
  nextUnplayedMatch: Match | null;
  nextUserMatch: Match | null;
  knownPlayers: string[];
  totalMatchesPlayed: number;
  totalGoalsScored: number;
  selectedPlayerName: string | null;
  setSelectedPlayerName: (name: string | null) => void;
  selectedTeamName: string | null;
  setSelectedTeamName: (name: string | null) => void;
  getPlayerProfile: (name: string) => PlayerProfile | null;
  getTeamProfile: (name: string) => TeamProfile | null;
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
  // Shared global synchronization status
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  refreshFromCloud: () => Promise<void>;
  isLoadingTournament: boolean;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

const SHARED_CACHE_KEY = 'fifa_champions_48_shared_cache';

function loadCachedTournament(): {
  groupMatches: Match[];
  knockoutData: Record<number, Partial<Match>>;
} {
  try {
    const raw = localStorage.getItem(SHARED_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.groupMatches && Array.isArray(parsed.groupMatches)) {
        const merged = INITIAL_GROUP_MATCHES.map(initM => {
          const found = parsed.groupMatches.find((m: Match) => m.id === initM.id);
          return found ? { ...initM, ...found, goals: Array.isArray(found.goals) ? found.goals : [] } : initM;
        });
        return {
          groupMatches: merged,
          knockoutData: parsed.knockoutData || {},
        };
      }
    }
  } catch (e) {
    console.warn('Cache load error:', e);
  }
  return {
    groupMatches: INITIAL_GROUP_MATCHES,
    knockoutData: {},
  };
}

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Unique client ID to prevent echo processing of our own real-time SSE updates
  const myClientIdRef = useRef<string>(`client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const [isLoadingTournament, setIsLoadingTournament] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Initial tournament state from local cache for instant zero-flicker startup
  const [groupMatchesState, setGroupMatchesState] = useState<Match[]>(() => {
    return loadCachedTournament().groupMatches;
  });

  const [savedKnockoutData, setSavedKnockoutData] = useState<Record<number, Partial<Match>>>(() => {
    return loadCachedTournament().knockoutData;
  });

  // Flag to avoid syncing on the very first mount before we fetch from server
  const isReadyToSyncRef = useRef<boolean>(false);

  // Helper to sync state to server (for simulation, import, or full state sync)
  const syncToServer = useCallback(
    async (
      groups: Match[],
      knockout: Record<number, Partial<Match>>,
      options?: { isSimulation?: boolean; isImport?: boolean }
    ) => {
      setSyncStatus('syncing');
      try {
        const response = await fetch('/api/tournament', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            groupMatches: groups,
            knockoutData: knockout,
            clientId: myClientIdRef.current,
            isSimulation: options?.isSimulation,
            isImport: options?.isImport,
          }),
        });

        if (response.ok) {
          const json = await response.json();
          if (json.data) {
            applyRemoteTournament(json.data);
          }
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        console.warn('Server sync error:', err);
        setSyncStatus('offline');
      }
    },
    []
  );

  // Apply tournament payload helper
  const applyRemoteTournament = useCallback((data: { groupMatches: any[]; knockoutData?: Record<number, Partial<Match>> }) => {
    if (data && Array.isArray(data.groupMatches) && data.groupMatches.length > 0) {
      const merged = INITIAL_GROUP_MATCHES.map(initM => {
        const found = data.groupMatches.find((m: any) => m.id === initM.id);
        return found ? { ...initM, ...found, goals: Array.isArray(found.goals) ? found.goals : [] } : initM;
      });

      setGroupMatchesState(merged);
      const newKnockout = data.knockoutData || {};
      setSavedKnockoutData(newKnockout);

      // Save to local cache
      try {
        localStorage.setItem(
          SHARED_CACHE_KEY,
          JSON.stringify({
            groupMatches: merged,
            knockoutData: newKnockout,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (e) {
        console.warn('Cache write error:', e);
      }

      setSyncStatus('synced');
      setLastSyncedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      return true;
    }
    return false;
  }, []);

  // Fetch current shared tournament from server (with cache-busting)
  const fetchFromServer = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournament?ts=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          applyRemoteTournament(json.data);
        }
      }
    } catch (err) {
      console.warn('Fetch from server error:', err);
      setSyncStatus('offline');
    } finally {
      setIsLoadingTournament(false);
    }
  }, [applyRemoteTournament]);

  // Initial load + Real-time SSE listener setup + Mobile visibility refresh
  useEffect(() => {
    let isCancelled = false;

    // 1. Initial fetch from server
    fetchFromServer();

    // 2. Real-time Server-Sent Events (SSE) listener
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/tournament/stream');

      eventSource.onmessage = event => {
        if (isCancelled) return;
        try {
          const payload = JSON.parse(event.data);
          // If update came from another client, apply it immediately
          if (payload.type === 'tournament_update' && payload.data) {
            if (payload.senderId !== myClientIdRef.current) {
              applyRemoteTournament(payload.data);
            }
          } else if (payload.type === 'initial' && payload.data) {
            // Initial payload when connecting
            if (payload.data.groupMatches && payload.data.groupMatches.length > 0) {
              applyRemoteTournament(payload.data);
            }
          }
        } catch (e) {
          console.error('Error handling SSE message:', e);
        }
      };

      eventSource.onerror = () => {
        if (!isCancelled) {
          setSyncStatus('syncing');
        }
      };

      eventSource.onopen = () => {
        if (!isCancelled) {
          setSyncStatus('synced');
        }
      };
    } catch (err) {
      console.warn('EventSource not supported or blocked:', err);
    }

    // 3. Multi-event listener for mobile phone unlocks, tab switches, and page reveals
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchFromServer();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    window.addEventListener('pageshow', handleVisibility);

    // 4. Polling fallback every 3 seconds while active
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchFromServer();
      }
    }, 3000);

    return () => {
      isCancelled = true;
      if (eventSource) eventSource.close();
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('pageshow', handleVisibility);
      clearInterval(pollInterval);
    };
  }, [fetchFromServer, applyRemoteTournament]);

  // Keep local storage in sync with state changes (client-side only, NO POST LOOP)
  useEffect(() => {
    try {
      localStorage.setItem(
        SHARED_CACHE_KEY,
        JSON.stringify({
          groupMatches: groupMatchesState,
          knockoutData: savedKnockoutData,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('Error saving local tournament cache:', e);
    }
  }, [groupMatchesState, savedKnockoutData]);

  // Force manual refresh from server
  const refreshFromCloud = async () => {
    setIsLoadingTournament(true);
    await fetchFromServer();
  };

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
  const { topScorers, topAssists, topContributions } = useMemo(() => {
    return calculatePlayerStats(matches);
  }, [matches]);

  const { allTeamStats, leastConceded, mostGoals } = useMemo(() => {
    return calculateAllTeamStats(matches, groupStandings);
  }, [matches, groupStandings]);

  // Profile selection state
  const [selectedPlayerName, setSelectedPlayerName] = useState<string | null>(null);
  const [selectedTeamName, setSelectedTeamName] = useState<string | null>(null);

  const getPlayerProfile = (name: string) => {
    return calcPlayerProfile(name, matches);
  };

  const getTeamProfile = (name: string) => {
    return calcTeamProfile(name, matches, groupStandings);
  };

  // 6. Next Matches
  const nextUnplayedMatch = useMemo(() => {
    return matches.find(m => !m.isFinished) || null;
  }, [matches]);

  const nextUserMatch = useMemo(() => {
    return (
      matches.find(m => {
        if (m.isFinished) return false;
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

  // Action: Save Match Result (optimistic + instant atomic server sync)
  const saveMatch = async (
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

    // 1. Immediate optimistic UI update
    if (matchId <= 72) {
      // Group match
      setGroupMatchesState(prev =>
        prev.map(m => {
          if (m.id === matchId) {
            let winner: string | undefined = data.winnerTeam;
            if (winner === undefined) {
              if (data.homeScore > data.awayScore) winner = m.homeTeam;
              else if (data.awayScore > data.homeScore) winner = m.awayTeam;
            }

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

    // 2. Direct atomic sync to server (keepalive: true ensures completion even if mobile app backgrounded)
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/tournament/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          matchId,
          homeScore: data.homeScore,
          awayScore: data.awayScore,
          goals: data.goals,
          winnerTeam: data.winnerTeam,
          decisionType: data.decisionType,
          homePenalties: data.homePenalties,
          awayPenalties: data.awayPenalties,
          clientId: myClientIdRef.current,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          applyRemoteTournament(json.data);
        }
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      console.warn('Match sync error:', err);
      setSyncStatus('offline');
    }
  };

  // Action: Reset single match
  const resetMatch = async (matchId: number) => {
    const updatedAt = new Date().toISOString();

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
              updatedAt,
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

    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/tournament/reset-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          matchId,
          clientId: myClientIdRef.current,
        }),
      });

      if (response.ok) {
        const json = await response.json();
        if (json.data) {
          applyRemoteTournament(json.data);
        }
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Reset match error:', err);
    }
  };

  // Action: Reset entire shared tournament
  const resetTournament = async () => {
    setGroupMatchesState(INITIAL_GROUP_MATCHES);
    setSavedKnockoutData({});
    try {
      localStorage.removeItem(SHARED_CACHE_KEY);
    } catch (e) {
      console.error(e);
    }

    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/tournament/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: myClientIdRef.current }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          applyRemoteTournament(json.data);
        }
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.error('Reset tournament error:', err);
    }
  };

  // Export JSON (Complete backup of shared tournament)
  const exportData = () => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      tournamentName: 'FIFA Champions League 48',
      type: 'shared_global_tournament',
      groupMatches: groupMatchesState,
      knockoutData: savedKnockoutData,
    };
    return JSON.stringify(data, null, 2);
  };

  // Import JSON (Restores into shared tournament for everyone)
  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.groupMatches && Array.isArray(parsed.groupMatches)) {
        const newGroups = INITIAL_GROUP_MATCHES.map(initM => {
          const found = parsed.groupMatches.find((m: Match) => m.id === initM.id);
          return found ? { ...initM, ...found, goals: Array.isArray(found.goals) ? found.goals : [] } : initM;
        });
        const newKnockout = parsed.knockoutData || {};

        setGroupMatchesState(newGroups);
        setSavedKnockoutData(newKnockout);

        // Update local cache and immediately push to server
        try {
          localStorage.setItem(
            SHARED_CACHE_KEY,
            JSON.stringify({
              groupMatches: newGroups,
              knockoutData: newKnockout,
              updatedAt: new Date().toISOString(),
            })
          );
        } catch (e) {
          console.warn('Cache write error:', e);
        }

        syncToServer(newGroups, newKnockout, { isImport: true });
        return true;
      }
    } catch (e) {
      console.error('Import error:', e);
    }
    return false;
  };

  // Demo seed (for rapid test simulation)
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

    setGroupMatchesState(prev => {
      const updated = prev.map((m, idx) => {
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
              minute: Math.floor(Math.random() * 90) + 1,
              team: m.homeTeam,
              player: p,
              assistPlayer: a,
            });
          }

          for (let i = 0; i < aScore; i++) {
            const p = awayPool[Math.floor(Math.random() * awayPool.length)];
            const hasAssist = Math.random() > 0.4;
            const a = hasAssist ? awayPool.filter(x => x !== p)[0] : undefined;
            goals.push({
              id: `demo_${m.id}_a_${i}`,
              minute: Math.floor(Math.random() * 90) + 1,
              team: m.awayTeam,
              player: p,
              assistPlayer: a,
            });
          }

          let winner: string | undefined = undefined;
          if (hScore > aScore) winner = m.homeTeam;
          else if (aScore > hScore) winner = m.awayTeam;

          return {
            ...m,
            homeScore: hScore,
            awayScore: aScore,
            goals,
            isFinished: true,
            winnerTeam: winner,
            decisionType: 'regular',
            updatedAt: new Date().toISOString(),
          };
        }
        return m;
      });

      syncToServer(updated, savedKnockoutData, { isSimulation: true });
      return updated;
    });
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
        topContributions,
        allTeamStats,
        leastConceded,
        mostGoals,
        nextUnplayedMatch,
        nextUserMatch,
        knownPlayers,
        totalMatchesPlayed,
        totalGoalsScored,
        selectedPlayerName,
        setSelectedPlayerName,
        selectedTeamName,
        setSelectedTeamName,
        getPlayerProfile,
        getTeamProfile,
        saveMatch,
        resetMatch,
        resetTournament,
        exportData,
        importData,
        seedDemoData,
        syncStatus,
        lastSyncedAt,
        refreshFromCloud,
        isLoadingTournament,
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
