import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Check,
  ChevronDown,
  Gamepad2,
  Minus,
  Plus,
  RotateCcw,
  Sparkles,
  Trophy,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { DecisionType, Goal, Match } from '../types/tournament';
import { TeamBadge } from './TeamBadge';

interface MatchModalProps {
  match: Match | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MatchModal: React.FC<MatchModalProps> = ({ match, isOpen, onClose }) => {
  const { saveMatch, resetMatch, knownPlayers } = useTournament();

  const [homeScore, setHomeScore] = useState<number>(0);
  const [awayScore, setAwayScore] = useState<number>(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [decisionType, setDecisionType] = useState<DecisionType>('regular');
  const [winnerTeam, setWinnerTeam] = useState<string>('');
  const [homePenalties, setHomePenalties] = useState<number>(0);
  const [awayPenalties, setAwayPenalties] = useState<number>(0);

  // New goal entry state
  const [goalMinute, setGoalMinute] = useState<number>(45);
  const [goalPlayer, setGoalPlayer] = useState<string>('');
  const [goalTeam, setGoalTeam] = useState<string>('');
  const [goalAssist, setGoalAssist] = useState<string>('');
  const [showGoalForm, setShowGoalForm] = useState<boolean>(false);

  // Autocomplete helpers
  const [playerSuggestions, setPlayerSuggestions] = useState<string[]>([]);
  const [assistSuggestions, setAssistSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (match) {
      setHomeScore(match.homeScore ?? 0);
      setAwayScore(match.awayScore ?? 0);
      setGoals(match.goals ? [...match.goals] : []);
      setDecisionType(match.decisionType || 'regular');
      setWinnerTeam(match.winnerTeam || '');
      setHomePenalties(match.homePenalties ?? 0);
      setAwayPenalties(match.awayPenalties ?? 0);
      setGoalTeam(match.homeTeam || '');
      setGoalMinute(45);
      setGoalPlayer('');
      setGoalAssist('');
      setShowGoalForm(false);
    }
  }, [match]);

  if (!isOpen || !match) return null;

  const isKnockout = match.stage !== 'group';

  // Handle Score changes
  const handleScoreChange = (type: 'home' | 'away', delta: number) => {
    if (type === 'home') {
      const next = Math.max(0, homeScore + delta);
      setHomeScore(next);
      if (isKnockout) autoDetermineKnockoutWinner(next, awayScore, decisionType);
    } else {
      const next = Math.max(0, awayScore + delta);
      setAwayScore(next);
      if (isKnockout) autoDetermineKnockoutWinner(homeScore, next, decisionType);
    }
  };

  const autoDetermineKnockoutWinner = (h: number, a: number, dec: DecisionType) => {
    if (h > a) {
      setWinnerTeam(match.homeTeam);
    } else if (a > h) {
      setWinnerTeam(match.awayTeam);
    } else {
      // If tie in knockout, fallback to user control or home
      if (dec === 'regular') {
        setDecisionType('penalties');
      }
      if (!winnerTeam) {
        setWinnerTeam(match.userControls || match.homeTeam);
      }
    }
  };

  // Add goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalPlayer.trim()) return;

    const newGoal: Goal = {
      id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      minute: Math.max(1, Math.min(120, Number(goalMinute) || 1)),
      player: goalPlayer.trim(),
      team: goalTeam || match.homeTeam,
      assistPlayer: goalAssist.trim() ? goalAssist.trim() : undefined,
    };

    const nextGoals = [...goals, newGoal].sort((a, b) => a.minute - b.minute);
    setGoals(nextGoals);

    // Auto-update match score based on goals count if user hasn't set custom score
    const homeGoalsCount = nextGoals.filter(g => g.team === match.homeTeam).length;
    const awayGoalsCount = nextGoals.filter(g => g.team === match.awayTeam).length;
    
    if (homeGoalsCount > homeScore) setHomeScore(homeGoalsCount);
    if (awayGoalsCount > awayScore) setAwayScore(awayGoalsCount);

    if (isKnockout) {
      autoDetermineKnockoutWinner(
        Math.max(homeScore, homeGoalsCount),
        Math.max(awayScore, awayGoalsCount),
        decisionType
      );
    }

    // Reset goal entry inputs
    setGoalPlayer('');
    setGoalAssist('');
    setGoalMinute(Math.min(90, (goalMinute + 15) % 95 || 45));
    setPlayerSuggestions([]);
    setAssistSuggestions([]);
  };

  // Remove goal
  const handleRemoveGoal = (goalId: string) => {
    setGoals(goals.filter(g => g.id !== goalId));
  };

  // Save full match
  const handleSave = () => {
    let finalWinner = winnerTeam;
    if (!isKnockout) {
      if (homeScore > awayScore) finalWinner = match.homeTeam;
      else if (awayScore > homeScore) finalWinner = match.awayTeam;
      else finalWinner = undefined;
    } else {
      if (!finalWinner) {
        if (homeScore > awayScore) finalWinner = match.homeTeam;
        else if (awayScore > homeScore) finalWinner = match.awayTeam;
        else if (homePenalties > awayPenalties) finalWinner = match.homeTeam;
        else if (awayPenalties > homePenalties) finalWinner = match.awayTeam;
        else finalWinner = match.userControls || match.homeTeam;
      }
    }

    saveMatch(match.id, {
      homeScore,
      awayScore,
      goals,
      winnerTeam: finalWinner,
      decisionType: isKnockout ? decisionType : 'regular',
      homePenalties: isKnockout && decisionType === 'penalties' ? homePenalties : undefined,
      awayPenalties: isKnockout && decisionType === 'penalties' ? awayPenalties : undefined,
    });

    // Celebratory confetti
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#ffffff'],
      });
    } catch {
      // ignore
    }

    onClose();
  };

  // Reset match
  const handleReset = () => {
    if (confirm('Deseja realmente limpar o resultado desta partida e marcar como Não Jogada?')) {
      resetMatch(match.id);
      onClose();
    }
  };

  return (
    <div
      id="match-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="match-modal-content"
        className="relative w-full max-w-2xl bg-[#0f172a] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]"
      >
        {/* Top Header */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-5 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider">
              Jogo {match.id < 10 ? `0${match.id}` : match.id}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {match.roundLabel} {match.group ? `• Grupo ${match.group}` : ''}
              </span>
              <span className="text-sm font-bold text-white">
                {match.isFinished ? '✏️ Editar Resultado' : '⚽ Registrar Resultado'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Controls Highlight Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-emerald-950/60 border-b border-emerald-500/30 px-5 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold text-emerald-300">
              Você controla:{' '}
              <span className="underline decoration-emerald-400 underline-offset-4 text-white font-extrabold ml-1">
                {match.userControls || 'A definir'}
              </span>
            </span>
          </div>

          <span className="text-[11px] text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
            Modo FIFA
          </span>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Match Score Board */}
          <div className="bg-[#131d33] border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-inner">
            <div className="grid grid-cols-11 items-center gap-2 sm:gap-4">
              {/* Home Team */}
              <div className="col-span-4 flex flex-col items-center text-center space-y-2">
                <TeamBadge name={match.homeTeam} size="lg" showFullName={false} isUserTeam={match.userControls === match.homeTeam} />
                <span className={`text-sm sm:text-base font-bold truncate max-w-full ${match.userControls === match.homeTeam ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {match.homeTeam}
                </span>
                {match.userControls === match.homeTeam && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                    🎮 Seu Time
                  </span>
                )}

                {/* Score Controls */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleScoreChange('home', -1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white flex items-center justify-center font-bold text-base transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={homeScore}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setHomeScore(val);
                      if (isKnockout) autoDetermineKnockoutWinner(val, awayScore, decisionType);
                    }}
                    className="w-14 h-11 bg-slate-900 border-2 border-slate-600 focus:border-emerald-500 rounded-lg text-center text-2xl font-mono font-extrabold text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleScoreChange('home', 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-base transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* VS Divider */}
              <div className="col-span-3 flex flex-col items-center justify-center text-center">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                  {match.stage === 'group' ? 'Fase de Grupos' : 'Mata-Mata'}
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-400 my-1 font-mono">
                  VS
                </span>
                {isKnockout && decisionType === 'penalties' && (
                  <span className="text-[10px] font-bold text-amber-400 uppercase bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    Pênaltis
                  </span>
                )}
              </div>

              {/* Away Team */}
              <div className="col-span-4 flex flex-col items-center text-center space-y-2">
                <TeamBadge name={match.awayTeam} size="lg" showFullName={false} isUserTeam={match.userControls === match.awayTeam} />
                <span className={`text-sm sm:text-base font-bold truncate max-w-full ${match.userControls === match.awayTeam ? 'text-emerald-300' : 'text-slate-200'}`}>
                  {match.awayTeam}
                </span>
                {match.userControls === match.awayTeam && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                    🎮 Seu Time
                  </span>
                )}

                {/* Score Controls */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleScoreChange('away', -1)}
                    className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white flex items-center justify-center font-bold text-base transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={awayScore}
                    onChange={e => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setAwayScore(val);
                      if (isKnockout) autoDetermineKnockoutWinner(homeScore, val, decisionType);
                    }}
                    className="w-14 h-11 bg-slate-900 border-2 border-slate-600 focus:border-emerald-500 rounded-lg text-center text-2xl font-mono font-extrabold text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleScoreChange('away', 1)}
                    className="w-8 h-8 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 flex items-center justify-center font-bold text-base transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Knockout Tiebreaker Decision Area */}
            {isKnockout && (
              <div className="mt-4 pt-4 border-t border-slate-700/60 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-300">
                    Tipo de Decisão do Mata-mata:
                  </span>
                  <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-700 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setDecisionType('regular');
                        autoDetermineKnockoutWinner(homeScore, awayScore, 'regular');
                      }}
                      className={`px-3 py-1 rounded font-medium transition-all ${
                        decisionType === 'regular'
                          ? 'bg-emerald-500 text-black font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Tempo Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisionType('extra_time')}
                      className={`px-3 py-1 rounded font-medium transition-all ${
                        decisionType === 'extra_time'
                          ? 'bg-emerald-500 text-black font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Prorrogação
                    </button>
                    <button
                      type="button"
                      onClick={() => setDecisionType('penalties')}
                      className={`px-3 py-1 rounded font-medium transition-all ${
                        decisionType === 'penalties'
                          ? 'bg-emerald-500 text-black font-bold'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Pênaltis
                    </button>
                  </div>
                </div>

                {/* If Penalties: Penalty shootout score */}
                {decisionType === 'penalties' && (
                  <div className="bg-slate-900/90 border border-amber-500/30 rounded-lg p-3 flex items-center justify-between gap-4">
                    <div className="text-xs text-amber-300 font-medium">
                      Placar da Disputa de Pênaltis:
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{match.homeTeam}:</span>
                      <input
                        type="number"
                        min="0"
                        value={homePenalties}
                        onChange={e => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setHomePenalties(val);
                          if (val > awayPenalties) setWinnerTeam(match.homeTeam);
                        }}
                        className="w-10 h-8 bg-slate-800 border border-amber-500/50 rounded text-center text-sm font-bold text-white"
                      />
                      <span className="text-xs text-slate-500 font-mono">×</span>
                      <input
                        type="number"
                        min="0"
                        value={awayPenalties}
                        onChange={e => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          setAwayPenalties(val);
                          if (val > homePenalties) setWinnerTeam(match.awayTeam);
                        }}
                        className="w-10 h-8 bg-slate-800 border border-amber-500/50 rounded text-center text-sm font-bold text-white"
                      />
                      <span className="text-xs text-slate-400">{match.awayTeam}</span>
                    </div>
                  </div>
                )}

                {/* Winner selection */}
                <div className="bg-slate-900/60 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-slate-700">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Time que Avança (Vencedor):
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWinnerTeam(match.homeTeam)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        winnerTeam === match.homeTeam
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {winnerTeam === match.homeTeam && <Check className="w-3.5 h-3.5" />}
                      {match.homeTeam}
                    </button>
                    <button
                      type="button"
                      onClick={() => setWinnerTeam(match.awayTeam)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                        winnerTeam === match.awayTeam
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-sm shadow-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {winnerTeam === match.awayTeam && <Check className="w-3.5 h-3.5" />}
                      {match.awayTeam}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Goals and Scorers Registration Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white flex items-center gap-1.5">
                  ⚽ Detalhamento dos Gols ({goals.length})
                </span>
                <span className="text-xs text-slate-400">(Artilharia & Assistências)</span>
              </div>

              <button
                type="button"
                onClick={() => setShowGoalForm(!showGoalForm)}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar Gol
              </button>
            </div>

            {/* Add Goal Collapsible Form */}
            {showGoalForm && (
              <form
                onSubmit={handleAddGoal}
                className="bg-slate-800/90 border border-emerald-500/40 rounded-xl p-4 space-y-3 shadow-lg animate-in fade-in duration-200"
              >
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Novo Registro de Gol
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Minute */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Minuto</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        required
                        value={goalMinute}
                        onChange={e => setGoalMinute(parseInt(e.target.value) || 1)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                      />
                      <span className="absolute right-2 top-1.5 text-xs text-slate-500 pointer-events-none">
                        '
                      </span>
                    </div>
                  </div>

                  {/* Team */}
                  <div className="sm:col-span-3 space-y-1">
                    <label className="text-[11px] font-medium text-slate-400">Time</label>
                    <select
                      value={goalTeam}
                      onChange={e => setGoalTeam(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 outline-none"
                    >
                      <option value={match.homeTeam}>{match.homeTeam}</option>
                      <option value={match.awayTeam}>{match.awayTeam}</option>
                    </select>
                  </div>

                  {/* Player Scorer (with autocomplete) */}
                  <div className="sm:col-span-4 space-y-1 relative">
                    <label className="text-[11px] font-medium text-slate-400">
                      ⚽ Autor do Gol *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Vinícius Jr., Kane..."
                      value={goalPlayer}
                      onChange={e => {
                        const val = e.target.value;
                        setGoalPlayer(val);
                        if (val.length >= 2) {
                          setPlayerSuggestions(
                            knownPlayers
                              .filter(p => p.toLowerCase().includes(val.toLowerCase()) && p !== val)
                              .slice(0, 5)
                          );
                        } else {
                          setPlayerSuggestions([]);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 outline-none placeholder:text-slate-600"
                    />

                    {playerSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                        {playerSuggestions.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setGoalPlayer(s);
                              setPlayerSuggestions([]);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Assist Player (optional) */}
                  <div className="sm:col-span-3 space-y-1 relative">
                    <label className="text-[11px] font-medium text-slate-400">
                      🅰️ Assistência (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rodrygo..."
                      value={goalAssist}
                      onChange={e => {
                        const val = e.target.value;
                        setGoalAssist(val);
                        if (val.length >= 2) {
                          setAssistSuggestions(
                            knownPlayers
                              .filter(p => p.toLowerCase().includes(val.toLowerCase()) && p !== val)
                              .slice(0, 5)
                          );
                        } else {
                          setAssistSuggestions([]);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 outline-none placeholder:text-slate-600"
                    />

                    {assistSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 overflow-hidden">
                        {assistSuggestions.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              setGoalAssist(s);
                              setAssistSuggestions([]);
                            }}
                            className="w-full text-left px-3 py-1.5 text-xs text-slate-200 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowGoalForm(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-lg transition-colors shadow-md"
                  >
                    Salvar Gol
                  </button>
                </div>
              </form>
            )}

            {/* List of registered goals */}
            {goals.length === 0 ? (
              <div className="text-center py-4 px-3 bg-slate-900/40 border border-dashed border-slate-800 rounded-xl text-xs text-slate-500">
                Nenhum gol registrado individualmente. Clique em "+ Adicionar Gol" para registrar quem marcou e assistências.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {goals.map(g => (
                  <div
                    key={g.id}
                    className="bg-slate-900/80 border border-slate-700/60 rounded-lg p-2.5 flex items-center justify-between gap-2 group hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-400 font-mono text-xs font-bold">
                        {g.minute}'
                      </span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white truncate">{g.player}</span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({g.team})
                          </span>
                        </div>
                        {g.assistPlayer && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                            🅰️ Assistência: {g.assistPlayer}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveGoal(g.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors opacity-80 group-hover:opacity-100"
                      title="Remover gol"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-900 px-5 py-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <div>
            {match.isFinished && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg border border-rose-500/20 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Desfazer Partida
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs sm:text-sm font-bold text-black bg-emerald-500 hover:bg-emerald-400 rounded-lg shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all"
            >
              <Check className="w-4 h-4" />
              Salvar Resultado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
