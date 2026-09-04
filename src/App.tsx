import React, { useState } from 'react';
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
import { Match } from './types/tournament';
import { Gamepad2, Heart, Shield, Trophy } from 'lucide-react';

function TournamentApp() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { matches } = useTournament();

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

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8">
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

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-[#080d18] py-6 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-400">FIFA Champions League — 48 Times</span>
            <span>• 12 Grupos & Mata-Mata</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" /> Modo Jogo FIFA
            </span>
            <span>Salvamento Local Automático</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <TournamentProvider>
      <TournamentApp />
    </TournamentProvider>
  );
}
