import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// Simple TypeScript interfaces for type safety
interface Registration {
  id: string | number;
  created_at: string;
  name: string;
  email: string;
  game_nickname: string;
  discord: string;
  phone: string;
  platform: string;
  notes: string;
  status: "pendente" | "aprovado" | "rejeitado";
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON body parser with generous limit
  app.use(express.json());

  // Initialize Supabase Client if env is present
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
  const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);
  
  let supabase: any = null;
  if (isSupabaseConfigured) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log("Supabase client initialized successfully.");
    } catch (err) {
      console.error("Failed to initialize Supabase client:", err);
    }
  } else {
    console.log("Supabase keys are missing. Using in-memory fallback database.");
  }

  // In-memory array fallback to prevent crashes if Supabase isn't linked yet
  const localRegistrations: Registration[] = [];

  // Middleware for Admin Session Authentication
  const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    const correctPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Acesso negado. Token de autenticação não fornecido." });
    }

    const token = authHeader.split(" ")[1];
    if (token === correctPassword) {
      next();
    } else {
      res.status(403).json({ error: "Sua sessão expirou ou a senha está incorreta." });
    }
  };

  // --- API ENDPOINTS ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Status check (Check which integrations are active)
  app.get("/api/config-status", (req, res) => {
    res.json({
      supabaseConfigured: isSupabaseConfigured,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : null,
      hasAdminPasswordSet: !!process.env.ADMIN_PASSWORD,
    });
  });

  // Admin login credentials checking
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const correctPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (username === "admin" && password === correctPassword) {
      return res.json({ success: true, token: correctPassword });
    }
    return res.status(401).json({ success: false, error: "Usuário ou senha incorretos." });
  });

  // Submit registration form
  app.post("/api/register", async (req, res) => {
    const { name, email, game_nickname, discord, phone, platform, notes } = req.body;

    if (!name || !email || !game_nickname) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes (Nome, E-mail, Nickname)." });
    }

    // 1. If Supabase is configured, attempt write to Supabase.
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("registrations")
          .insert([
            {
              name,
              email: email.trim(),
              game_nickname: game_nickname.trim(),
              discord: discord ? discord.trim() : "",
              phone: phone ? phone.trim() : "",
              platform: platform || "PC",
              notes: notes || "",
              status: "pendente"
            }
          ])
          .select();

        if (error) {
          console.error("Supabase write failed code:", error.code, "message:", error.message);
          
          // Specific check for Row-Level Security policy block
          if (error.code === "42501" || error.message?.includes("row-level security") || String(error).includes("row-level security")) {
            return res.status(403).json({
              error: "A gravação no Supabase foi bloqueada pelas políticas de segurança (RLS - Row Level Security).",
              details: "Para permitir que competidores se inscrevam, você precisa desabilitar o RLS ou criar uma política de inserção pública. Para desabilitar, execute no SQL Editor do seu Supabase:\n\nALTER TABLE registrations DISABLE ROW LEVEL SECURITY;"
            });
          }
          
          // Specific check for duplicate key (unique email or id)
          if (error.code === "23505" || error.message?.includes("violates unique constraint") || error.message?.includes("duplicate key")) {
            return res.status(400).json({
              error: "Este endereço de e-mail já está cadastrado em nosso torneio!",
              details: "Cada competidor deve usar um e-mail único."
            });
          }

          return res.status(400).json({
            error: `Erro ao salvar no Supabase: ${error.message}`,
            details: error
          });
        }

        if (data && data.length > 0) {
          return res.json({
            success: true,
            data: data[0],
            database: "Supabase"
          });
        } else {
          return res.status(500).json({ error: "O Supabase não retornou dados após salvar." });
        }
      } catch (err: any) {
        console.error("Supabase exception caught:", err);
        return res.status(500).json({
          error: "Ocorreu uma exceção inesperada ao tentar gravar no Supabase.",
          details: err.message || String(err)
        });
      }
    } else {
      // 2. In-memory store fallback path (Supabase not configured or in local development status)
      const emailLower = email.trim().toLowerCase();
      const duplicate = localRegistrations.find(r => r.email.trim().toLowerCase() === emailLower);
      if (duplicate) {
        return res.status(400).json({
          error: "Este endereço de e-mail já está cadastrado em nosso torneio!",
          details: "O e-mail informado já existe no banco de dados local da aplicação."
        });
      }

      const fbReg: Registration = {
        id: `local_${Date.now()}`,
        created_at: new Date().toISOString(),
        name: name.trim(),
        email: email.trim(),
        game_nickname: game_nickname.trim(),
        discord: discord ? discord.trim() : "",
        phone: phone ? phone.trim() : "",
        platform: platform || "PC",
        notes: notes || "",
        status: "pendente"
      };
      localRegistrations.push(fbReg);
      
      return res.json({
        success: true,
        data: fbReg,
        database: "Fallback Local (In-Memory)"
      });
    }
  });

  // Get all registrations list (Admin only)
  app.get("/api/registrations", authenticateAdmin, async (req, res) => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("registrations")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          return res.status(500).json({ 
            error: "Erro ao ler do Supabase. Verifique se a tabela 'registrations' foi criada conforme as instruções.",
            details: error 
          });
        }
        return res.json(data);
      } catch (err: any) {
        return res.status(500).json({ error: "Erro na conexão com Supabase.", details: err.message });
      }
    } else {
      // Return local registrations (sorted by newest, fallback)
      const sortedLocal = [...localRegistrations].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return res.json(sortedLocal);
    }
  });

  // Update registration status (Admin only)
  app.patch("/api/registrations/:id/status", authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pendente", "aprovado", "rejeitado"].includes(status)) {
      return res.status(400).json({ error: "Status inválido. Deve ser 'pendente', 'aprovado' ou 'rejeitado'." });
    }

    let updatedRegistration: Registration | null = null;
    let usingSupabase = false;

    if (isSupabaseConfigured && supabase && !String(id).startsWith("local_")) {
      try {
        const { data, error } = await supabase
          .from("registrations")
          .update({ status })
          .eq("id", id)
          .select();

        if (error) {
          return res.status(500).json({ error: "Erro ao atualizar status no Supabase.", details: error });
        }

        if (data && data.length > 0) {
          updatedRegistration = data[0];
          usingSupabase = true;
        }
      } catch (err: any) {
        return res.status(500).json({ error: "Erro de servidor ao atualizar Supabase.", details: err.message });
      }
    }

    // Fallback or local status update
    if (!updatedRegistration) {
      const foundIdx = localRegistrations.findIndex(r => String(r.id) === String(id));
      if (foundIdx !== -1) {
        localRegistrations[foundIdx].status = status;
        updatedRegistration = localRegistrations[foundIdx];
      }
    }

    if (!updatedRegistration) {
      return res.status(404).json({ error: "Inscrição não encontrada no banco local nem no remoto." });
    }

    return res.json({
      success: true,
      data: updatedRegistration
    });
  });

  // Delete registration record (Admin only)
  app.delete("/api/registrations/:id", authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    let usingSupabase = false;
    let deletedSuccess = false;

    if (isSupabaseConfigured && supabase && !String(id).startsWith("local_")) {
      try {
        const { error } = await supabase
          .from("registrations")
          .delete()
          .eq("id", id);

        if (error) {
          return res.status(500).json({ error: "Erro ao deletar no Supabase.", details: error });
        }
        deletedSuccess = true;
        usingSupabase = true;
      } catch (err: any) {
        return res.status(500).json({ error: "Erro de exclusão no Supabase.", details: err.message });
      }
    }

    // Always check/delete from local list as fallback or complete sync
    const initialLen = localRegistrations.length;
    const foundIdx = localRegistrations.findIndex(r => String(r.id) === String(id));
    if (foundIdx !== -1) {
      localRegistrations.splice(foundIdx, 1);
      deletedSuccess = true;
    }

    if (!deletedSuccess) {
      return res.status(404).json({ error: "Inscrição não encontrada para exclusão." });
    }

    return res.json({ success: true, message: "Inscrição removida com sucesso.", id });
  });



  // --- DEV & PROD VIEW ROUTING ---

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // PORT value must be 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
