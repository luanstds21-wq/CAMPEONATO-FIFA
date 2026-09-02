import { GROUPS, KNOCKOUT_DEFINITIONS } from '../data/initialData';
import {
  GroupStanding,
  Match,
  PlayerProfile,
  PlayerStat,
  PlayerTeamBreakdown,
  TeamProfile,
  TeamStat,
} from '../types/tournament';

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

// Calculate top scorers, top assists, and top goal contributions across all matches (group + knockout)
// Aggregates stats by player NAME across all teams they played for!
export function calculatePlayerStats(matches: Match[]): {
  topScorers: PlayerStat[];
  topAssists: PlayerStat[];
  topContributions: PlayerStat[];
} {
  // Count finished matches per team to accurately calculate average per game
  const finishedMatchesByTeam = new Map<string, number>();
  for (const m of matches) {
    if (m.isFinished) {
      finishedMatchesByTeam.set(m.homeTeam, (finishedMatchesByTeam.get(m.homeTeam) || 0) + 1);
      finishedMatchesByTeam.set(m.awayTeam, (finishedMatchesByTeam.get(m.awayTeam) || 0) + 1);
    }
  }

  // Player aggregation map keyed by lowercased player name
  const playersMap = new Map<
    string,
    {
      name: string;
      teams: Set<string>;
      teamStats: Map<string, { goals: number; assists: number }>;
      goals: number;
      assists: number;
    }
  >();

  function getOrCreatePlayer(name: string) {
    const key = name.trim().toLowerCase();
    if (!playersMap.has(key)) {
      playersMap.set(key, {
        name: name.trim(),
        teams: new Set<string>(),
        teamStats: new Map<string, { goals: number; assists: number }>(),
        goals: 0,
        assists: 0,
      });
    }
    return playersMap.get(key)!;
  }

  for (const m of matches) {
    if (!m.isFinished || !Array.isArray(m.goals)) continue;

    for (const g of m.goals) {
      if (g.player && g.player.trim()) {
        const pName = g.player.trim();
        const teamName = g.team ? g.team.trim() : '';
        const entry = getOrCreatePlayer(pName);
        entry.goals += 1;
        if (teamName) {
          entry.teams.add(teamName);
          if (!entry.teamStats.has(teamName)) {
            entry.teamStats.set(teamName, { goals: 0, assists: 0 });
          }
          entry.teamStats.get(teamName)!.goals += 1;
        }
      }

      if (g.assistPlayer && g.assistPlayer.trim()) {
        const aName = g.assistPlayer.trim();
        const teamName = g.team ? g.team.trim() : '';
        const entry = getOrCreatePlayer(aName);
        entry.assists += 1;
        if (teamName) {
          entry.teams.add(teamName);
          if (!entry.teamStats.has(teamName)) {
            entry.teamStats.set(teamName, { goals: 0, assists: 0 });
          }
          entry.teamStats.get(teamName)!.assists += 1;
        }
      }
    }
  }

  const allPlayers: PlayerStat[] = Array.from(playersMap.values()).map(p => {
    const teamsList = Array.from(p.teams);
    // Matches played is the sum of finished matches of all teams this player played for
    const matchesPlayed = teamsList.reduce(
      (acc, t) => acc + (finishedMatchesByTeam.get(t) || 0),
      0
    );

    const contributions = p.goals + p.assists;
    const avgGoals = matchesPlayed > 0 ? Number((p.goals / matchesPlayed).toFixed(2)) : 0;
    const avgAssists = matchesPlayed > 0 ? Number((p.assists / matchesPlayed).toFixed(2)) : 0;
    const avgContributions = matchesPlayed > 0 ? Number((contributions / matchesPlayed).toFixed(2)) : 0;

    const byTeam: PlayerTeamBreakdown[] = teamsList.map(t => {
      const tStat = p.teamStats.get(t) || { goals: 0, assists: 0 };
      const tMatches = finishedMatchesByTeam.get(t) || 0;
      const tContrib = tStat.goals + tStat.assists;
      return {
        team: t,
        goals: tStat.goals,
        assists: tStat.assists,
        contributions: tContrib,
        matchesPlayed: tMatches,
        avgGoals: tMatches > 0 ? Number((tStat.goals / tMatches).toFixed(2)) : 0,
        avgAssists: tMatches > 0 ? Number((tStat.assists / tMatches).toFixed(2)) : 0,
      };
    });

    return {
      player: p.name,
      team: teamsList.length > 0 ? teamsList.join(' / ') : 'Sem equipe',
      teams: teamsList,
      goals: p.goals,
      assists: p.assists,
      contributions,
      matchesPlayed,
      avgGoals,
      avgAssists,
      avgContributions,
      byTeam,
    };
  });

  const topScorers = [...allPlayers]
    .filter(p => p.goals > 0)
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.avgGoals !== a.avgGoals) return b.avgGoals - a.avgGoals;
      if (b.assists !== a.assists) return b.assists - a.assists;
      return a.player.localeCompare(b.player);
    });

  const topAssists = [...allPlayers]
    .filter(p => p.assists > 0)
    .sort((a, b) => {
      if (b.assists !== a.assists) return b.assists - a.assists;
      if (b.avgAssists !== a.avgAssists) return b.avgAssists - a.avgAssists;
      if (b.goals !== a.goals) return b.goals - a.goals;
      return a.player.localeCompare(b.player);
    });

  const topContributions = [...allPlayers]
    .filter(p => p.contributions > 0)
    .sort((a, b) => {
      if (b.contributions !== a.contributions) return b.contributions - a.contributions;
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (b.avgContributions !== a.avgContributions) return b.avgContributions - a.avgContributions;
      return a.player.localeCompare(b.player);
    });

  return { topScorers, topAssists, topContributions };
}

// Generate individual Player Profile with full match records and breakdown by team
export function getPlayerProfile(playerName: string, matches: Match[]): PlayerProfile | null {
  if (!playerName || !playerName.trim()) return null;
  const targetKey = playerName.trim().toLowerCase();

  const goalEvents: PlayerProfile['goalEvents'] = [];
  const assistEvents: PlayerProfile['assistEvents'] = [];
  const teamsSet = new Set<string>();
  let canonicalName = playerName.trim();

  // Finished matches per team
  const finishedMatchesByTeam = new Map<string, number>();
  for (const m of matches) {
    if (m.isFinished) {
      finishedMatchesByTeam.set(m.homeTeam, (finishedMatchesByTeam.get(m.homeTeam) || 0) + 1);
      finishedMatchesByTeam.set(m.awayTeam, (finishedMatchesByTeam.get(m.awayTeam) || 0) + 1);
    }
  }

  for (const m of matches) {
    if (!m.isFinished || !Array.isArray(m.goals)) continue;

    for (const g of m.goals) {
      if (g.player && g.player.trim().toLowerCase() === targetKey) {
        canonicalName = g.player.trim();
        if (g.team) teamsSet.add(g.team);
        const opponent = g.team === m.homeTeam ? m.awayTeam : m.homeTeam;
        goalEvents.push({
          matchId: m.id,
          roundLabel: m.roundLabel,
          stage: m.stage,
          team: g.team,
          opponent,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          minute: g.minute,
          assistPlayer: g.assistPlayer,
        });
      }

      if (g.assistPlayer && g.assistPlayer.trim().toLowerCase() === targetKey) {
        canonicalName = g.assistPlayer.trim();
        if (g.team) teamsSet.add(g.team);
        const opponent = g.team === m.homeTeam ? m.awayTeam : m.homeTeam;
        assistEvents.push({
          matchId: m.id,
          roundLabel: m.roundLabel,
          stage: m.stage,
          team: g.team,
          opponent,
          homeTeam: m.homeTeam,
          awayTeam: m.awayTeam,
          homeScore: m.homeScore,
          awayScore: m.awayScore,
          minute: g.minute,
          scorer: g.player,
        });
      }
    }
  }

  const teams = Array.from(teamsSet);
  if (teams.length === 0 && goalEvents.length === 0 && assistEvents.length === 0) {
    return null;
  }

  const totalGoals = goalEvents.length;
  const totalAssists = assistEvents.length;
  const totalContributions = totalGoals + totalAssists;
  const matchesPlayed = teams.reduce((acc, t) => acc + (finishedMatchesByTeam.get(t) || 0), 0);

  const avgGoals = matchesPlayed > 0 ? Number((totalGoals / matchesPlayed).toFixed(2)) : 0;
  const avgAssists = matchesPlayed > 0 ? Number((totalAssists / matchesPlayed).toFixed(2)) : 0;
  const avgContributions = matchesPlayed > 0 ? Number((totalContributions / matchesPlayed).toFixed(2)) : 0;

  const byTeam: PlayerTeamBreakdown[] = teams.map(t => {
    const tGoals = goalEvents.filter(e => e.team === t).length;
    const tAssists = assistEvents.filter(e => e.team === t).length;
    const tContrib = tGoals + tAssists;
    const tMatches = finishedMatchesByTeam.get(t) || 0;
    return {
      team: t,
      goals: tGoals,
      assists: tAssists,
      contributions: tContrib,
      matchesPlayed: tMatches,
      avgGoals: tMatches > 0 ? Number((tGoals / tMatches).toFixed(2)) : 0,
      avgAssists: tMatches > 0 ? Number((tAssists / tMatches).toFixed(2)) : 0,
    };
  }).sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  return {
    name: canonicalName,
    teams,
    primaryTeam: teams[0] || '',
    goals: totalGoals,
    assists: totalAssists,
    contributions: totalContributions,
    matchesPlayed,
    avgGoals,
    avgAssists,
    avgContributions,
    byTeam,
    goalEvents: goalEvents.sort((a, b) => a.matchId - b.matchId || a.minute - b.minute),
    assistEvents: assistEvents.sort((a, b) => a.matchId - b.matchId || a.minute - b.minute),
  };
}

// Generate comprehensive Team Profile with complete match records and team top scorers
export function getTeamProfile(
  teamName: string,
  matches: Match[],
  groupStandings: Record<string, GroupStanding[]>
): TeamProfile | null {
  if (!teamName || !teamName.trim()) return null;
  const tName = teamName.trim();

  // Find team group
  let group = '';
  for (const [grp, teams] of Object.entries(GROUPS)) {
    if (teams.includes(tName)) {
      group = grp;
      break;
    }
  }

  // Matches involving this team
  const teamMatches = matches.filter(
    m => m.homeTeam === tName || m.awayTeam === tName
  );

  let played = 0;
  let won = 0;
  let drawn = 0;
  let lost = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let points = 0;

  const matchSummaries: TeamProfile['matches'] = [];
  const scorerMap = new Map<string, { player: string; goals: number; assists: number }>();

  for (const m of teamMatches) {
    const isHome = m.homeTeam === tName;
    const opponent = isHome ? m.awayTeam : m.homeTeam;

    if (m.isFinished && m.homeScore !== undefined && m.awayScore !== undefined) {
      played += 1;
      const scored = isHome ? m.homeScore : m.awayScore;
      const conceded = isHome ? m.awayScore : m.homeScore;
      goalsFor += scored;
      goalsAgainst += conceded;

      let result: 'win' | 'draw' | 'loss' = 'draw';
      if (m.stage === 'group') {
        if (scored > conceded) {
          result = 'win';
          won += 1;
          points += 3;
        } else if (scored < conceded) {
          result = 'loss';
          lost += 1;
        } else {
          result = 'draw';
          drawn += 1;
          points += 1;
        }
      } else {
        // Knockout
        if (m.winnerTeam === tName) {
          result = 'win';
          won += 1;
          points += 3;
        } else {
          result = 'loss';
          lost += 1;
        }
      }

      const teamGoals = (m.goals || []).filter(g => g.team === tName);
      for (const g of teamGoals) {
        if (g.player && g.player.trim()) {
          const p = g.player.trim();
          const pKey = p.toLowerCase();
          if (!scorerMap.has(pKey)) {
            scorerMap.set(pKey, { player: p, goals: 0, assists: 0 });
          }
          scorerMap.get(pKey)!.goals += 1;
        }
        if (g.assistPlayer && g.assistPlayer.trim()) {
          const a = g.assistPlayer.trim();
          const aKey = a.toLowerCase();
          if (!scorerMap.has(aKey)) {
            scorerMap.set(aKey, { player: a, goals: 0, assists: 0 });
          }
          scorerMap.get(aKey)!.assists += 1;
        }
      }

      matchSummaries.push({
        match: m,
        opponent,
        isHome,
        result,
        scoreText: `${scored} × ${conceded}`,
        teamGoals,
      });
    } else {
      matchSummaries.push({
        match: m,
        opponent,
        isHome,
        result: 'pending',
        scoreText: 'A disputar',
        teamGoals: [],
      });
    }
  }

  const goalDifference = goalsFor - goalsAgainst;
  const avgGoalsFor = played > 0 ? Number((goalsFor / played).toFixed(2)) : 0;
  const avgGoalsAgainst = played > 0 ? Number((goalsAgainst / played).toFixed(2)) : 0;
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0;

  const scorers = Array.from(scorerMap.values())
    .map(s => ({
      player: s.player,
      goals: s.goals,
      assists: s.assists,
      contributions: s.goals + s.assists,
    }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists || a.player.localeCompare(b.player));

  return {
    team: tName,
    group: group || 'Mata-mata',
    played,
    won,
    drawn,
    lost,
    goalsFor,
    goalsAgainst,
    goalDifference,
    points,
    avgGoalsFor,
    avgGoalsAgainst,
    winRate,
    matches: matchSummaries,
    scorers,
  };
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
