import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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
  const {
    topScorers = [],
    topAssists = [],
    topContributions = [],
    mostGoals = [],
    leastConceded = [],
    allTeamStats = [],
    setSelectedPlayerName,
    setSelectedTeamName,
  } = useTournament();

  const [activeTab, setActiveTab] = useState<
    'scorers' | 'assists' | 'contributions' | 'teams_attack' | 'teams_defense' | 'all_teams'
  >('scorers');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Top 5 vs Show All toggles
  const [showAllScorers, setShowAllScorers] = useState<boolean>(false);
  const [showAllAssists, setShowAllAssists] = useState<boolean>(false);
  const [showAllContributions, setShowAllContributions] = useState<boolean>(false);

  const statsTabs = [
    { id: 'scorers', label: '⚽ Gols', icon: Goal },
    { id: 'assists', label: '🎯 Assistências', icon: Target },
    { id: 'contributions', label: '⚡ Participações em Gols', icon: Sparkles },
    { id: 'teams_attack', label: '🔥 Melhores Ataques', icon: Flame },
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

  const filteredContributions = (topContributions || []).filter(
    p =>
      p?.player?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p?.team?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAllTeams = (allTeamStats || []).filter(t =>
    t?.team?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Slices for Top 5 / Show All
  const displayedScorers = showAllScorers || searchQuery ? filteredScorers : filteredScorers.slice(0, 5);
  const displayedAssists = showAllAssists || searchQuery ? filteredAssists : filteredAssists.slice(0, 5);
  const displayedContributions =
    showAllContributions || searchQuery ? filteredContributions : filteredContributions.slice(0, 5);

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
              Gols acumulados (inclusive multi-equipes), assistências, participações totais, ataques e defesas. Clique em qualquer jogador ou equipe para ver seu perfil completo.
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

      {/* 1. GOLS TAB (Chuteira de Ouro — Artilharia) */}
      {activeTab === 'scorers' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-extrabold text-white">Chuteira de Ouro — Artilharia</h2>
                <p className="text-[11px] text-slate-400">Gols somados de todas as equipes que o atleta defendeu</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">
                {filteredScorers.length} goleadores
              </span>
            </div>
          </div>

          {filteredScorers.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 space-y-2">
              <p>Nenhum gol registrado individualmente com nome de jogador até o momento.</p>
              <p className="text-xs text-slate-600">
                Ao registrar os jogos, adicione os autores dos gols para alimentar a tabela de gols automaticamente!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-3 w-12 text-center">Rank</th>
                      <th className="py-3 px-3">Jogador</th>
                      <th className="py-3 px-3">Equipe(s)</th>
                      <th className="py-3 px-3 text-center">Média por Jogo</th>
                      <th className="py-3 px-3 text-center font-extrabold text-emerald-400">
                        Gols Marcados
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedScorers.map((p, idx) => (
                      <tr
                        key={p.player}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedPlayerName(p.player)}
                      >
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
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                              {p.player}
                              {p.teams.length > 1 && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                                  Multi-time
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500">Clique para abrir perfil</span>
                          </div>
                        </td>
                        <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.teams.map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSelectedTeamName(t)}
                                className="hover:scale-105 transition-transform"
                                title={`Ver perfil de ${t}`}
                              >
                                <TeamBadge name={t} size="sm" showFullName={true} />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">
                          {p.avgGoals} / jogo
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

              {/* Ver tudo / Ver Menos Button */}
              {filteredScorers.length > 5 && !searchQuery && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllScorers(!showAllScorers)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shadow-sm"
                  >
                    {showAllScorers ? (
                      <>
                        <ChevronUp className="w-4 h-4 text-emerald-400" />
                        Mostrar apenas o TOP 5
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                        Ver tudo ({filteredScorers.length} goleadores)
                      </>
                    )}
                  </button>
                </div>
              )}
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
              <div>
                <h2 className="text-base font-extrabold text-white">Líderes em Assistências</h2>
                <p className="text-[11px] text-slate-400">Passes para gol somados em todas as equipes do atleta</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {filteredAssists.length} garçons
            </span>
          </div>

          {filteredAssists.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Nenhuma assistência registrada nos gols ainda.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-3 w-12 text-center">Rank</th>
                      <th className="py-3 px-3">Jogador</th>
                      <th className="py-3 px-3">Equipe(s)</th>
                      <th className="py-3 px-3 text-center">Média por Jogo</th>
                      <th className="py-3 px-3 text-center font-extrabold text-cyan-400">
                        Assistências
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedAssists.map((p, idx) => (
                      <tr
                        key={p.player}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedPlayerName(p.player)}
                      >
                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300">
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                              {p.player}
                              {p.teams.length > 1 && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                                  Multi-time
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500">Clique para abrir perfil</span>
                          </div>
                        </td>
                        <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.teams.map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSelectedTeamName(t)}
                                className="hover:scale-105 transition-transform"
                                title={`Ver perfil de ${t}`}
                              >
                                <TeamBadge name={t} size="sm" showFullName={true} />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">
                          {p.avgAssists} / jogo
                        </td>
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

              {/* Ver tudo / Ver Menos Button */}
              {filteredAssists.length > 5 && !searchQuery && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllAssists(!showAllAssists)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shadow-sm"
                  >
                    {showAllAssists ? (
                      <>
                        <ChevronUp className="w-4 h-4 text-cyan-400" />
                        Mostrar apenas o TOP 5
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 text-cyan-400" />
                        Ver tudo ({filteredAssists.length} garçons)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 3. PARTICIPAÇÕES EM GOLS TAB */}
      {activeTab === 'contributions' && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-base font-extrabold text-white">Participações em Gols</h2>
                <p className="text-[11px] text-slate-400">Total somado de gols + assistências por jogador</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {filteredContributions.length} atletas com participações
            </span>
          </div>

          {filteredContributions.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500">
              Nenhuma participação direta em gols registrada até o momento.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-900/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                      <th className="py-3 px-3 w-12 text-center">Rank</th>
                      <th className="py-3 px-3">Jogador</th>
                      <th className="py-3 px-3">Equipe(s)</th>
                      <th className="py-3 px-3 text-center">Gols</th>
                      <th className="py-3 px-3 text-center">Assistências</th>
                      <th className="py-3 px-3 text-center">Média por Jogo</th>
                      <th className="py-3 px-3 text-center font-extrabold text-amber-400">
                        Participações (G+A)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {displayedContributions.map((p, idx) => (
                      <tr
                        key={p.player}
                        className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                        onClick={() => setSelectedPlayerName(p.player)}
                      >
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
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                              {p.player}
                              {p.teams.length > 1 && (
                                <span className="text-[9px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                                  Multi-time
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] text-slate-500">Clique para abrir perfil</span>
                          </div>
                        </td>
                        <td className="py-3 px-3" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {p.teams.map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setSelectedTeamName(t)}
                                className="hover:scale-105 transition-transform"
                                title={`Ver perfil de ${t}`}
                              >
                                <TeamBadge name={t} size="sm" showFullName={true} />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-emerald-400">
                          {p.goals}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-cyan-400">
                          {p.assists}
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-300">
                          {p.avgContributions} / jogo
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-mono text-base font-extrabold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                            {p.contributions}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ver tudo / Ver Menos Button */}
              {filteredContributions.length > 5 && !searchQuery && (
                <div className="flex justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAllContributions(!showAllContributions)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 shadow-sm"
                  >
                    {showAllContributions ? (
                      <>
                        <ChevronUp className="w-4 h-4 text-amber-400" />
                        Mostrar apenas o TOP 5
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 text-amber-400" />
                        Ver tudo ({filteredContributions.length} jogadores)
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. MELHORES ATAQUES TAB */}
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
                  <tr
                    key={t.team}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTeamName(t.team)}
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                      {idx + 1}º
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <TeamBadge name={t.team} size="sm" showFullName={true} />
                        <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          (ver perfil)
                        </span>
                      </div>
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

      {/* 5. MELHORES DEFESAS TAB */}
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
                  <tr
                    key={t.team}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    onClick={() => setSelectedTeamName(t.team)}
                  >
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                      {idx + 1}º
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <TeamBadge name={t.team} size="sm" showFullName={true} />
                        <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          (ver perfil)
                        </span>
                      </div>
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

      {/* 6. TABELA GERAL DOS 48 TIMES */}
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
                    <tr
                      key={t.team}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => setSelectedTeamName(t.team)}
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <TeamBadge name={t.team} size="sm" showFullName={true} />
                          <span className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            (ver perfil)
                          </span>
                        </div>
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
