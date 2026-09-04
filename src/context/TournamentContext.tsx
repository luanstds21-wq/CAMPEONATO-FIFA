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
import { useAuth } from './AuthContext';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

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
  // User synchronization & cloud status
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  refreshFromCloud: () => Promise<void>;
  isLoadingTournament: boolean;
}

const TournamentContext = createContext<TournamentContextType | null>(null);

function getStorageKey(userId: string | undefined): string {
  return `fifa_tournament_user_${userId || 'guest'}_v2`;
}

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const activeUserId = user?.id || 'guest';
  const currentUserIdRef = useRef(activeUserId);
  currentUserIdRef.current = activeUserId;

  const [isLoadingTournament, setIsLoadingTournament] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(isSupabaseConfigured ? 'synced' : 'offline');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Helper to load initial data for a given user from local cache
  const loadLocalUserData = useCallback((userId: string) => {
    try {
      const key = getStorageKey(userId);
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
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
      console.error('Error loading local user tournament:', e);
    }
    return {
      groupMatches: INITIAL_GROUP_MATCHES,
      knockoutData: {},
    };
  }, []);

  // Matches states
  const [groupMatchesState, setGroupMatchesState] = useState<Match[]>(() => {
    return loadLocalUserData(activeUserId).groupMatches;
  });

  const [savedKnockoutData, setSavedKnockoutData] = useState<Record<number, Partial<Match>>>(() => {
    return loadLocalUserData(activeUserId).knockoutData;
  });

  // Track if we just loaded user data to avoid immediately re-saving stale states
  const isInitialUserLoadRef = useRef(true);

  // Sync to Supabase helper
  const syncToSupabase = useCallback(
    async (
      uid: string,
      groups: Match[],
      knockout: Record<number, Partial<Match>>
    ) => {
      if (!isSupabaseConfigured || !supabase || uid === 'guest') {
        setSyncStatus('offline');
        return;
      }

      try {
        setSyncStatus('syncing');
        const payload = {
          id: `tournament_${uid}`,
          user_id: uid,
          name: 'FIFA Champions 48',
          version: 2,
          group_matches: groups,
          knockout_data: knockout,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase.from('tournaments').upsert(payload, {
          onConflict: 'id',
        });

        if (error) {
          console.warn('Supabase sync error:', error.message);
          setSyncStatus('error');
        } else {
          setSyncStatus('synced');
          setLastSyncedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        }
      } catch (err) {
        console.warn('Sync failed:', err);
        setSyncStatus('error');
      }
    },
    []
  );

  // Load user data when activeUserId changes (e.g. Account switch, login, logout)
  useEffect(() => {
    let isCancelled = false;

    async function loadUserData() {
      setIsLoadingTournament(true);
      isInitialUserLoadRef.current = true;

      // 1. Instant load from local storage
      const local = loadLocalUserData(activeUserId);
      setGroupMatchesState(local.groupMatches);
      setSavedKnockoutData(local.knockoutData);

      // 2. If Supabase is connected and we have a valid logged in user, fetch from cloud
      if (isSupabaseConfigured && supabase && user?.id) {
        setSyncStatus('syncing');
        try {
          const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (!isCancelled) {
            if (data && data.group_matches && Array.isArray(data.group_matches)) {
              const merged = INITIAL_GROUP_MATCHES.map(initM => {
                const found = data.group_matches.find((m: Match) => m.id === initM.id);
                return found ? { ...initM, ...found, goals: Array.isArray(found.goals) ? found.goals : [] } : initM;
              });

              setGroupMatchesState(merged);
              setSavedKnockoutData(data.knockout_data || {});

              // Update local cache
              const key = getStorageKey(user.id);
              localStorage.setItem(
                key,
                JSON.stringify({
                  groupMatches: merged,
                  knockoutData: data.knockout_data || {},
                  updatedAt: data.updated_at || new Date().toISOString(),
                })
              );

              setSyncStatus('synced');
              setLastSyncedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
            } else if (!error && !data) {
              // No tournament in cloud yet, initialize with current local data
              await syncToSupabase(user.id, local.groupMatches, local.knockoutData);
            }
          }
        } catch (e) {
          console.warn('Error fetching user tournament from Supabase:', e);
          if (!isCancelled) setSyncStatus('offline');
        }
      } else {
        setSyncStatus('offline');
      }

      if (!isCancelled) {
        setIsLoadingTournament(false);
        setTimeout(() => {
          isInitialUserLoadRef.current = false;
        }, 150);
      }
    }

    loadUserData();

    return () => {
      isCancelled = true;
    };
  }, [activeUserId, user?.id, loadLocalUserData, syncToSupabase]);

  // Debounce saving whenever groupMatchesState or savedKnockoutData updates
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isInitialUserLoadRef.current) return;

    // 1. Immediately save to local storage for current user
    const key = getStorageKey(activeUserId);
    try {
      const payload = {
        groupMatches: groupMatchesState,
        knockoutData: savedKnockoutData,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {
      console.error('Error saving local tournament cache:', e);
    }

    // 2. Debounce cloud sync to Supabase
    if (isSupabaseConfigured && supabase && user?.id) {
      setSyncStatus('syncing');
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(() => {
        syncToSupabase(user.id, groupMatchesState, savedKnockoutData);
      }, 700);
    }

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [groupMatchesState, savedKnockoutData, activeUserId, user?.id, syncToSupabase]);

  // Force refresh from cloud
  const refreshFromCloud = async () => {
    if (!isSupabaseConfigured || !supabase || !user?.id) return;
    setIsLoadingTournament(true);
    setSyncStatus('syncing');

    try {
      const { data } = await supabase
        .from('tournaments')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (data && data.group_matches && Array.isArray(data.group_matches)) {
        const merged = INITIAL_GROUP_MATCHES.map(initM => {
          const found = data.group_matches.find((m: Match) => m.id === initM.id);
          return found ? { ...initM, ...found, goals: Array.isArray(found.goals) ? found.goals : [] } : initM;
        });

        setGroupMatchesState(merged);
        setSavedKnockoutData(data.knockout_data || {});
        setSyncStatus('synced');
        setLastSyncedAt(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (err) {
      console.warn('Refresh error:', err);
    } finally {
      setIsLoadingTournament(false);
    }
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

  // Action: Reset entire tournament for current user
  const resetTournament = () => {
    setGroupMatchesState(INITIAL_GROUP_MATCHES);
    setSavedKnockoutData({});
    try {
      const key = getStorageKey(activeUserId);
      localStorage.removeItem(key);
    } catch (e) {
      console.error(e);
    }
    if (isSupabaseConfigured && supabase && user?.id) {
      syncToSupabase(user.id, INITIAL_GROUP_MATCHES, {});
    }
  };

  // Export JSON (Specific to current user's championship)
  const exportData = () => {
    const data = {
      version: 2,
      exportedAt: new Date().toISOString(),
      user: {
        id: activeUserId,
        name: user?.displayName || 'Usuário',
        email: user?.email || user?.phone,
      },
      groupMatches: groupMatchesState,
      knockoutData: savedKnockoutData,
    };
    return JSON.stringify(data, null, 2);
  };

  // Import JSON (Restores into current user's championship)
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

        // Update local storage and sync to cloud immediately
        const key = getStorageKey(activeUserId);
        localStorage.setItem(
          key,
          JSON.stringify({
            groupMatches: newGroups,
            knockoutData: newKnockout,
            updatedAt: new Date().toISOString(),
          })
        );

        if (isSupabaseConfigured && supabase && user?.id) {
          syncToSupabase(user.id, newGroups, newKnockout);
        }
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
