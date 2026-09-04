import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const ACCOUNTS_FILE = path.join(DATA_DIR, 'accounts.json');
const TOURNAMENTS_FILE = path.join(DATA_DIR, 'tournaments.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data directory:', err);
  }
}

interface ServerAccount {
  id: string;
  identifier: string; // raw or normalized
  type: 'email' | 'phone';
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  provider: 'email' | 'phone';
  createdAt: string;
  normalizedPhoneDigits?: string;
}

function readAccounts(): ServerAccount[] {
  try {
    if (fs.existsSync(ACCOUNTS_FILE)) {
      const data = fs.readFileSync(ACCOUNTS_FILE, 'utf-8');
      return JSON.parse(data) || [];
    }
  } catch (err) {
    console.error('Error reading accounts file:', err);
  }
  return [];
}

function writeAccounts(accounts: ServerAccount[]): void {
  try {
    fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing accounts file:', err);
  }
}

function readTournaments(): Record<string, unknown> {
  try {
    if (fs.existsSync(TOURNAMENTS_FILE)) {
      const data = fs.readFileSync(TOURNAMENTS_FILE, 'utf-8');
      return JSON.parse(data) || {};
    }
  } catch (err) {
    console.error('Error reading tournaments file:', err);
  }
  return {};
}

function writeTournaments(tournaments: Record<string, unknown>): void {
  try {
    fs.writeFileSync(TOURNAMENTS_FILE, JSON.stringify(tournaments, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing tournaments file:', err);
  }
}

// Phone normalization helper
function extractDigits(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith('55')) {
    digits = digits.slice(2);
  }
  return digits;
}

function matchIdentifier(acc: ServerAccount, rawInput: string): boolean {
  const trimmed = rawInput.trim();
  if (trimmed.includes('@')) {
    return acc.type === 'email' && acc.identifier.toLowerCase() === trimmed.toLowerCase();
  }

  // Compare phone numbers
  const inputDigits = extractDigits(trimmed);
  const accDigits = acc.normalizedPhoneDigits || extractDigits(acc.identifier);

  if (inputDigits === accDigits) return true;
  if (inputDigits.length >= 8 && accDigits.length >= 8) {
    const inputLast8 = inputDigits.slice(-8);
    const accLast8 = accDigits.slice(-8);
    if (inputLast8 === accLast8) {
      if (inputDigits.length >= 10 && accDigits.length >= 10) {
        return inputDigits.slice(0, 2) === accDigits.slice(0, 2);
      }
      return true;
    }
  }

  return acc.identifier.toLowerCase() === trimmed.toLowerCase();
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', serverTime: new Date().toISOString() });
  });

  // Auth: Register
  app.post('/api/auth/register', (req, res) => {
    try {
      const { identifier, password, displayName } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ success: false, error: 'Identificador e senha são obrigatórios.' });
      }

      const accounts = readAccounts();
      const existing = accounts.find(acc => matchIdentifier(acc, identifier));
      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Já existe uma conta com este e-mail ou telefone. Faça login.',
        });
      }

      const isEmail = identifier.includes('@');
      const type: 'email' | 'phone' = isEmail ? 'email' : 'phone';
      const cleanDigits = isEmail ? undefined : extractDigits(identifier);
      const canonicalPhone = isEmail
        ? undefined
        : cleanDigits && (cleanDigits.length === 10 || cleanDigits.length === 11)
        ? `+55${cleanDigits}`
        : `+${cleanDigits || identifier}`;

      const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newAccount: ServerAccount = {
        id: newId,
        identifier: isEmail ? identifier.trim().toLowerCase() : canonicalPhone || identifier.trim(),
        type,
        passwordHash: password,
        displayName: displayName?.trim() || (isEmail ? identifier.split('@')[0] : 'Treinador'),
        provider: type,
        createdAt: new Date().toISOString(),
        normalizedPhoneDigits: cleanDigits,
      };

      accounts.push(newAccount);
      writeAccounts(accounts);

      return res.json({
        success: true,
        user: {
          id: newAccount.id,
          email: newAccount.type === 'email' ? newAccount.identifier : undefined,
          phone: newAccount.type === 'phone' ? newAccount.identifier : undefined,
          displayName: newAccount.displayName,
          provider: newAccount.provider,
          createdAt: newAccount.createdAt,
        },
      });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ success: false, error: 'Erro interno ao criar conta.' });
    }
  });

  // Auth: Login
  app.post('/api/auth/login', (req, res) => {
    try {
      const { identifier, password } = req.body;
      if (!identifier || !password) {
        return res.status(400).json({ success: false, error: 'Identificador e senha são obrigatórios.' });
      }

      const accounts = readAccounts();
      const found = accounts.find(acc => matchIdentifier(acc, identifier));

      if (!found) {
        return res.status(404).json({
          success: false,
          error: 'Nenhuma conta encontrada com este e-mail ou telefone. Crie sua conta primeiro.',
        });
      }

      if (found.passwordHash !== password) {
        return res.status(401).json({
          success: false,
          error: 'Senha incorreta. Verifique e tente novamente.',
        });
      }

      return res.json({
        success: true,
        user: {
          id: found.id,
          email: found.type === 'email' ? found.identifier : undefined,
          phone: found.type === 'phone' ? found.identifier : undefined,
          displayName: found.displayName,
          provider: found.provider,
          avatarUrl: found.avatarUrl,
          createdAt: found.createdAt,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ success: false, error: 'Erro interno ao realizar login.' });
    }
  });

  // Auth: Batch Sync Local Accounts (e.g. migrate accounts from mobile browser storage)
  app.post('/api/auth/sync-local', (req, res) => {
    try {
      const { localAccounts } = req.body;
      if (!Array.isArray(localAccounts)) {
        return res.json({ success: true, count: 0 });
      }

      const accounts = readAccounts();
      let added = 0;

      for (const item of localAccounts) {
        if (!item.identifier || !item.passwordHash) continue;
        const exists = accounts.find(a => matchIdentifier(a, item.identifier));
        if (!exists) {
          const isEmail = item.identifier.includes('@');
          const cleanDigits = isEmail ? undefined : extractDigits(item.identifier);
          accounts.push({
            id: item.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            identifier: item.identifier,
            type: item.type || (isEmail ? 'email' : 'phone'),
            passwordHash: item.passwordHash,
            displayName: item.displayName || 'Treinador',
            avatarUrl: item.avatarUrl,
            provider: item.provider || (isEmail ? 'email' : 'phone'),
            createdAt: item.createdAt || new Date().toISOString(),
            normalizedPhoneDigits: cleanDigits,
          });
          added++;
        }
      }

      if (added > 0) {
        writeAccounts(accounts);
      }

      return res.json({ success: true, synced: added, total: accounts.length });
    } catch (err) {
      console.error('Sync local error:', err);
      return res.status(500).json({ success: false, error: 'Erro ao sincronizar contas.' });
    }
  });

  // Auth: Reset Password
  app.post('/api/auth/reset-password', (req, res) => {
    try {
      const { identifier } = req.body;
      if (!identifier) {
        return res.status(400).json({ success: false, error: 'Informe seu e-mail ou telefone.' });
      }

      const accounts = readAccounts();
      const found = accounts.find(acc => matchIdentifier(acc, identifier));

      if (!found) {
        return res.status(404).json({
          success: false,
          error: 'Nenhuma conta localizada com este e-mail ou telefone.',
        });
      }

      const isEmail = identifier.includes('@');
      return res.json({
        success: true,
        message: isEmail
          ? `Instruções de redefinição enviadas para ${identifier}. Verifique seu e-mail.`
          : `Código de redefinição enviado via SMS para ${identifier}.`,
      });
    } catch (err) {
      console.error('Reset password error:', err);
      return res.status(500).json({ success: false, error: 'Erro ao processar recuperação.' });
    }
  });

  // Tournaments: Get for User
  app.get('/api/tournaments/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const tournaments = readTournaments();
      const data = tournaments[userId];
      if (!data) {
        return res.json({ success: true, data: null });
      }
      return res.json({ success: true, data });
    } catch (err) {
      console.error('Get tournament error:', err);
      return res.status(500).json({ success: false, error: 'Erro ao buscar torneio.' });
    }
  });

  // Tournaments: Save for User
  app.post('/api/tournaments/:userId', (req, res) => {
    try {
      const { userId } = req.params;
      const payload = req.body;
      const tournaments = readTournaments();
      tournaments[userId] = {
        ...payload,
        updatedAt: new Date().toISOString(),
      };
      writeTournaments(tournaments);
      return res.json({ success: true, updatedAt: tournaments[userId].updatedAt });
    } catch (err) {
      console.error('Save tournament error:', err);
      return res.status(500).json({ success: false, error: 'Erro ao salvar torneio.' });
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
