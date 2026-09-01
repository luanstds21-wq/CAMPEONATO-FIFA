import { GROUPS, KNOCKOUT_DEFINITIONS } from '../data/initialData';
import { GroupStanding, Match, PlayerStat, TeamStat } from '../types/tournament';

// Calculate group standings for all 12 groups
export function calculateGroupStandings(matches: Match[]): Record<string, GroupStanding[]> {
  const standingsMap: Record<string, Record<string, {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
    h2h: Record<string, { points: number; goalDiff: number; goalsFor: number }>;
  }>> = {};

  // Initialize all groups and teams
  for (const [groupName, teams] of Object.entries(GROUPS)) {
    standingsMap[groupName] = {};
    for (const team of teams) {
      standingsMap[groupName][team] = {
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
        h2h: {},
      };
      for (const opp of teams) {
        if (opp !== team) {
          standingsMap[groupName][team].h2h[opp] = { points: 0, goalDiff: 0, goalsFor: 0 };
        }
      }
    }
  }

  // Process all group stage matches (id 1 to 72)
  const groupMatches = matches.filter(m => m.stage === 'group' && m.isFinished && m.homeScore !== undefined && m.awayScore !== undefined && m.group);

  for (const m of groupMatches) {
    const groupName = m.group!;
    const home = m.homeTeam;
    const away = m.awayTeam;
    const hScore = m.homeScore!;
    const aScore = m.awayScore!;

    const gObj = standingsMap[groupName];
    if (!gObj || !gObj[home] || !gObj[away]) continue;

    gObj[home].played += 1;
    gObj[away].played += 1;

    gObj[home].goalsFor += hScore;
    gObj[home].goalsAgainst += aScore;
    gObj[away].goalsFor += aScore;
    gObj[away].goalsAgainst += hScore;

    if (hScore > aScore) {
      gObj[home].won += 1;
      gObj[home].points += 3;
      gObj[away].lost += 1;

      // H2H
      gObj[home].h2h[away].points += 3;
      gObj[home].h2h[away].goalDiff += (hScore - aScore);
      gObj[home].h2h[away].goalsFor += hScore;
      gObj[away].h2h[home].goalDiff += (aScore - hScore);
      gObj[away].h2h[home].goalsFor += aScore;
    } else if (hScore < aScore) {
      gObj[away].won += 1;
      gObj[away].points += 3;
      gObj[home].lost += 1;

      // H2H
      gObj[away].h2h[home].points += 3;
      gObj[away].h2h[home].goalDiff += (aScore - hScore);
      gObj[away].h2h[home].goalsFor += aScore;
      gObj[home].h2h[away].goalDiff += (hScore - aScore);
      gObj[home].h2h[away].goalsFor += hScore;
    } else {
      gObj[home].drawn += 1;
      gObj[home].points += 1;
      gObj[away].drawn += 1;
      gObj[away].points += 1;

      // H2H
      gObj[home].h2h[away].points += 1;
      gObj[away].h2h[home].points += 1;
      gObj[home].h2h[away].goalsFor += hScore;
      gObj[away].h2h[home].goalsFor += aScore;
    }
  }

  const result: Record<string, GroupStanding[]> = {};

  for (const [groupName, teamsObj] of Object.entries(standingsMap)) {
    const list: GroupStanding[] = Object.entries(teamsObj).map(([team, s]) => {
      const goalDifference = s.goalsFor - s.goalsAgainst;
      return {
        position: 0,
        group: groupName,
        team,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goalsFor: s.goalsFor,
        goalsAgainst: s.goalsAgainst,
        goalDifference,
        points: s.points,
        status: 'pending',
      };
    });

    // Sort group: 1. Points, 2. Goal Difference, 3. Goals For, 4. Head-to-Head / Wins
    list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      if (b.won !== a.won) return b.won - a.won;
      return a.team.localeCompare(b.team);
    });

    // Assign positions
    list.forEach((item, idx) => {
      item.position = idx + 1;
      if (idx === 0 || idx === 1) {
        item.status = 'qualified_top2';
      }
    });

    result[groupName] = list;
  }

  return result;
}

// Calculate the 8 best 3rd-placed teams
export function calculateBestThirds(standings: Record<string, GroupStanding[]>): GroupStanding[] {
  const thirds: GroupStanding[] = [];

  for (const list of Object.values(standings)) {
    const third = list.find(s => s.position === 3);
    if (third) {
      thirds.push({ ...third });
    }
  }

  // Sort 3rd placed teams:
  // 1. Points, 2. Goal Difference, 3. Goals For, 4. Won
  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    if (b.won !== a.won) return b.won - a.won;
    return a.team.localeCompare(b.team);
  });

  return thirds.map((t, idx) => {
    const isTop8 = idx < 8;
    return {
      ...t,
      bestThirdRank: idx + 1,
      status: isTop8 ? ('qualified_best3' as const) : ('eliminated_3rd' as const),
    };
  });
}

// Resolve all knockout matches (73 to 103) based on group stage standings and prior knockout winners
export function resolveKnockoutMatches(
  groupStandings: Record<string, GroupStanding[]>,
  bestThirds: GroupStanding[],
  savedKnockoutData: Record<number, Partial<Match>>
): Match[] {
  const resolvedMatches: Match[] = [];
  const matchMap = new Map<number, Match>();

  // Map 1st, 2nd of each group and best thirds for easy lookup
  const groupWinners: Record<string, string> = {};
  const groupRunnersUp: Record<string, string> = {};

  for (const [groupName, list] of Object.entries(groupStandings)) {
    if (list[0]) groupWinners[groupName] = list[0].team;
    if (list[1]) groupRunnersUp[groupName] = list[1].team;
  }

  const bestThirdTeams: string[] = bestThirds.map(t => t.team);

  for (const def of KNOCKOUT_DEFINITIONS) {
    let homeTeam = '';
    let awayTeam = '';
    let userControls = '';

    // Resolve Home Team
    if (def.homeSource) {
      if (def.homeSource.stage === 'group') {
        if (def.homeSource.group && def.homeSource.rank === 1) {
          homeTeam = groupWinners[def.homeSource.group] || '';
        } else if (def.homeSource.group && def.homeSource.rank === 2) {
          homeTeam = groupRunnersUp[def.homeSource.group] || '';
        }
      } else if (def.homeSource.sourceMatchId) {
        const sourceM = matchMap.get(def.homeSource.sourceMatchId);
        if (sourceM && sourceM.isFinished && sourceM.winnerTeam) {
          homeTeam = sourceM.winnerTeam;
        }
      }
    }

    // Resolve Away Team
    if (def.awaySource) {
      if (def.awaySource.stage === 'group') {
        if (def.awaySource.group && def.awaySource.rank === 2) {
          awayTeam = groupRunnersUp[def.awaySource.group] || '';
        } else if (def.awaySource.bestThirdRank) {
          const rankIdx = def.awaySource.bestThirdRank - 1;
          awayTeam = bestThirdTeams[rankIdx] || '';
        }
      } else if (def.awaySource.sourceMatchId) {
        const sourceM = matchMap.get(def.awaySource.sourceMatchId);
        if (sourceM && sourceM.isFinished && sourceM.winnerTeam) {
          awayTeam = sourceM.winnerTeam;
        }
      }
    }

    // Resolve User Controls
    if (def.userControlsSource) {
      if (def.userControlsSource.source === 'home') {
        userControls = homeTeam;
      } else if (def.userControlsSource.source === 'away') {
        userControls = awayTeam;
      } else if (def.userControlsSource.source === 'source_match' && def.userControlsSource.sourceMatchId) {
        const srcMatch = matchMap.get(def.userControlsSource.sourceMatchId);
        if (srcMatch && srcMatch.isFinished && srcMatch.winnerTeam) {
          userControls = srcMatch.winnerTeam;
        }
      }
    }

    const saved = savedKnockoutData[def.id] || {};

    const match: Match = {
      id: def.id,
      stage: def.stage,
      roundLabel: def.roundLabel,
      homeTeam: homeTeam || def.homePlaceholder,
      awayTeam: awayTeam || def.awayPlaceholder,
      userControls: userControls || def.userControlsRule,
      homePlaceholder: def.homePlaceholder,
      awayPlaceholder: def.awayPlaceholder,
      userControlsPlaceholder: def.userControlsRule,
      homeScore: saved.homeScore,
      awayScore: saved.awayScore,
      goals: saved.goals || [],
      isFinished: !!saved.isFinished,
      winnerTeam: saved.winnerTeam,
      decisionType: saved.decisionType || 'regular',
      homePenalties: saved.homePenalties,
      awayPenalties: saved.awayPenalties,
      updatedAt: saved.updatedAt,
    };

    matchMap.set(def.id, match);
    resolvedMatches.push(match);
  }

  return resolvedMatches;
}

// Calculate top scorers and top assists across all matches (group + knockout)
export function calculatePlayerStats(matches: Match[]): {
  topScorers: PlayerStat[];
  topAssists: PlayerStat[];
} {
  const playersMap = new Map<string, { player: string; team: string; goals: number; assists: number }>();

  function getPlayerKey(name: string, team: string) {
    return `${name.trim().toLowerCase()}_${team.trim().toLowerCase()}`;
  }

  for (const m of matches) {
    if (!m.isFinished || !m.goals) continue;

    for (const g of m.goals) {
      if (g.player && g.player.trim()) {
        const pName = g.player.trim();
        const pKey = getPlayerKey(pName, g.team);
        if (!playersMap.has(pKey)) {
          playersMap.set(pKey, { player: pName, team: g.team, goals: 0, assists: 0 });
        }
        playersMap.get(pKey)!.goals += 1;
      }

      if (g.assistPlayer && g.assistPlayer.trim()) {
        const aName = g.assistPlayer.trim();
        const aKey = getPlayerKey(aName, g.team);
        if (!playersMap.has(aKey)) {
          playersMap.set(aKey, { player: aName, team: g.team, goals: 0, assists: 0 });
        }
        playersMap.get(aKey)!.assists += 1;
      }
    }
  }

  const allPlayers = Array.from(playersMap.values());

  const topScorers = allPlayers
    .filter(p => p.goals > 0)
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      return a.player.localeCompare(b.player);
    });

  const topAssists = allPlayers
    .filter(p => p.assists > 0)
    .sort((a, b) => {
      if (b.assists !== a.assists) return b.assists - a.assists;
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.player.localeCompare(b.player);
    });

  return { topScorers, topAssists };
}

// Calculate comprehensive team stats for all 48 teams
export function calculateAllTeamStats(matches: Match[], groupStandings: Record<string, GroupStanding[]>): {
  allTeamStats: TeamStat[];
  leastConceded: TeamStat[];
  mostGoals: TeamStat[];
} {
  const teamMap = new Map<string, TeamStat>();

  // Initialize with group stages
  for (const [groupName, list] of Object.entries(groupStandings)) {
    for (const item of list) {
      teamMap.set(item.team, {
        team: item.team,
        group: groupName,
        played: item.played,
        won: item.won,
        drawn: item.drawn,
        lost: item.lost,
        goalsFor: item.goalsFor,
        goalsAgainst: item.goalsAgainst,
        goalDifference: item.goalDifference,
        points: item.points,
        avgGoalsFor: item.played > 0 ? Number((item.goalsFor / item.played).toFixed(2)) : 0,
        avgGoalsAgainst: item.played > 0 ? Number((item.goalsAgainst / item.played).toFixed(2)) : 0,
      });
    }
  }

  // Also include goals and matches from knockout stages in team performance summary
  const knockoutMatches = matches.filter(m => m.stage !== 'group' && m.isFinished && m.homeScore !== undefined && m.awayScore !== undefined);

  for (const m of knockoutMatches) {
    const home = teamMap.get(m.homeTeam);
    const away = teamMap.get(m.awayTeam);
    const hScore = m.homeScore!;
    const aScore = m.awayScore!;

    if (home) {
      home.played += 1;
      home.goalsFor += hScore;
      home.goalsAgainst += aScore;
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      if (m.winnerTeam === m.homeTeam) {
        home.won += 1;
      } else {
        home.lost += 1;
      }
      home.avgGoalsFor = Number((home.goalsFor / home.played).toFixed(2));
      home.avgGoalsAgainst = Number((home.goalsAgainst / home.played).toFixed(2));
    }

    if (away) {
      away.played += 1;
      away.goalsFor += aScore;
      away.goalsAgainst += hScore;
      away.goalDifference = away.goalsFor - away.goalsAgainst;
      if (m.winnerTeam === m.awayTeam) {
        away.won += 1;
      } else {
        away.lost += 1;
      }
      away.avgGoalsFor = Number((away.goalsFor / away.played).toFixed(2));
      away.avgGoalsAgainst = Number((away.goalsAgainst / away.played).toFixed(2));
    }
  }

  const allTeamStats = Array.from(teamMap.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.localeCompare(b.team);
  });

  // Least Conceded: Sort by goalsAgainst ascending (minimum 1 game played)
  const leastConceded = [...allTeamStats]
    .filter(t => t.played > 0)
    .sort((a, b) => {
      if (a.goalsAgainst !== b.goalsAgainst) return a.goalsAgainst - b.goalsAgainst;
      if (b.played !== a.played) return b.played - a.played; // more games played with same GC is better
      return a.avgGoalsAgainst - b.avgGoalsAgainst;
    });

  // Most Goals: Sort by goalsFor descending
  const mostGoals = [...allTeamStats]
    .filter(t => t.played > 0)
    .sort((a, b) => {
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return b.avgGoalsFor - a.avgGoalsFor;
    });

  return { allTeamStats, leastConceded, mostGoals };
}
