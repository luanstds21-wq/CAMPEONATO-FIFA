import React from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Goal,
  Sparkles,
  Target,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { TeamBadge } from './TeamBadge';

export const PlayerProfileModal: React.FC = () => {
  const {
    selectedPlayerName,
    setSelectedPlayerName,
    getPlayerProfile,
    setSelectedTeamName,
  } = useTournament();

  if (!selectedPlayerName) return null;

  const profile = getPlayerProfile(selectedPlayerName);

  if (!profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
          <User className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Perfil não encontrado</h3>
          <p className="text-xs text-slate-400">
            Nenhuma estatística individual encontrada para "{selectedPlayerName}".
          </p>
          <button
            onClick={() => setSelectedPlayerName(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const hasMultipleTeams = profile.teams.length > 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setSelectedPlayerName(null)}
    >
      <div
        className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between relative">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg">
              <User className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {profile.name}
                </h2>
                {hasMultipleTeams && (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                    Atuou por {profile.teams.length} equipes
                  </span>
                )}
              </div>

              {/* Teams badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">Equipes no campeonato:</span>
                {profile.teams.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setSelectedPlayerName(null);
                      setSelectedTeamName(t);
                    }}
                    className="hover:scale-105 transition-transform"
                    title={`Ver perfil de ${t}`}
                  >
                    <TeamBadge name={t} size="sm" showFullName={true} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => setSelectedPlayerName(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Main Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Gols */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-md">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                ⚽ Gols
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {profile.goals}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Média: {profile.avgGoals} / jogo
              </span>
            </div>

            {/* Assistências */}
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-md">
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                🎯 Assistências
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {profile.assists}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Média: {profile.avgAssists} / jogo
              </span>
            </div>

            {/* Participações em Gols */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-md">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                ⚡ Participações
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {profile.contributions}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                Gols + Assistências
              </span>
            </div>

            {/* Média Total */}
            <div className="bg-slate-900/90 border border-purple-500/30 rounded-xl p-3.5 flex flex-col items-center justify-center text-center shadow-md">
              <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                📊 Part./Jogo
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                {profile.avgContributions}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {profile.matchesPlayed} partidas registradas
              </span>
            </div>
          </div>

          {/* Breakdown by Team (Multiple Teams Breakdown) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Desempenho Somado por Equipe
              </h3>
              <span className="text-[11px] text-slate-400">
                Total acumulado: {profile.goals} gols e {profile.assists} assistências
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {profile.byTeam.map(b => (
                <div
                  key={b.team}
                  onClick={() => {
                    setSelectedPlayerName(null);
                    setSelectedTeamName(b.team);
                  }}
                  className="bg-slate-900 border border-slate-700/60 hover:border-emerald-500/50 rounded-lg p-3 cursor-pointer transition-all hover:bg-slate-850 flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <TeamBadge name={b.team} size="sm" showFullName={true} />
                    <div className="text-[11px] text-slate-400 flex items-center gap-2">
                      <span>{b.matchesPlayed} jogos disputados</span>
                      <span>•</span>
                      <span>Média: {b.avgGoals} gols/j</span>
                    </div>
                  </div>

                  <div className="text-right space-y-0.5">
                    <div className="text-xs font-mono font-bold text-white">
                      <span className="text-emerald-400 font-extrabold">{b.goals}</span>G /{' '}
                      <span className="text-cyan-400 font-extrabold">{b.assists}</span>A
                    </div>
                    <div className="text-[10px] text-amber-400 font-mono font-semibold">
                      {b.contributions} participações
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals scored in matches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                ⚽ Partidas em que Marcou Gol ({profile.goalEvents.length})
              </h3>
              <span className="text-[10px] text-slate-400">Ordenado por cronologia</span>
            </div>

            {profile.goalEvents.length === 0 ? (
              <div className="text-center py-4 bg-slate-900/40 rounded-lg border border-slate-800 text-xs text-slate-500">
                Nenhum gol registrado para este jogador.
              </div>
            ) : (
              <div className="space-y-2">
                {profile.goalEvents.map((evt, i) => (
                  <div
                    key={`${evt.matchId}_${evt.minute}_${i}`}
                    className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono font-bold border border-emerald-500/20">
                        {evt.minute}'
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{evt.homeTeam}</span>
                          <span className="text-slate-400 font-mono font-normal">
                            {evt.homeScore} × {evt.awayScore}
                          </span>
                          <span>{evt.awayTeam}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>Pelo time:</span>
                          <span className="text-emerald-400 font-medium">{evt.team}</span>
                          <span>contra</span>
                          <span className="text-slate-300 font-medium">{evt.opponent}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {evt.assistPlayer ? (
                        <span className="text-[11px] text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          🅰️ Assistência: {evt.assistPlayer}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Sem assistência</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assists in matches */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                🎯 Assistências Fornecidas ({profile.assistEvents.length})
              </h3>
              <span className="text-[10px] text-slate-400">Ordenado por cronologia</span>
            </div>

            {profile.assistEvents.length === 0 ? (
              <div className="text-center py-4 bg-slate-900/40 rounded-lg border border-slate-800 text-xs text-slate-500">
                Nenhuma assistência registrada para este jogador.
              </div>
            ) : (
              <div className="space-y-2">
                {profile.assistEvents.map((evt, i) => (
                  <div
                    key={`${evt.matchId}_${evt.minute}_${i}`}
                    className="bg-slate-900/70 border border-slate-800 rounded-lg p-2.5 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono font-bold border border-cyan-500/20">
                        {evt.minute}'
                      </span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-white">
                          <span>{evt.homeTeam}</span>
                          <span className="text-slate-400 font-mono font-normal">
                            {evt.homeScore} × {evt.awayScore}
                          </span>
                          <span>{evt.awayTeam}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <span>Pelo time:</span>
                          <span className="text-cyan-400 font-medium">{evt.team}</span>
                          <span>contra</span>
                          <span className="text-slate-300 font-medium">{evt.opponent}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      {evt.scorer ? (
                        <span className="text-[11px] text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          ⚽ Gol de: {evt.scorer}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Gol registrado</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 p-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => setSelectedPlayerName(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Fechar Perfil
          </button>
        </div>
      </div>
    </div>
  );
};
