import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { INITIAL_GROUP_MATCHES } from './src/data/initialData';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const GLOBAL_TOURNAMENT_FILE = path.join(DATA_DIR, 'global_tournament.json');
const LEGACY_TOURNAMENTS_FILE = path.join(DATA_DIR, 'tournaments.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

// Optional Supabase integration for cloud replication
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

let supabaseServer: SupabaseClient | null = null;
if (supabaseUrl && supabaseKey && supabaseUrl.startsWith('https://')) {
  try {
    supabaseServer = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized for global tournament replication');
  } catch (err) {
    console.warn('Supabase client failed to initialize:', err);
  }
}

export interface GlobalTournamentData {
  version: number;
  groupMatches: any[];
  knockoutData: Record<string, any>;
  updatedAt: string;
}

let currentTournament: GlobalTournamentData = {
  version: 1,
  groupMatches: [],
  knockoutData: {},
  updatedAt: new Date().toISOString(),
};

// Initialize or load tournament from disk or Supabase
async function loadInitialTournament(): Promise<void> {
  try {
    // 1. If global_tournament.json exists on disk, load it
    if (fs.existsSync(GLOBAL_TOURNAMENT_FILE)) {
      const raw = fs.readFileSync(GLOBAL_TOURNAMENT_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.groupMatches)) {
        currentTournament = {
          version: typeof parsed.version === 'number' ? parsed.version : 1,
          groupMatches: parsed.groupMatches,
          knockoutData: parsed.knockoutData || {},
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
        console.log('Loaded shared tournament from disk with', currentTournament.groupMatches.length, 'matches');
      }
    }

    // 2. Migration: If legacy tournaments.json exists, migrate the newest tournament
    if ((!currentTournament.groupMatches || currentTournament.groupMatches.length === 0) && fs.existsSync(LEGACY_TOURNAMENTS_FILE)) {
      const rawLegacy = fs.readFileSync(LEGACY_TOURNAMENTS_FILE, 'utf-8');
      const legacyData = JSON.parse(rawLegacy);
      const userKeys = Object.keys(legacyData || {});
      if (userKeys.length > 0) {
        let bestTournament: any = null;
        for (const k of userKeys) {
          const t = legacyData[k];
          if (t && Array.isArray(t.groupMatches)) {
            if (!bestTournament || (t.groupMatches.filter((m: any) => m.played).length > bestTournament.groupMatches.filter((m: any) => m.played).length)) {
              bestTournament = t;
            }
          }
        }

        if (bestTournament && Array.isArray(bestTournament.groupMatches)) {
          currentTournament = {
            version: 1,
            groupMatches: bestTournament.groupMatches,
            knockoutData: bestTournament.knockoutData || {},
            updatedAt: bestTournament.updatedAt || new Date().toISOString(),
          };
          saveTournamentToDisk(currentTournament);
          console.log('Migrated legacy tournament to global shared tournament');
        }
      }
    }

    // 3. If Supabase is connected, check if cloud has newer or populated tournament
    if (supabaseServer) {
      try {
        const { data } = await supabaseServer
          .from('global_tournament')
          .select('*')
          .eq('id', 1)
          .maybeSingle();

        if (data && Array.isArray(data.group_matches) && data.group_matches.length > 0) {
          currentTournament = {
            version: data.version || currentTournament.version || 1,
            groupMatches: data.group_matches,
            knockoutData: data.knockout_data || {},
            updatedAt: data.updated_at || new Date().toISOString(),
          };
          saveTournamentToDisk(currentTournament);
          console.log('Synchronized tournament state from Supabase');
        }
      } catch (cloudErr) {
        console.warn('Could not read from Supabase on start:', cloudErr);
      }
    }

    // 4. Default to initial 72 group matches if still empty
    if (!currentTournament.groupMatches || currentTournament.groupMatches.length === 0) {
      currentTournament = {
        version: 1,
        groupMatches: INITIAL_GROUP_MATCHES,
        knockoutData: {},
        updatedAt: new Date().toISOString(),
      };
      saveTournamentToDisk(currentTournament);
      console.log('Initialized global tournament with default 72 group matches');
    }
  } catch (err) {
    console.error('Error loading global tournament:', err);
  }
}

function saveTournamentToDisk(data: GlobalTournamentData): void {
  try {
    fs.writeFileSync(GLOBAL_TOURNAMENT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving global tournament to disk:', err);
  }

  // Also asynchronously replicate to Supabase if configured
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer
        .from('global_tournament')
        .upsert({
          id: 1,
          name: 'FIFA Champions 48',
          version: data.version,
          group_matches: data.groupMatches,
          knockout_data: data.knockoutData,
          updated_at: data.updatedAt,
        })
    )
      .then((res: any) => {
        if (res && res.error) console.warn('Supabase upsert warning:', res.error.message);
      })
      .catch(err => {
        console.warn('Supabase replicate error:', err);
      });
  }
}

// Server-Sent Events (SSE) subscribers for instant real-time sync across all devices
interface SSEClient {
  id: string;
  res: express.Response;
}
const sseClients = new Set<SSEClient>();

function broadcastTournamentUpdate(senderId?: string): void {
  const message = JSON.stringify({
    type: 'tournament_update',
    senderId: senderId || null,
    data: currentTournament,
  });

  for (const client of Array.from(sseClients)) {
    try {
      client.res.write(`data: ${message}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

async function startServer() {
  await loadInitialTournament();

  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // Prevent any browser or CDN from caching API responses (critical for multi-device sync)
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    next();
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: currentTournament.version,
      connectedClients: sseClients.size,
      updatedAt: currentTournament.updatedAt,
      supabaseConfigured: Boolean(supabaseServer),
    });
  });

  // Real-time SSE stream for all devices
  app.get('/api/tournament/stream', (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const client: SSEClient = { id: clientId, res };
    sseClients.add(client);

    // Initial greeting with current state
    res.write(
      `data: ${JSON.stringify({
        type: 'initial',
        data: currentTournament,
      })}\n\n`
    );

    // Keep connection alive with periodic heartbeat
    const heartbeat = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(heartbeat);
        sseClients.delete(client);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(client);
    });
  });

  // Get the single shared tournament
  app.get('/api/tournament', (_req, res) => {
    res.json({
      success: true,
      data: currentTournament,
    });
  });

  // Atomic match result update (instant sync from any device)
  app.post('/api/tournament/match', (req, res) => {
    try {
      const {
        matchId,
        homeScore,
        awayScore,
        goals,
        winnerTeam,
        decisionType,
        homePenalties,
        awayPenalties,
        clientId,
      } = req.body;

      if (typeof matchId !== 'number') {
        return res.status(400).json({ success: false, error: 'matchId é obrigatório.' });
      }

      const updatedAt = new Date().toISOString();

      if (matchId <= 72) {
        // Group match
        let found = false;
        currentTournament.groupMatches = currentTournament.groupMatches.map((m: any) => {
          if (m.id === matchId) {
            found = true;
            let winner = winnerTeam;
            if (winner === undefined) {
              if (homeScore > awayScore) winner = m.homeTeam;
              else if (awayScore > homeScore) winner = m.awayTeam;
            }
            return {
              ...m,
              homeScore: Number(homeScore) || 0,
              awayScore: Number(awayScore) || 0,
              goals: Array.isArray(goals) ? goals : [],
              isFinished: true,
              winnerTeam: winner,
              decisionType: 'regular',
              updatedAt,
            };
          }
          return m;
        });

        if (!found) {
          // If match wasn't in list, find from initial and add
          const initM = INITIAL_GROUP_MATCHES.find(m => m.id === matchId);
          if (initM) {
            let winner = winnerTeam;
            if (winner === undefined) {
              if (homeScore > awayScore) winner = initM.homeTeam;
              else if (awayScore > homeScore) winner = initM.awayTeam;
            }
            currentTournament.groupMatches.push({
              ...initM,
              homeScore: Number(homeScore) || 0,
              awayScore: Number(awayScore) || 0,
              goals: Array.isArray(goals) ? goals : [],
              isFinished: true,
              winnerTeam: winner,
              decisionType: 'regular',
              updatedAt,
            });
          }
        }
      } else {
        // Knockout match
        currentTournament.knockoutData = {
          ...currentTournament.knockoutData,
          [matchId]: {
            homeScore: Number(homeScore) || 0,
            awayScore: Number(awayScore) || 0,
            goals: Array.isArray(goals) ? goals : [],
            isFinished: true,
            winnerTeam,
            decisionType: decisionType || 'regular',
            homePenalties: typeof homePenalties === 'number' ? homePenalties : undefined,
            awayPenalties: typeof awayPenalties === 'number' ? awayPenalties : undefined,
            updatedAt,
          },
        };
      }

      currentTournament.version = (currentTournament.version || 0) + 1;
      currentTournament.updatedAt = updatedAt;

      saveTournamentToDisk(currentTournament);
      broadcastTournamentUpdate(clientId);

      return res.json({
        success: true,
        version: currentTournament.version,
        updatedAt: currentTournament.updatedAt,
        data: currentTournament,
      });
    } catch (err) {
      console.error('Save match error:', err);
      return res.status(500).json({ success: false, error: 'Erro ao salvar partida.' });
    }
  });

  // Atomic match reset (clear a single match)
  app.post('/api/tournament/reset-match', (req, res) => {
    try {
      const { matchId, clientId } = req.body;
      if (typeof matchId !== 'number') {
        return res.status(400).json({ success: false, error: 'matchId é obrigatório.' });
      }

      const updatedAt = new Date().toISOString();

      if (matchId <= 72) {
        currentTournament.groupMatches = currentTournament.groupMatches.map((m: any) => {
          if (m.id === matchId) {
            return {
              ...m,
              homeScore: undefined,
              awayScore: undefined,
              goals: [],
              isFinished: false,
              winnerTeam: undefined,
              decisionType: undefined,
              updatedAt,
            };
          }
          return m;
        });
      } else {
        const nextKnockout = { ...currentTournament.knockoutData };
        delete nextKnockout[matchId];
        currentTournament.knockoutData = nextKnockout;
      }

      currentTournament.version = (currentTournament.version || 0) + 1;
      currentTournament.updatedAt = updatedAt;

      saveTournamentToDisk(currentTournament);
      broadcastTournamentUpdate(clientId);

      return res.json({
        success: true,
        version: currentTournament.version,
        updatedAt: currentTournament.updatedAt,
        data: currentTournament,
      });
    } catch (err) {
      console.error('Reset match error:', err);
      return res.status(500).json({ success: false, error: 'Erro ao resetar partida.' });
    }
  });

  // Save full tournament (for simulation, import, or batch updates)
  app.post('/api/tournament', (req, res) => {
    try {
      const { groupMatches, knockoutData, clientId, isReset, isImport, isSimulation } = req.body;

      if (!groupMatches || !Array.isArray(groupMatches)) {
        return res.status(400).json({ success: false, error: 'groupMatches deve ser uma lista válida.' });
      }

      let finalGroupMatches = groupMatches;

      // Protection: if not an explicit reset, import, or simulation, preserve any played matches already on the server
      if (!isReset && !isImport && !isSimulation) {
        finalGroupMatches = groupMatches.map((incomingM: any) => {
          const existingM = currentTournament.groupMatches.find((e: any) => e.id === incomingM.id);
          if (existingM && existingM.isFinished && !incomingM.isFinished) {
            // Keep the finished match from the server
            return existingM;
          }
          return incomingM;
        });
      }

      currentTournament = {
        version: (currentTournament.version || 0) + 1,
        groupMatches: finalGroupMatches,
        knockoutData: knockoutData || currentTournament.knockoutData || {},
        updatedAt: new Date().toISOString(),
      };

      saveTournamentToDisk(currentTournament);
      broadcastTournamentUpdate(clientId);

      return res.json({
        success: true,
        version: currentTournament.version,
        updatedAt: currentTournament.updatedAt,
        data: currentTournament,
      });
    } catch (err) {
      console.error('Save tournament error:', err);
      return res.status(500).json({ success: false, error: 'Erro ao salvar o campeonato.' });
    }
  });

  // Reset the shared tournament
  app.post('/api/tournament/reset', (req, res) => {
    try {
      const { clientId } = req.body;
      currentTournament = {
        version: (currentTournament.version || 0) + 1,
        groupMatches: INITIAL_GROUP_MATCHES,
        knockoutData: {},
        updatedAt: new Date().toISOString(),
      };

      saveTournamentToDisk(currentTournament);
      broadcastTournamentUpdate(clientId);

      return res.json({
        success: true,
        version: currentTournament.version,
        updatedAt: currentTournament.updatedAt,
        data: currentTournament,
      });
    } catch (err) {
      console.error('Reset tournament error:', err);
      return res.status(500).json({ success: false, error: 'Erro ao reiniciar o campeonato.' });
    }
  });

  // Vite middleware in dev, static files in prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Shared Tournament Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
