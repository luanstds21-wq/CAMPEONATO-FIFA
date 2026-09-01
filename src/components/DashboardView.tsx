import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Gamepad2,
  Goal,
  Medal,
  PlayCircle,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { Match } from '../types/tournament';
import { TeamBadge } from './TeamBadge';

interface DashboardViewProps {
  onOpenMatch: (match: Match) => void;
  onNavigateTab: (tab: 'dashboard' | 'standings' | 'matches' | 'stats' | 'bracket') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onOpenMatch, onNavigateTab }) => {
  const {
    matches,
    totalMatchesPlayed,
    totalGoalsScored,
    nextUnplayedMatch,
    nextUserMatch,
    groupStandings,
    topScorers,
    topAssists,
    leastConceded,
  } = useTournament();

  const totalMatches = 103;
  const remainingMatches = totalMatches - totalMatchesPlayed;
  const avgGoalsPerMatch = totalMatchesPlayed > 0 ? (totalGoalsScored / totalMatchesPlayed).toFixed(2) : '0.00';

  // Group leaders
  const groupLeaders = Object.entries(groupStandings).map(([grp, list]) => ({
    group: grp,
    leader: list[0]?.team || 'A definir',
    points: list[0]?.points || 0,
    played: list[0]?.played || 0,
    goalsFor: list[0]?.goalsFor || 0,
  }));

  // Current Tournament Phase description
  const groupStageMatches = matches.slice(0, 72);
  const groupStageFinishedCount = groupStageMatches.filter(m => m.isFinished).length;
  const isGroupStageDone = groupStageFinishedCount === 72;

  const r32Matches = matches.slice(72, 88);
  const r32FinishedCount = r32Matches.filter(m => m.isFinished).length;

  const r16Matches = matches.slice(88, 96);
  const r16FinishedCount = r16Matches.filter(m => m.isFinished).length;

  const qfMatches = matches.slice(96, 100);
  const qfFinishedCount = qfMatches.filter(m => m.isFinished).length;

  const sfMatches = matches.slice(100, 102);
  const sfFinishedCount = sfMatches.filter(m => m.isFinished).length;

  const finalMatch = matches[102];
  const isFinalDone = Boolean(finalMatch?.isFinished);

  let currentPhaseLabel = 'Fase de Grupos (72 Jogos)';
  if (isFinalDone) {
    currentPhaseLabel = `🏆 Campeão: ${finalMatch?.winnerTeam || 'Definido'}`;
  } else if (sfFinishedCount === 2) {
    currentPhaseLabel = '👑 Grande Final';
  } else if (qfFinishedCount === 4) {
    currentPhaseLabel = '🔥 Semifinais';
  } else if (r16FinishedCount === 8) {
    currentPhaseLabel = '🏆 Quartas de Final';
  } else if (r32FinishedCount === 16) {
    currentPhaseLabel = '🥊 Oitavas de Final';
  } else if (isGroupStageDone) {
    currentPhaseLabel = '⚡ 16-Avos de Final (Mata-Mata)';
  }

  // Recent finished matches (last 4)
  const recentFinished = [...matches]
    .filter(m => m.isFinished)
    .sort((a, b) => {
      const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 4);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#10192e] via-[#0f172a] to-[#09101f] border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              PAINEL OFICIAL DO CAMPEONATO
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Torneio FIFA <span className="text-emerald-400">48 Times</span>
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              12 Grupos • 72 Jogos de Classificação • 8 Melhores Terceiros • Mata-Mata em 5 Fases.
              Abra a partida, verifique qual time você controla no FIFA e registre o resultado!
            </p>
          </div>

          {/* Quick status pill */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl p-4 flex flex-col items-start md:items-end gap-1 shadow-inner shrink-0">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Fase Atual do Torneio
            </span>
            <div className="text-sm sm:text-base font-extrabold text-emerald-400 flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              {currentPhaseLabel}
            </div>
            <span className="text-xs text-slate-400 font-mono mt-1">
              Progresso: {totalMatchesPlayed} / 103 ({Math.round((totalMatchesPlayed / 103) * 100)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Key Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Jogos Realizados */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Jogos Realizados</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              {totalMatchesPlayed}
              <span className="text-xs text-slate-500 font-normal ml-1">/ {totalMatches}</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Jogos Restantes */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Jogos Restantes</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono">
              {remainingMatches}
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Gols Marcados */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Gols Marcados</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400 font-mono">
              {totalGoalsScored}
              <span className="text-xs text-slate-500 font-normal ml-1">({avgGoalsPerMatch}/j)</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center">
            <Goal className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* Total de Times */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 sm:p-5 flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-400">Equipes em Disputa</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-400 font-mono">
              48
              <span className="text-xs text-slate-500 font-normal ml-1">em 12 grps</span>
            </div>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
            <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      {/* Featured Match Cards: MEU PRÓXIMO JOGO & PRÓXIMO JOGO GERAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: 🎮 MEU PRÓXIMO JOGO (Priority user match) */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#122320] via-[#0d1c1a] to-[#0a1215] border-2 border-emerald-500/50 p-5 sm:p-6 shadow-xl shadow-emerald-950/40 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500 text-black">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-300 uppercase tracking-wider">
                  Seu Próximo Jogo a Disputar
                </span>
              </div>

              {nextUserMatch && (
                <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/30">
                  Jogo {nextUserMatch.id < 10 ? `0${nextUserMatch.id}` : nextUserMatch.id}
                </span>
              )}
            </div>

            {nextUserMatch ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-300 font-medium">
                  {nextUserMatch.roundLabel} {nextUserMatch.group ? `• Grupo ${nextUserMatch.group}` : ''}
                </div>

                {/* Matchup Banner */}
                <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4">
                  <div className="grid grid-cols-7 items-center gap-2 text-center">
                    <div className="col-span-3 flex flex-col items-center gap-2">
                      <TeamBadge
                        name={nextUserMatch.homeTeam}
                        size="lg"
                        showFullName={false}
                        isUserTeam={nextUserMatch.userControls === nextUserMatch.homeTeam}
                      />
                      <span className="text-sm sm:text-base font-extrabold text-white truncate max-w-full">
                        {nextUserMatch.homeTeam}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col items-center">
                      <span className="text-xs font-mono text-emerald-400 font-extrabold">VS</span>
                    </div>

                    <div className="col-span-3 flex flex-col items-center gap-2">
                      <TeamBadge
                        name={nextUserMatch.awayTeam}
                        size="lg"
                        showFullName={false}
                        isUserTeam={nextUserMatch.userControls === nextUserMatch.awayTeam}
                      />
                      <span className="text-sm sm:text-base font-extrabold text-white truncate max-w-full">
                        {nextUserMatch.awayTeam}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Você Controla Tag */}
                <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                    <div>
                      <div className="text-[11px] text-emerald-400 font-medium">Você controla no FIFA:</div>
                      <div className="text-base font-black text-white">{nextUserMatch.userControls}</div>
                    </div>
                  </div>

                  <span className="text-[11px] text-emerald-300 font-semibold px-2 py-0.5 bg-emerald-500/20 rounded">
                    FIFA 🎮
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                🎉 Todos os seus jogos já foram finalizados!
              </div>
            )}
          </div>

          {nextUserMatch && (
            <button
              onClick={() => onOpenMatch(nextUserMatch)}
              className="mt-5 w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:scale-[1.01] transition-all"
            >
              <PlayCircle className="w-5 h-5" />
              REGISTRAR RESULTADO
            </button>
          )}
        </div>

        {/* Card 2: 🗓️ PRÓXIMO JOGO DA TABELA GERAL */}
        <div className="rounded-2xl bg-gradient-to-br from-[#131d33] via-[#0f172a] to-[#0c1220] border border-slate-700/80 p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  <Swords className="w-4 h-4" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold text-blue-300 uppercase tracking-wider">
                  Próximo Jogo da Sequência
                </span>
              </div>

              {nextUnplayedMatch && (
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 text-xs font-mono font-bold border border-slate-700">
                  Jogo {nextUnplayedMatch.id < 10 ? `0${nextUnplayedMatch.id}` : nextUnplayedMatch.id}
                </span>
              )}
            </div>

            {nextUnplayedMatch ? (
              <div className="space-y-4">
                <div className="text-xs text-slate-400 font-medium">
                  {nextUnplayedMatch.roundLabel} {nextUnplayedMatch.group ? `• Grupo ${nextUnplayedMatch.group}` : ''}
                </div>

                {/* Matchup Banner */}
                <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4">
                  <div className="grid grid-cols-7 items-center gap-2 text-center">
                    <div className="col-span-3 flex flex-col items-center gap-2">
                      <TeamBadge
                        name={nextUnplayedMatch.homeTeam}
                        size="lg"
                        showFullName={false}
                        isUserTeam={nextUnplayedMatch.userControls === nextUnplayedMatch.homeTeam}
                      />
                      <span className="text-sm sm:text-base font-extrabold text-white truncate max-w-full">
                        {nextUnplayedMatch.homeTeam}
                      </span>
                    </div>

                    <div className="col-span-1 flex flex-col items-center">
                      <span className="text-xs font-mono text-slate-400 font-extrabold">VS</span>
                    </div>

                    <div className="col-span-3 flex flex-col items-center gap-2">
                      <TeamBadge
                        name={nextUnplayedMatch.awayTeam}
                        size="lg"
                        showFullName={false}
                        isUserTeam={nextUnplayedMatch.userControls === nextUnplayedMatch.awayTeam}
                      />
                      <span className="text-sm sm:text-base font-extrabold text-white truncate max-w-full">
                        {nextUnplayedMatch.awayTeam}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="text-[11px] text-slate-400">Você controla:</div>
                      <div className="text-sm font-bold text-white">{nextUnplayedMatch.userControls}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    Status: Não jogado
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-sm text-slate-400">
                🏆 Todos os 103 jogos do campeonato foram concluídos!
              </div>
            )}
          </div>

          {nextUnplayedMatch && (
            <button
              onClick={() => onOpenMatch(nextUnplayedMatch)}
              className="mt-5 w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all hover:border-slate-500"
            >
              <PlayCircle className="w-5 h-5 text-emerald-400" />
              REGISTRAR RESULTADO
            </button>
          )}
        </div>
      </div>

      {/* Líderes dos Grupos (A a L) */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-extrabold text-white">Líderes dos 12 Grupos</h2>
          </div>
          <button
            onClick={() => onNavigateTab('standings')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            Ver Classificação Completa
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {groupLeaders.map(item => (
            <div
              key={item.group}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-col space-y-2 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-400 font-mono">Grupo {item.group}</span>
                <span className="text-slate-400 font-mono">{item.points} pts</span>
              </div>
              <div className="flex items-center gap-2 min-w-0">
                <TeamBadge name={item.leader} size="sm" showFullName={false} />
                <span className="text-xs font-bold text-white truncate">{item.leader}</span>
              </div>
              <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-800/80 font-mono">
                <span>{item.played}j</span>
                <span>{item.goalsFor} GP</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two columns: Recent Results & Top Scorers preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Results */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Últimos Resultados Salvos</h2>
            </div>
            <button
              onClick={() => onNavigateTab('matches')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Ver todos os jogos <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {recentFinished.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Nenhuma partida foi jogada ainda. Escolha um jogo para começar!
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentFinished.map(m => (
                <div
                  key={m.id}
                  onClick={() => onOpenMatch(m)}
                  className="bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono font-bold text-emerald-400 border border-slate-700">
                      J{m.id < 10 ? `0${m.id}` : m.id}
                    </span>
                    <div className="flex items-center gap-2 text-xs font-semibold text-white truncate">
                      <span className={m.winnerTeam === m.homeTeam ? 'text-emerald-300 font-bold' : ''}>
                        {m.homeTeam}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 font-mono font-bold text-emerald-400 rounded">
                        {m.homeScore} × {m.awayScore}
                      </span>
                      <span className={m.winnerTeam === m.awayTeam ? 'text-emerald-300 font-bold' : ''}>
                        {m.awayTeam}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 hover:text-emerald-400 shrink-0 font-medium">
                    Editar
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Scorers Spotlight */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Artilharia do Campeonato</h2>
            </div>
            <button
              onClick={() => onNavigateTab('stats')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              Ver estatísticas <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {topScorers.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              Nenhum gol registrado individualmente até o momento.
            </div>
          ) : (
            <div className="space-y-2.5">
              {topScorers.slice(0, 4).map((p, idx) => (
                <div
                  key={`${p.player}_${p.team}`}
                  className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                          : idx === 1
                          ? 'bg-slate-300/20 text-slate-200 border border-slate-300/40'
                          : idx === 2
                          ? 'bg-amber-700/20 text-amber-600 border border-amber-700/40'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs sm:text-sm font-bold text-white truncate">{p.player}</span>
                      <span className="text-[11px] text-slate-400">{p.team}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-400 font-mono">{p.goals}</span>
                      <span className="text-[10px] text-slate-400 ml-1">gols</span>
                    </div>
                    {p.assists > 0 && (
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-mono">
                        {p.assists} assist.
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
