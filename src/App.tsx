import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { Navbar, NavTab } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { StandingsView } from './components/StandingsView';
import { MatchesView } from './components/MatchesView';
import { BracketView } from './components/BracketView';
import { StatsView } from './components/StatsView';
import { MatchModal } from './components/MatchModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { TeamProfileModal } from './components/TeamProfileModal';
import { AuthModal } from './components/AuthModal';
import { Match } from './types/tournament';
import { Cloud, Gamepad2, Shield, Trophy, User } from 'lucide-react';

function TournamentApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const { matches, syncStatus, isLoadingTournament } = useTournament();
  const { user, isOnlineConfigured } = useAuth();

  const handleOpenMatch = (match: Match) => {
    setSelectedMatch(match);
    setIsModalOpen(true);
  };

  const handleOpenMatchById = (matchId: number) => {
    const found = matches.find(m => m.id === matchId);
    if (found) {
      setSelectedMatch(found);
      setIsModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Main Navigation */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} onOpenMatch={handleOpenMatchById} />

      {/* Guest or Account Info Strip */}
      {!user && (
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 border-b border-emerald-500/20 px-3 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Você está no modo convidado. Faça login para salvar seus dados na nuvem e sincronizar em qualquer aparelho.
              </span>
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
            >
              <User className="w-3.5 h-3.5" />
              <span>Entrar ou Criar Conta</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8">
        {isLoadingTournament ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-sm font-bold text-white">Carregando dados do campeonato...</div>
            <div className="text-xs text-slate-400 mt-1">Sincronizando com a sua conta</div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                onOpenMatch={handleOpenMatch}
                onNavigateTab={tab => setActiveTab(tab)}
              />
            )}

            {activeTab === 'standings' && <StandingsView />}

            {activeTab === 'matches' && <MatchesView onOpenMatch={handleOpenMatch} />}

            {activeTab === 'bracket' && <BracketView onOpenMatch={handleOpenMatch} />}

            {activeTab === 'stats' && <StatsView />}
          </>
        )}
      </main>

      {/* Match Result Recording Modal */}
      <MatchModal
        match={selectedMatch}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedMatch(null);
        }}
      />

      {/* Interactive Player and Team Profile Modals */}
      <PlayerProfileModal />
      <TeamProfileModal />

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#080d18] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-400">FIFA Champions League — 48 Times</span>
            <span>• 12 Grupos & Mata-Mata</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" /> Modo Jogo FIFA
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              {isOnlineConfigured ? 'Supabase Conectado (RLS Ativo)' : 'Isolamento por Usuário Ativo'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <TournamentProvider>
        <TournamentApp />
      </TournamentProvider>
    </AuthProvider>
  );
}
