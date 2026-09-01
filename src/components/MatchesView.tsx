import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Circle,
  Filter,
  Gamepad2,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { Match } from '../types/tournament';
import { TeamBadge } from './TeamBadge';

interface MatchesViewProps {
  onOpenMatch: (match: Match) => void;
}

export const MatchesView: React.FC<MatchesViewProps> = ({ onOpenMatch }) => {
  const { matches } = useTournament();

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PLAYED' | 'PENDING'>('ALL');
  const [myMatchesOnly, setMyMatchesOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filterOptions = [
    { id: 'ALL', label: 'Todos os Jogos (103)' },
    { id: 'R1', label: '🔵 Rodada 1 (01-24)', count: 24 },
    { id: 'R2', label: '🟢 Rodada 2 (25-48)', count: 24 },
    { id: 'R3', label: '🔴 Rodada 3 (49-72)', count: 24 },
    { id: 'R32', label: '⚡ 16-Avos (73-88)', count: 16 },
    { id: 'R16', label: '🥊 Oitavas (89-96)', count: 8 },
    { id: 'QF', label: '🏆 Quartas (97-100)', count: 4 },
    { id: 'SF', label: '🔥 Semifinais (101-102)', count: 2 },
    { id: 'FINAL', label: '👑 Final (103)', count: 1 },
  ];

  // Filter logic
  const filteredMatches = useMemo(() => {
    return matches.filter(m => {
      // Stage / Round filter
      if (activeFilter === 'R1' && !(m.id >= 1 && m.id <= 24)) return false;
      if (activeFilter === 'R2' && !(m.id >= 25 && m.id <= 48)) return false;
      if (activeFilter === 'R3' && !(m.id >= 49 && m.id <= 72)) return false;
      if (activeFilter === 'R32' && !(m.id >= 73 && m.id <= 88)) return false;
      if (activeFilter === 'R16' && !(m.id >= 89 && m.id <= 96)) return false;
      if (activeFilter === 'QF' && !(m.id >= 97 && m.id <= 100)) return false;
      if (activeFilter === 'SF' && !(m.id >= 101 && m.id <= 102)) return false;
      if (activeFilter === 'FINAL' && m.id !== 103) return false;

      // Status filter
      if (statusFilter === 'PLAYED' && !m.isFinished) return false;
      if (statusFilter === 'PENDING' && m.isFinished) return false;

      // "Meus Jogos" filter
      if (myMatchesOnly && (!m.userControls || !m.userControls.trim())) return false;

      // Search query (team name or match number)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumberMatch = `jogo ${m.id}`.includes(q) || `${m.id}` === q;
        const homeMatch = m.homeTeam.toLowerCase().includes(q);
        const awayMatch = m.awayTeam.toLowerCase().includes(q);
        const userMatch = m.userControls.toLowerCase().includes(q);
        const groupMatch = m.group ? `grupo ${m.group}`.toLowerCase().includes(q) : false;
        if (!matchNumberMatch && !homeMatch && !awayMatch && !userMatch && !groupMatch) {
          return false;
        }
      }

      return true;
    });
  }, [matches, activeFilter, statusFilter, myMatchesOnly, searchQuery]);

  // Round headers helper
  const getRoundBadgeColor = (matchId: number) => {
    if (matchId <= 24) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (matchId <= 48) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    if (matchId <= 72) return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    if (matchId <= 88) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (matchId <= 96) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    if (matchId <= 100) return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    if (matchId <= 102) return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-yellow-400/20 text-yellow-300 border-yellow-400/40';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Filter Bar */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Lista de Jogos do Torneio
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Ordem oficial dos 72 jogos da fase de grupos + chaveamento automático do mata-mata.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar time, jogo (ex: 01)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Round Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {filterOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setActiveFilter(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeFilter === opt.id
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-extrabold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sub filters: Status & "Meus Jogos" toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Status:</span>
            <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  statusFilter === 'PENDING'
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ⚪ Pendentes
              </button>
              <button
                onClick={() => setStatusFilter('PLAYED')}
                className={`px-2.5 py-1 rounded transition-colors ${
                  statusFilter === 'PLAYED'
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🟢 Finalizados
              </button>
            </div>
          </div>

          <button
            onClick={() => setMyMatchesOnly(!myMatchesOnly)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              myMatchesOnly
                ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                : 'bg-slate-900 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            🎮 Mostrar Apenas Meus Jogos
          </button>
        </div>
      </div>

      {/* Matches Grid */}
      {filteredMatches.length === 0 ? (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <p className="text-slate-400 text-sm">
            Nenhuma partida encontrada com os filtros selecionados.
          </p>
          <button
            onClick={() => {
              setActiveFilter('ALL');
              setStatusFilter('ALL');
              setMyMatchesOnly(false);
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-400 rounded-lg"
          >
            Limpar Filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMatches.map(m => {
            const isUserHome = m.userControls === m.homeTeam;
            const isUserAway = m.userControls === m.awayTeam;
            const isKnockout = m.stage !== 'group';

            return (
              <div
                key={m.id}
                onClick={() => onOpenMatch(m)}
                className={`relative group bg-[#0f172a] hover:bg-[#131d33] border rounded-2xl p-4 sm:p-5 shadow-lg cursor-pointer transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between ${
                  m.isFinished
                    ? 'border-slate-800 hover:border-slate-700'
                    : 'border-slate-700/80 hover:border-emerald-500/60 shadow-emerald-950/20'
                }`}
              >
                <div className="space-y-3.5">
                  {/* Card Top Row: Match Number, Round, Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono font-extrabold text-white">
                        Jogo {m.id < 10 ? `0${m.id}` : m.id}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getRoundBadgeColor(
                          m.id
                        )}`}
                      >
                        {m.roundLabel} {m.group ? `• Grp ${m.group}` : ''}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {m.isFinished ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" />
                          Finalizado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                          <Circle className="w-2.5 h-2.5 text-slate-500" />
                          Não jogado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* "VOCÊ CONTROLA" Banner (HIGHLIGHTED) */}
                  <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 rounded-xl px-3 py-2 flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-2 min-w-0">
                      <Gamepad2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-xs font-bold text-emerald-300 truncate">
                        Você controla:{' '}
                        <span className="text-white font-extrabold ml-0.5">
                          {m.userControls || 'A definir'}
                        </span>
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">
                      FIFA
                    </span>
                  </div>

                  {/* Match Teams & Score Box */}
                  <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-3">
                    <div className="grid grid-cols-7 items-center gap-2">
                      {/* Home Team */}
                      <div className="col-span-3 flex flex-col items-center text-center gap-1.5">
                        <TeamBadge
                          name={m.homeTeam}
                          size="md"
                          showFullName={false}
                          isUserTeam={isUserHome}
                        />
                        <span
                          className={`text-xs font-bold truncate max-w-full ${
                            m.winnerTeam === m.homeTeam
                              ? 'text-emerald-300'
                              : isUserHome
                              ? 'text-emerald-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {m.homeTeam}
                        </span>
                      </div>

                      {/* Score or VS */}
                      <div className="col-span-1 flex flex-col items-center justify-center">
                        {m.isFinished ? (
                          <div className="flex flex-col items-center">
                            <span className="text-base sm:text-lg font-mono font-black text-emerald-400 tracking-tight">
                              {m.homeScore} × {m.awayScore}
                            </span>
                            {isKnockout && m.decisionType === 'penalties' && (
                              <span className="text-[9px] font-mono text-amber-400">
                                ({m.homePenalties}×{m.awayPenalties} pên)
                              </span>
                            )}
                            {isKnockout && m.decisionType === 'extra_time' && (
                              <span className="text-[9px] font-mono text-amber-400">Prorr.</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs font-mono font-bold text-slate-500">VS</span>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="col-span-3 flex flex-col items-center text-center gap-1.5">
                        <TeamBadge
                          name={m.awayTeam}
                          size="md"
                          showFullName={false}
                          isUserTeam={isUserAway}
                        />
                        <span
                          className={`text-xs font-bold truncate max-w-full ${
                            m.winnerTeam === m.awayTeam
                              ? 'text-emerald-300'
                              : isUserAway
                              ? 'text-emerald-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {m.awayTeam}
                        </span>
                      </div>
                    </div>

                    {/* Goalscorers preview summary */}
                    {m.isFinished && m.goals && m.goals.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 space-y-1">
                        <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2 gap-y-0.5">
                          {m.goals.slice(0, 4).map(g => (
                            <span key={g.id} className="inline-flex items-center gap-1 truncate">
                              <span>⚽</span>
                              <span className="font-semibold text-slate-300">{g.player}</span>
                              <span className="font-mono text-slate-500">({g.minute}')</span>
                            </span>
                          ))}
                          {m.goals.length > 4 && (
                            <span className="text-slate-500 text-[10px]">
                              +{m.goals.length - 4} mais
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action footer */}
                <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-400 group-hover:text-slate-300">
                    {m.isFinished ? 'Clique para editar' : 'Clique para registrar'}
                  </span>

                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
                    <span>{m.isFinished ? 'Editar' : 'Registrar'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
