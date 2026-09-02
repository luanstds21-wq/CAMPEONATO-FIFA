import React from 'react';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Flame,
  Goal,
  Shield,
  Sparkles,
  Target,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { TeamBadge } from './TeamBadge';

export const TeamProfileModal: React.FC = () => {
  const {
    selectedTeamName,
    setSelectedTeamName,
    getTeamProfile,
    setSelectedPlayerName,
  } = useTournament();

  if (!selectedTeamName) return null;

  const profile = getTeamProfile(selectedTeamName);

  if (!profile) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
          <Shield className="w-12 h-12 text-slate-500 mx-auto" />
          <h3 className="text-lg font-bold text-white">Equipe não encontrada</h3>
          <p className="text-xs text-slate-400">
            Nenhuma informação encontrada para "{selectedTeamName}".
          </p>
          <button
            onClick={() => setSelectedTeamName(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={() => setSelectedTeamName(null)}
    >
      <div
        className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between relative">
          <div className="flex items-center gap-4">
            <TeamBadge name={profile.team} size="lg" />

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {profile.team}
                </h2>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                  {profile.group.length === 1 ? `Grupo ${profile.group}` : profile.group}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Campanha consolidada no Campeonato FIFA com 48 Equipes
              </p>
            </div>
          </div>

          <button
            onClick={() => setSelectedTeamName(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
          {/* Main Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Jogos e Pontos */}
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Jogos / Pontos
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {profile.played} <span className="text-slate-500 text-sm font-normal">jogos</span>
              </div>
              <div className="text-xs font-bold text-emerald-400 font-mono">
                {profile.points} PTS ({profile.winRate}%)
              </div>
            </div>

            {/* Vitórias / Empates / Derrotas */}
            <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                V / E / D
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono">
                <span className="text-emerald-400">{profile.won}</span>
                <span className="text-slate-600 mx-1">-</span>
                <span className="text-slate-400">{profile.drawn}</span>
                <span className="text-slate-600 mx-1">-</span>
                <span className="text-rose-400">{profile.lost}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {profile.won} vitórias conquistadas
              </div>
            </div>

            {/* Ataque (Gols Marcados) */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Flame className="w-3 h-3" /> Gols Pró (GP)
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {profile.goalsFor}
              </div>
              <div className="text-[10px] text-slate-400">
                Média: {profile.avgGoalsFor} / jogo
              </div>
            </div>

            {/* Defesa e Saldo */}
            <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-3 text-center space-y-1">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" /> Defesa (GC)
              </span>
              <div className="text-xl sm:text-2xl font-black text-white font-mono">
                {profile.goalsAgainst}
              </div>
              <div className="text-[10px] text-slate-400">
                Saldo: {profile.goalDifference > 0 ? `+${profile.goalDifference}` : profile.goalDifference}
              </div>
            </div>
          </div>

          {/* Team Scorers and Assists */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-400" />
                Artilheiros & Garçons da Equipe ({profile.scorers.length})
              </h3>
              <span className="text-[10px] text-slate-400">Clique no jogador para ver perfil</span>
            </div>

            {profile.scorers.length === 0 ? (
              <div className="text-center py-4 text-xs text-slate-500">
                Nenhum gol ou assistência individual registrado para esta equipe até o momento.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {profile.scorers.map((s, idx) => (
                  <button
                    key={s.player}
                    type="button"
                    onClick={() => {
                      setSelectedTeamName(null);
                      setSelectedPlayerName(s.player);
                    }}
                    className="bg-slate-900 border border-slate-700/60 hover:border-emerald-500 rounded-lg p-2.5 flex items-center justify-between text-left group transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono font-bold group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        {s.player}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono font-bold">
                      <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {s.goals} G
                      </span>
                      {s.assists > 0 && (
                        <span className="text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {s.assists} A
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Matches List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Partidas da Equipe ({profile.matches.length})
            </h3>

            <div className="space-y-2">
              {profile.matches.map(item => {
                const isFinished = item.match.isFinished;
                const resultBadge =
                  item.result === 'win'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : item.result === 'loss'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : item.result === 'draw'
                    ? 'bg-slate-700/30 text-slate-300 border-slate-600'
                    : 'bg-slate-800/40 text-slate-400 border-slate-700';

                const resultLabel =
                  item.result === 'win'
                    ? 'Vitória'
                    : item.result === 'loss'
                    ? 'Derrota'
                    : item.result === 'draw'
                    ? 'Empate'
                    : 'A Jogar';

                return (
                  <div
                    key={item.match.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 space-y-2 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 text-[11px] font-medium">
                        Jogo #{item.match.id} • {item.match.roundLabel}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${resultBadge}`}
                      >
                        {resultLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TeamBadge name={item.opponent} size="sm" showFullName={true} />
                        <span className="text-[11px] text-slate-400">
                          ({item.isHome ? 'Em casa' : 'Fora'})
                        </span>
                      </div>

                      <div className="text-sm font-black font-mono text-white">
                        {isFinished
                          ? `${item.match.homeScore} × ${item.match.awayScore}`
                          : 'A disputar'}
                      </div>
                    </div>

                    {/* Team Goals Scored */}
                    {item.teamGoals.length > 0 && (
                      <div className="pt-1 border-t border-slate-800/80 flex items-center gap-1.5 flex-wrap text-[11px]">
                        <span className="text-slate-500">Gols:</span>
                        {item.teamGoals.map((g, gi) => (
                          <span
                            key={gi}
                            className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] flex items-center gap-1"
                          >
                            ⚽ {g.player} ({g.minute}')
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 p-4 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={() => setSelectedTeamName(null)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Fechar Perfil
          </button>
        </div>
      </div>
    </div>
  );
};
