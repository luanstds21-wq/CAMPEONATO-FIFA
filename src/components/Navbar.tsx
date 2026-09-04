import React, { useRef, useState } from 'react';
import {
  BarChart3,
  Cloud,
  Database,
  Download,
  Flame,
  Gamepad2,
  Home,
  RefreshCw,
  RotateCw,
  Shield,
  Sparkles,
  Trophy,
  Upload,
  Users,
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
  const {
    totalMatchesPlayed,
    exportData,
    importData,
    resetTournament,
    seedDemoData,
    syncStatus,
    lastSyncedAt,
    refreshFromCloud,
    isLoadingTournament,
  } = useTournament();

  const [showToolsModal, setShowToolsModal] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    a.download = `fifa_champions_48_campeonato_backup_${new Date().toISOString().slice(0, 10)}.json`;
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
        setImportStatus('✅ Dados importados com sucesso! Sincronizado com todos os dispositivos.');
        setTimeout(() => setImportStatus(null), 3500);
      } else {
        setImportStatus('❌ Arquivo inválido. Verifique o formato do arquivo JSON.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
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
                  Campeonato Único • Atualização em Tempo Real
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

            {/* Live Sync Status & Tools */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Progress Tracker (Desktop) */}
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

              {/* Data & Backup Button */}
              <button
                onClick={() => setShowToolsModal(true)}
                className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold shrink-0"
                title="Exportar / Importar Backup e Ferramentas"
              >
                <Database className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Backup & Dados</span>
              </button>

              {/* Shared Real-Time Online Status Pill */}
              <button
                onClick={() => refreshFromCloud()}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/95 hover:bg-slate-800/90 border border-slate-700/90 transition-all select-none group shrink-0"
                title="Base de Dados Única Compartilhada. Clique para atualizar."
              >
                <div className="relative flex h-2 w-2 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      syncStatus === 'syncing'
                        ? 'bg-amber-400'
                        : syncStatus === 'synced'
                        ? 'bg-emerald-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      syncStatus === 'syncing'
                        ? 'bg-amber-500'
                        : syncStatus === 'synced'
                        ? 'bg-emerald-500'
                        : 'bg-slate-500'
                    }`}
                  />
                </div>

                <div className="flex flex-col items-start leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] font-bold text-white group-hover:text-emerald-300 transition-colors">
                      {syncStatus === 'syncing' ? 'Salvando' : 'Ao Vivo'}
                    </span>
                    {syncStatus === 'syncing' ? (
                      <RotateCw className="w-2.5 h-2.5 animate-spin text-amber-400" />
                    ) : (
                      <Cloud className="w-2.5 h-2.5 text-emerald-400" />
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 hidden sm:inline">
                    {syncStatus === 'syncing'
                      ? 'Gravando na nuvem...'
                      : lastSyncedAt
                      ? `Sincronizado ${lastSyncedAt}`
                      : 'Compartilhado'}
                  </span>
                </div>
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
      </header>

      {/* Data & Backup Modal */}
      {showToolsModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto"
          onClick={e => {
            if (e.target === e.currentTarget) setShowToolsModal(false);
          }}
        >
          <div className="relative w-full max-w-lg my-auto bg-[#0d1424] border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-b from-[#141f36] to-[#0d1424] border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">
                    Campeonato Único & Backup
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Users className="w-3.5 h-3.5" /> Base Global Compartilhada
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                      Multi-Dispositivo
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowToolsModal(false)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
              {importStatus && (
                <div className="p-3 bg-slate-800/90 rounded-xl text-xs font-semibold text-center border border-slate-700 text-emerald-300 animate-fadeIn">
                  {importStatus}
                </div>
              )}

              {/* Status Info Card */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-300 leading-relaxed">
                  Todos os dispositivos (celular, tablet ou computador) acessam e editam o{' '}
                  <strong className="text-white">mesmo campeonato central</strong>. Ao cadastrar um resultado em um
                  aparelho, todos os outros aparelhos recebem a alteração automaticamente.
                  {lastSyncedAt && (
                    <div className="text-[11px] text-emerald-400 font-mono mt-1.5 flex items-center gap-1.5">
                      <Cloud className="w-3 h-3 inline" />
                      Última atualização registrada: {lastSyncedAt}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 1: Backup Operations */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Backup de Segurança
                </div>

                {/* Export JSON Button */}
                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 text-left transition-all hover:border-emerald-500/40 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-105 transition-transform">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                        Exportar Backup (JSON)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Baixar arquivo com todos os 103 jogos, gols, cartões e chaveamentos
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    Download
                  </span>
                </button>

                {/* Import JSON Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 border border-slate-700/80 text-left transition-all hover:border-blue-500/40 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-105 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors">
                        Importar / Restaurar Backup (JSON)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Restaurar dados e propagar para todos os dispositivos
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-blue-400 font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    Carregar
                  </span>
                </button>
              </div>

              {/* Section 2: Quick Simulations */}
              <div className="pt-2 border-t border-slate-800">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Simulação & Testes Rápidos
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      if (confirm('Simular resultados automáticos para a Rodada 1 para visualização rápida?')) {
                        seedDemoData(24);
                        setShowToolsModal(false);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Simular R1 (24j)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm('Simular todos os 72 jogos da fase de grupos para testar o chaveamento completo do mata-mata?')) {
                        seedDemoData(72);
                        setShowToolsModal(false);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-2 transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-cyan-400" />
                    <span>Simular Grupos (72j)</span>
                  </button>
                </div>
              </div>

              {/* Section 3: Reset Tournament */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={() => {
                    if (
                      confirm(
                        '⚠️ TEM CERTEZA? Isso apagará todos os resultados e reiniciará o campeonato compartilhado do zero para todos os dispositivos.'
                      )
                    ) {
                      resetTournament();
                      setShowToolsModal(false);
                    }
                  }}
                  className="w-full p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reiniciar Campeonato do Zero
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
