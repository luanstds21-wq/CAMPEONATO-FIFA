import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  Crown,
  Flame,
  Goal,
  Medal,
  Search,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Users,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { TeamBadge } from './TeamBadge';

export const StatsView: React.FC = () => {
  const { topScorers = [], topAssists = [], mostGoals = [], leastConceded = [], allTeamStats = [] } =
    useTournament();

  const [activeTab, setActiveTab] = useState<
    'scorers' | 'assists' | 'teams_attack' | 'teams_defense' | 'all_teams'
  >('scorers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const statsTabs = [
    { id: 'scorers', label: '👑 Artilharia', icon: Crown },
    { id: 'assists', label: '🎯 Assistências', icon: Target },
    { id: 'teams_attack', label: '⚽ Melhores Ataques', icon: Flame },
    { id: 'teams_defense', label: '🧤 Melhores Defesas', icon: Shield },
    { id: 'all_teams', label: '📊 Tabela dos 48 Times', icon: Users },
  ];

  // Filtered lists with safety checks
  const filteredScorers = (topScorers || []).filter(
    p =>
      p?.player?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p?.team?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAssists = (topAssists || []).filter(
    p =>
      p?.player?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p?.team?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllTeams = (allTeamStats || []).filter(t =>
    t?.team?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 text-amber-400" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Estatísticas & Líderes Individuais
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Artilharia detalhada, líderes em assistências, melhores ataques e defesas de todas as 48 equipes.
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar jogador ou time..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Stats Sub-Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {statsTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-extrabold'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. ARTILHARIA TAB */}
      {activeTab === 'scorers' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-extrabold text-white">Chuteira de Ouro — Artilharia</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {filteredScorers.length} goleadores registrados
            </span>
          </div>

          {filteredScorers.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 space-y-2">
              <p>Nenhum gol registrado individualmente com nome de jogador até o momento.</p>
              <p className="text-xs text-slate-600">
                Ao registrar os jogos, adicione os autores dos gols para alimentar a artilharia automaticamente!
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-3 w-12 text-center">Rank</th>
                    <th className="py-3 px-3">Jogador</th>
                    <th className="py-3 px-3">Equipe</th>
                    <th className="py-3 px-3 text-center">Jogos Disputados</th>
                    <th className="py-3 px-3 text-center">Assistências</th>
                    <th className="py-3 px-3 text-center font-extrabold text-emerald-400">
                      Gols Marcados
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredScorers.map((p, idx) => (
                    <tr key={`${p.player}_${p.team}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold ${
                            idx === 0
                              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                              : idx === 1
                              ? 'bg-slate-300/20 text-slate-200 border border-slate-300/50'
                              : idx === 2
                              ? 'bg-amber-700/20 text-amber-600 border border-amber-700/50'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm font-bold text-white">{p.player}</span>
                      </td>
                      <td className="py-3 px-3">
                        <TeamBadge name={p.team} size="sm" showFullName={true} />
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {p.matchesCount}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {p.assists}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-base font-extrabold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                          {p.goals}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 2. ASSISTÊNCIAS TAB */}
      {activeTab === 'assists' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-extrabold text-white">Líderes em Assistências</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {filteredAssists.length} garçons registrados
            </span>
          </div>

          {filteredAssists.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Nenhuma assistência registrada nos gols ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <th className="py-3 px-3 w-12 text-center">Rank</th>
                    <th className="py-3 px-3">Jogador</th>
                    <th className="py-3 px-3">Equipe</th>
                    <th className="py-3 px-3 text-center">Gols Marcados</th>
                    <th className="py-3 px-3 text-center font-extrabold text-cyan-400">
                      Assistências
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAssists.map((p, idx) => (
                    <tr key={`${p.player}_${p.team}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300">
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-sm font-bold text-white">{p.player}</span>
                      </td>
                      <td className="py-3 px-3">
                        <TeamBadge name={p.team} size="sm" showFullName={true} />
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{p.goals}</td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-base font-extrabold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
                          {p.assists}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. MELHORES ATAQUES TAB */}
      {activeTab === 'teams_attack' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-extrabold text-white">Times Mais Goleadores (Melhores Ataques)</h2>
            </div>
            <span className="text-xs text-slate-400">Ordenado por Gols Marcados (GP)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-3 w-12 text-center">Rank</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3 text-center">Grupo</th>
                  <th className="py-3 px-3 text-center">Jogos</th>
                  <th className="py-3 px-3 text-center font-extrabold text-emerald-400">
                    Gols Marcados (GP)
                  </th>
                  <th className="py-3 px-3 text-center">Média por Jogo</th>
                  <th className="py-3 px-3 text-center">Saldo (SG)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {mostGoals.map((t, idx) => (
                  <tr key={t.team} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                      {idx + 1}º
                    </td>
                    <td className="py-3 px-3">
                      <TeamBadge name={t.team} size="sm" showFullName={true} />
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">
                      Grupo {t.group}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">{t.played}</td>
                    <td className="py-3 px-3 text-center font-mono text-base font-extrabold text-emerald-400">
                      {t.goalsFor}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {t.avgGoalsFor}
                    </td>
                    <td
                      className={`py-3 px-3 text-center font-mono font-bold ${
                        t.goalDifference > 0 ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. MELHORES DEFESAS TAB */}
      {activeTab === 'teams_defense' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2 className="text-base font-extrabold text-white">Times Menos Vazados (Melhores Defesas)</h2>
            </div>
            <span className="text-xs text-slate-400">Ordenado por Menor Média de Gols Sofridos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-3 w-12 text-center">Rank</th>
                  <th className="py-3 px-3">Time</th>
                  <th className="py-3 px-3 text-center">Grupo</th>
                  <th className="py-3 px-3 text-center">Jogos</th>
                  <th className="py-3 px-3 text-center font-extrabold text-blue-400">
                    Gols Sofridos (GC)
                  </th>
                  <th className="py-3 px-3 text-center">Média Sofrida</th>
                  <th className="py-3 px-3 text-center">Vitórias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {leastConceded.map((t, idx) => (
                  <tr key={t.team} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                      {idx + 1}º
                    </td>
                    <td className="py-3 px-3">
                      <TeamBadge name={t.team} size="sm" showFullName={true} />
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-300">
                      Grupo {t.group}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">{t.played}</td>
                    <td className="py-3 px-3 text-center font-mono text-base font-extrabold text-blue-400">
                      {t.goalsAgainst}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-300">
                      {t.avgGoalsAgainst}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-emerald-400 font-semibold">
                      {t.won}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. TABELA GERAL DOS 48 TIMES */}
      {activeTab === 'all_teams' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h2 className="text-base font-extrabold text-white">Quadro Geral das 48 Equipes</h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {filteredAllTeams.length} times listados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <th className="py-3 px-3">Equipe</th>
                  <th className="py-3 px-2 text-center">Grupo</th>
                  <th className="py-3 px-2 text-center" title="Jogos">J</th>
                  <th className="py-3 px-2 text-center" title="Vitórias">V</th>
                  <th className="py-3 px-2 text-center" title="Empates">E</th>
                  <th className="py-3 px-2 text-center" title="Derrotas">D</th>
                  <th className="py-3 px-2 text-center">GP</th>
                  <th className="py-3 px-2 text-center">GC</th>
                  <th className="py-3 px-2 text-center">SG</th>
                  <th className="py-3 px-3 text-center font-extrabold text-white">PTS</th>
                  <th className="py-3 px-3 text-center">Aprov. %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAllTeams.map(t => {
                  const maxPossiblePts = t.played * 3;
                  const winRate = maxPossiblePts > 0 ? Math.round((t.points / maxPossiblePts) * 100) : 0;

                  return (
                    <tr key={t.team} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3">
                        <TeamBadge name={t.team} size="sm" showFullName={true} />
                      </td>
                      <td className="py-3 px-2 text-center font-mono font-bold text-slate-300">
                        Grupo {t.group}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-slate-300">{t.played}</td>
                      <td className="py-3 px-2 text-center font-mono text-emerald-400 font-semibold">{t.won}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-400">{t.drawn}</td>
                      <td className="py-3 px-2 text-center font-mono text-rose-400">{t.lost}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-300">{t.goalsFor}</td>
                      <td className="py-3 px-2 text-center font-mono text-slate-400">{t.goalsAgainst}</td>
                      <td
                        className={`py-3 px-2 text-center font-mono font-bold ${
                          t.goalDifference > 0
                            ? 'text-emerald-400'
                            : t.goalDifference < 0
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {t.goalDifference > 0 ? `+${t.goalDifference}` : t.goalDifference}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-sm font-extrabold text-white bg-slate-900/60">
                        {t.points}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-slate-300">
                        {winRate}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
