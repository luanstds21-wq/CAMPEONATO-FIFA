import React, { useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  Crown,
  Flame,
  Gamepad2,
  Info,
  PlayCircle,
  Sparkles,
  Trophy,
  X,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { Match } from '../types/tournament';
import { TeamBadge } from './TeamBadge';

interface BracketViewProps {
  onOpenMatch: (match: Match) => void;
}

export const BracketView: React.FC<BracketViewProps> = ({ onOpenMatch }) => {
  const { knockoutMatches, matches } = useTournament();

  const [activeStageTab, setActiveStageTab] = useState<
    'all' | 'round_32' | 'round_16' | 'quarter' | 'semi' | 'final'
  >('all');

  // Categorize knockout matches
  const round32 = knockoutMatches.filter(m => m.stage === 'round_32'); // 73 to 88 (16 matches)
  const round16 = knockoutMatches.filter(m => m.stage === 'round_16'); // 89 to 96 (8 matches)
  const quarters = knockoutMatches.filter(m => m.stage === 'quarter'); // 97 to 100 (4 matches)
  const semis = knockoutMatches.filter(m => m.stage === 'semi'); // 101 to 102 (2 matches)
  const finalMatch = knockoutMatches.find(m => m.stage === 'final'); // 103 (1 match)

  const isChampionCrown = finalMatch?.isFinished && finalMatch.winnerTeam;

  const stageTabs = [
    { id: 'all', label: 'Chaveamento Completo' },
    { id: 'round_32', label: '16-Avos (16 Jogos)' },
    { id: 'round_16', label: 'Oitavas (8 Jogos)' },
    { id: 'quarter', label: 'Quartas (4 Jogos)' },
    { id: 'semi', label: 'Semifinais (2 Jogos)' },
    { id: 'final', label: 'Grande Final (1 Jogo)' },
  ];

  // Helper renderer for a single knockout match card
  const renderMatchCard = (m: Match, compact = false) => {
    const isUserHome = m.userControls === m.homeTeam && Boolean(m.homeTeam);
    const isUserAway = m.userControls === m.awayTeam && Boolean(m.awayTeam);
    const isHomeWinner = m.isFinished && m.winnerTeam === m.homeTeam;
    const isAwayWinner = m.isFinished && m.winnerTeam === m.awayTeam;

    return (
      <div
        key={m.id}
        onClick={() => onOpenMatch(m)}
        className={`group bg-[#0f172a] hover:bg-[#131d33] border rounded-xl p-3.5 shadow-md cursor-pointer transition-all duration-200 hover:scale-[1.01] flex flex-col justify-between ${
          m.isFinished
            ? 'border-slate-800 hover:border-slate-700'
            : 'border-slate-700/80 hover:border-emerald-500/60'
        } ${compact ? 'min-w-[260px]' : 'w-full'}`}
      >
        <div className="space-y-2">
          {/* Match Header */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-mono font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              Jogo {m.id < 10 ? `0${m.id}` : m.id}
            </span>
            <span className="text-slate-400 font-medium">
              {m.isFinished ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Finalizado
                </span>
              ) : (
                <span className="text-slate-500">Pendente</span>
              )}
            </span>
          </div>

          {/* User Controls Banner */}
          <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-lg px-2 py-1 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 min-w-0">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-300 font-bold truncate">
                Controle: <span className="text-white font-extrabold">{m.userControls || 'A definir'}</span>
              </span>
            </div>
            <span className="text-[9px] text-emerald-400 font-mono font-bold">FIFA</span>
          </div>

          {/* Home & Away Rows */}
          <div className="space-y-1.5 pt-1">
            {/* Home Row */}
            <div
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                isHomeWinner
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-white font-bold'
                  : m.isFinished && !isHomeWinner
                  ? 'bg-slate-900/60 text-slate-400 opacity-70'
                  : 'bg-slate-900/80 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {m.homeTeam ? (
                  <TeamBadge name={m.homeTeam} size="sm" showFullName={true} isUserTeam={isUserHome} />
                ) : (
                  <span className="text-xs text-slate-500 font-mono italic">
                    {m.homePlaceholder || 'A definir'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isHomeWinner && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                {m.isFinished && (
                  <span className="font-mono text-sm font-extrabold text-white">
                    {m.homeScore}
                    {m.decisionType === 'penalties' && (
                      <span className="text-[10px] text-amber-400 font-normal ml-0.5">
                        ({m.homePenalties})
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>

            {/* Away Row */}
            <div
              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                isAwayWinner
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-white font-bold'
                  : m.isFinished && !isAwayWinner
                  ? 'bg-slate-900/60 text-slate-400 opacity-70'
                  : 'bg-slate-900/80 text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {m.awayTeam ? (
                  <TeamBadge name={m.awayTeam} size="sm" showFullName={true} isUserTeam={isUserAway} />
                ) : (
                  <span className="text-xs text-slate-500 font-mono italic">
                    {m.awayPlaceholder || 'A definir'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {isAwayWinner && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                {m.isFinished && (
                  <span className="font-mono text-sm font-extrabold text-white">
                    {m.awayScore}
                    {m.decisionType === 'penalties' && (
                      <span className="text-[10px] text-amber-400 font-normal ml-0.5">
                        ({m.awayPenalties})
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span>{m.roundLabel}</span>
          <span className="text-emerald-400 font-bold group-hover:underline">
            {m.isFinished ? 'Editar' : 'Registrar'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Chaveamento do Mata-Mata
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Chaveamento definitivo de 16-Avos até a Grande Final. Preenchimento 100% automático conforme os resultados dos grupos!
            </p>
          </div>

          {/* Champion Highlight if finished */}
          {isChampionCrown && (
            <div className="bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-400/60 rounded-xl p-3 flex items-center gap-3 shadow-lg shadow-amber-500/10">
              <Crown className="w-7 h-7 text-amber-400 animate-bounce" />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300">
                  🏆 CAMPEÃO DO TORNEIO
                </div>
                <div className="text-base font-black text-white">{finalMatch.winnerTeam}</div>
              </div>
            </div>
          )}
        </div>

        {/* Stage Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {stageTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveStageTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeStageTab === tab.id
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-extrabold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Complete Horizontal Bracket Tree (When 'all' is selected) */}
      {activeStageTab === 'all' && (
        <div className="space-y-6">
          <div className="bg-[#0b101b] border border-slate-800 rounded-2xl p-4 sm:p-6 overflow-x-auto shadow-2xl">
            <div className="min-w-[1280px] grid grid-cols-5 gap-6 items-start">
              {/* Column 1: 16-AVOS (16 Games) */}
              <div className="space-y-3">
                <div className="sticky top-0 bg-[#0b101b] py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">
                    ⚡ 16-Avos (16j)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Jogos 73-88</span>
                </div>
                <div className="space-y-3">{round32.map(m => renderMatchCard(m, true))}</div>
              </div>

              {/* Column 2: OITAVAS (8 Games) */}
              <div className="space-y-3">
                <div className="sticky top-0 bg-[#0b101b] py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    🥊 Oitavas (8j)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Jogos 89-96</span>
                </div>
                <div className="space-y-6 pt-4">{round16.map(m => renderMatchCard(m, true))}</div>
              </div>

              {/* Column 3: QUARTAS (4 Games) */}
              <div className="space-y-3">
                <div className="sticky top-0 bg-[#0b101b] py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-orange-400">
                    🏆 Quartas (4j)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Jogos 97-100</span>
                </div>
                <div className="space-y-12 pt-10">{quarters.map(m => renderMatchCard(m, true))}</div>
              </div>

              {/* Column 4: SEMIFINAIS (2 Games) */}
              <div className="space-y-3">
                <div className="sticky top-0 bg-[#0b101b] py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400">
                    🔥 Semifinais (2j)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Jogos 101-102</span>
                </div>
                <div className="space-y-24 pt-20">{semis.map(m => renderMatchCard(m, true))}</div>
              </div>

              {/* Column 5: FINAL (1 Game) & PODIUM */}
              <div className="space-y-3">
                <div className="sticky top-0 bg-[#0b101b] py-2 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-yellow-400">
                    👑 Grande Final
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Jogo 103</span>
                </div>

                <div className="pt-32 space-y-6">
                  {finalMatch && renderMatchCard(finalMatch, true)}

                  {/* Champion Trophy Showcase Box */}
                  <div className="bg-gradient-to-b from-amber-500/15 via-slate-900 to-slate-950 border-2 border-amber-400/50 rounded-2xl p-5 text-center space-y-3 shadow-xl">
                    <div className="w-14 h-14 mx-auto rounded-full bg-amber-400/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/20">
                      <Trophy className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-amber-300 uppercase tracking-widest">
                        Taça FIFA Champions
                      </div>
                      <div className="text-lg font-black text-white mt-1">
                        {isChampionCrown ? finalMatch.winnerTeam : 'A definir'}
                      </div>
                    </div>
                    {isChampionCrown && (
                      <span className="inline-block px-3 py-1 bg-emerald-500 text-black font-extrabold text-xs rounded-full shadow-md">
                        🎉 Campeão Consagrado!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Individual Stage Tab Views (Responsive Grids) */}
      {activeStageTab === 'round_32' && (
        <div className="space-y-4">
          <div className="text-sm font-bold text-slate-300">
            16-Avos de Final (Jogos 73 a 88) — 32 Equipes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {round32.map(m => renderMatchCard(m))}
          </div>
        </div>
      )}

      {activeStageTab === 'round_16' && (
        <div className="space-y-4">
          <div className="text-sm font-bold text-slate-300">
            Oitavas de Final (Jogos 89 a 96) — 16 Equipes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {round16.map(m => renderMatchCard(m))}
          </div>
        </div>
      )}

      {activeStageTab === 'quarter' && (
        <div className="space-y-4">
          <div className="text-sm font-bold text-slate-300">
            Quartas de Final (Jogos 97 a 100) — 8 Equipes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quarters.map(m => renderMatchCard(m))}
          </div>
        </div>
      )}

      {activeStageTab === 'semi' && (
        <div className="space-y-4">
          <div className="text-sm font-bold text-slate-300">
            Semifinais (Jogos 101 e 102) — 4 Equipes
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {semis.map(m => renderMatchCard(m))}
          </div>
        </div>
      )}

      {activeStageTab === 'final' && finalMatch && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="text-sm font-bold text-slate-300 text-center">
            A Grande Final do Torneio (Jogo 103)
          </div>
          {renderMatchCard(finalMatch)}

          {/* Trophy Podium */}
          <div className="bg-gradient-to-b from-amber-500/20 via-slate-900 to-slate-950 border-2 border-amber-400/60 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-amber-400/20 border-2 border-amber-400/60 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/30">
              <Crown className="w-9 h-9" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                Campeão do Torneio
              </div>
              <div className="text-2xl font-extrabold text-white mt-1">
                {isChampionCrown ? finalMatch.winnerTeam : 'Aguardando Disputa da Final'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
