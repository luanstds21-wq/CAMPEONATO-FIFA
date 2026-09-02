import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Filter,
  Flame,
  HelpCircle,
  Info,
  Search,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import { GroupStanding } from '../types/tournament';
import { TeamBadge } from './TeamBadge';

export const StandingsView: React.FC = () => {
  const { groupStandings, bestThirds, setSelectedTeamName } = useTournament();
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const groupKeys = Object.keys(groupStandings);

  const filterGroups = selectedGroup === 'ALL' ? groupKeys : [selectedGroup];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header & Group Selector */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-400" />
              <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                Classificação da Fase de Grupos
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              12 Grupos de 4 equipes • Top 2 avançam direto • 8 Melhores 3º colocados se classificam.
            </p>
          </div>

          {/* Search team input */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar equipe..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 outline-none"
            />
          </div>
        </div>

        {/* Group Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedGroup === 'ALL'
                ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-extrabold'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            Todos os 12 Grupos
          </button>

          {groupKeys.map(grp => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedGroup === grp
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-extrabold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              Grupo {grp}
            </button>
          ))}
        </div>

        {/* Qualification Legend */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span>1º e 2º: Classificado Direto (16-Avos)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
            <span>3º: Disputa 8 Vagas (Melhores 3ºs)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/60 inline-block" />
            <span>4º: Eliminado</span>
          </div>
          <div className="ml-auto font-mono text-[10px] text-slate-500">
            Critérios: Pontos &gt; Saldo de Gols (SG) &gt; Gols Pró (GP) &gt; Vitórias
          </div>
        </div>
      </div>

      {/* Grid of Groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filterGroups.map(grp => {
          const list = groupStandings[grp] || [];
          const filteredList = searchQuery.trim()
            ? list.filter(item => item.team.toLowerCase().includes(searchQuery.toLowerCase()))
            : list;

          if (searchQuery.trim() && filteredList.length === 0) return null;

          return (
            <div
              key={grp}
              className="bg-[#0f172a] border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between"
            >
              {/* Group Header */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-mono font-extrabold text-sm flex items-center justify-center">
                    {grp}
                  </span>
                  <span className="text-sm font-extrabold text-white">Grupo {grp}</span>
                </div>

                <span className="text-[10px] text-slate-400 font-mono">6 Jogos</span>
              </div>

              {/* Group Standings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/80">
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-2">Time</th>
                      <th className="py-2.5 px-1.5 text-center" title="Jogos">J</th>
                      <th className="py-2.5 px-1.5 text-center" title="Vitórias">V</th>
                      <th className="py-2.5 px-1.5 text-center" title="Empates">E</th>
                      <th className="py-2.5 px-1.5 text-center" title="Derrotas">D</th>
                      <th className="py-2.5 px-1.5 text-center hidden sm:table-cell" title="Gols Pró">GP</th>
                      <th className="py-2.5 px-1.5 text-center hidden sm:table-cell" title="Gols Contra">GC</th>
                      <th className="py-2.5 px-1.5 text-center" title="Saldo de Gols">SG</th>
                      <th className="py-2.5 px-3 text-center font-extrabold text-white" title="Pontos">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {list.map((row, idx) => {
                      const isTop2 = row.position === 1 || row.position === 2;
                      const is3rd = row.position === 3;
                      const is4th = row.position === 4;

                      return (
                        <tr
                          key={row.team}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isTop2
                              ? 'bg-emerald-500/[0.03]'
                              : is3rd
                              ? 'bg-amber-500/[0.02]'
                              : ''
                          }`}
                        >
                          {/* Position Badge */}
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-bold font-mono ${
                                isTop2
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : is3rd
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {row.position}
                            </span>
                          </td>

                          {/* Team Name with Badge */}
                          <td className="py-2.5 px-2">
                            <button
                              type="button"
                              onClick={() => setSelectedTeamName(row.team)}
                              className="text-left hover:scale-102 transition-transform group/team"
                              title={`Ver perfil do time ${row.team}`}
                            >
                              <TeamBadge name={row.team} size="sm" showFullName={true} />
                            </button>
                          </td>

                          <td className="py-2.5 px-1.5 text-center font-mono text-slate-300">
                            {row.played}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono text-emerald-400 font-semibold">
                            {row.won}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono text-slate-400">
                            {row.drawn}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono text-rose-400">
                            {row.lost}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono text-slate-400 hidden sm:table-cell">
                            {row.goalsFor}
                          </td>
                          <td className="py-2.5 px-1.5 text-center font-mono text-slate-400 hidden sm:table-cell">
                            {row.goalsAgainst}
                          </td>
                          <td
                            className={`py-2.5 px-1.5 text-center font-mono font-bold ${
                              row.goalDifference > 0
                                ? 'text-emerald-400'
                                : row.goalDifference < 0
                                ? 'text-rose-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-sm font-extrabold text-white bg-slate-900/40">
                            {row.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Special Dedicated Section: COMPARATIVO DOS 8 MELHORES 3º COLOCADOS */}
      <div className="bg-[#0f172a] border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-white">
                Ranking Geral dos 3º Colocados (12 Grupos)
              </h2>
              <p className="text-xs text-slate-400">
                Os <strong className="text-emerald-400">8 melhores terceiros colocados</strong>{' '}
                avançam para a fase de 16-avos de final do mata-mata.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30 self-start sm:self-auto">
            8 Vagas no Mata-Mata
          </span>
        </div>

        {/* Best Thirds Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <th className="py-3 px-3 w-12 text-center">Rank</th>
                <th className="py-3 px-2">Posição Oficial / Time</th>
                <th className="py-3 px-2 text-center">Grupo Original</th>
                <th className="py-3 px-2 text-center" title="Jogos">J</th>
                <th className="py-3 px-2 text-center" title="Vitórias">V</th>
                <th className="py-3 px-2 text-center" title="Empates">E</th>
                <th className="py-3 px-2 text-center" title="Derrotas">D</th>
                <th className="py-3 px-2 text-center" title="Gols Pró">GP</th>
                <th className="py-3 px-2 text-center" title="Gols Contra">GC</th>
                <th className="py-3 px-2 text-center" title="Saldo de Gols">SG</th>
                <th className="py-3 px-3 text-center font-extrabold text-white" title="Pontos">PTS</th>
                <th className="py-3 px-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bestThirds.map((row, idx) => {
                const isQualified = idx < 8;

                return (
                  <tr
                    key={row.team}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isQualified ? 'bg-emerald-500/[0.04]' : 'bg-rose-500/[0.02] opacity-75'
                    }`}
                  >
                    {/* Rank 1 to 12 */}
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold ${
                          isQualified
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {idx + 1}º
                      </span>
                    </td>

                    {/* Team with slot label */}
                    <td className="py-3 px-2">
                      <button
                        type="button"
                        onClick={() => setSelectedTeamName(row.team)}
                        className="flex items-center gap-3 text-left hover:scale-102 transition-transform"
                        title={`Ver perfil do time ${row.team}`}
                      >
                        <TeamBadge name={row.team} size="sm" showFullName={true} />
                        {isQualified && (
                          <span className="text-[10px] bg-slate-800 text-emerald-300 font-mono px-2 py-0.5 rounded border border-emerald-500/20 hidden sm:inline">
                            {idx + 1}º Melhor Terceiro
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Group */}
                    <td className="py-3 px-2 text-center font-mono font-bold text-slate-300">
                      Grupo {row.group}
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-slate-300">{row.played}</td>
                    <td className="py-3 px-2 text-center font-mono text-emerald-400 font-semibold">{row.won}</td>
                    <td className="py-3 px-2 text-center font-mono text-slate-400">{row.drawn}</td>
                    <td className="py-3 px-2 text-center font-mono text-rose-400">{row.lost}</td>
                    <td className="py-3 px-2 text-center font-mono text-slate-300">{row.goalsFor}</td>
                    <td className="py-3 px-2 text-center font-mono text-slate-400">{row.goalsAgainst}</td>
                    <td
                      className={`py-3 px-2 text-center font-mono font-bold ${
                        row.goalDifference > 0
                          ? 'text-emerald-400'
                          : row.goalDifference < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-sm font-extrabold text-white bg-slate-900/60">
                      {row.points}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-3 text-center">
                      {isQualified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Classificado ({idx + 1}º)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" />
                          Eliminado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
