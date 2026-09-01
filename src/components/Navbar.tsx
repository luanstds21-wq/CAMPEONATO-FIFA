import React, { useRef, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Database,
  Download,
  Flame,
  Gamepad2,
  Home,
  RefreshCw,
  Sparkles,
  Trophy,
  Upload,
  X,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';

export type NavTab = 'dashboard' | 'standings' | 'matches' | 'stats' | 'bracket';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  onOpenMatch?: (matchId: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { totalMatchesPlayed, matches, exportData, importData, resetTournament, seedDemoData } =
    useTournament();

  const [showToolsModal, setShowToolsModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalMatchesCount = matches.length; // 103
  const progressPercent = Math.round((totalMatchesPlayed / 103) * 100);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Início', icon: Home },
    { id: 'standings' as NavTab, label: 'Classificação', icon: BarChart3 },
    { id: 'matches' as NavTab, label: 'Jogos', icon: Gamepad2 },
    { id: 'stats' as NavTab, label: 'Estatísticas', icon: Flame },
    { id: 'bracket' as NavTab, label: 'Mata-Mata', icon: Trophy },
  ];

  const handleExport = () => {
    const jsonStr = exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fifa_champions_48_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const content = event.target?.result as string;
      const ok = importData(content);
      if (ok) {
        setImportStatus('✅ Dados importados com sucesso!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('❌ Arquivo inválido. Verifique o formato.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c1220]/95 backdrop-blur-md border-b border-slate-800">
      {/* Top Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand Logo & Title */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-3 cursor-pointer select-none group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform flex items-center justify-center">
              <div className="w-full h-full bg-[#0b101b] rounded-[10px] flex items-center justify-center">
                <Trophy className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold tracking-tight text-white text-base sm:text-lg">
                  FIFA <span className="text-emerald-400 font-mono">CHAMPIONS</span>
                </span>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  48 Times
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                12 Grupos • Mata-Mata • Painel Pro
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 scale-[1.02]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-black' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Quick Tools & Progress */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden lg:flex flex-col items-end mr-1">
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
                <span className="text-emerald-400 font-mono font-bold">{totalMatchesPlayed}</span>
                <span className="text-slate-500">/</span>
                <span className="font-mono">103 Jogos</span>
              </div>
              <div className="w-24 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 border border-slate-700">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <button
              onClick={() => setShowToolsModal(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Gerenciar Dados e Ferramentas"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Dados</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden border-t border-slate-800/90 bg-[#090d16]/95 backdrop-blur px-2 py-1.5">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center py-1.5 px-1 rounded-lg transition-colors ${
                  isActive ? 'bg-emerald-500/15 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-[10px] mt-0.5 tracking-tight truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data & Tools Management Modal */}
      {showToolsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={e => {
            if (e.target === e.currentTarget) setShowToolsModal(false);
          }}
        >
          <div className="relative w-full max-w-md bg-[#0f172a] border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Gerenciar Torneio & Backup</h3>
              </div>
              <button
                onClick={() => setShowToolsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {importStatus && (
              <div className="p-3 bg-slate-800 rounded-lg text-xs font-semibold text-center border border-slate-700">
                {importStatus}
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs text-slate-400 leading-relaxed">
                Todos os dados são salvos localmente e persistem automaticamente no navegador ao recarregar a página.
              </p>

              {/* Export JSON */}
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Exportar Backup (JSON)</div>
                    <div className="text-[11px] text-slate-400">Baixar arquivo com todos os resultados</div>
                  </div>
                </div>
              </button>

              {/* Import JSON */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Upload className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Importar Backup (JSON)</div>
                    <div className="text-[11px] text-slate-400">Restaurar torneio a partir de arquivo</div>
                  </div>
                </div>
              </button>

              {/* Demo Simulation Button */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Ferramentas Rápidas
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Simular resultados automáticos para a Rodada 1 para visualização rápida?')) {
                        seedDemoData(24);
                        setShowToolsModal(false);
                      }
                    }}
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Simular R1 (24j)
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Simular todos os 72 jogos da fase de grupos para testar o chaveamento completo do mata-mata?')) {
                        seedDemoData(72);
                        setShowToolsModal(false);
                      }
                    }}
                    className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    Simular Grupos (72j)
                  </button>
                </div>
              </div>

              {/* Reset Tournament */}
              <div className="pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => {
                    if (confirm('⚠️ TEM CERTEZA? Isso apagará todos os resultados e estatísticas do campeonato, reiniciando do zero.')) {
                      resetTournament();
                      setShowToolsModal(false);
                    }
                  }}
                  className="w-full p-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reiniciar Campeonato do Zero
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
