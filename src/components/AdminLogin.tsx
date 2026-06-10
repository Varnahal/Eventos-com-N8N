import React, { useState } from "react";
import { motion } from "motion/react";
import { ShieldAlert, KeyRound, User, AlertCircle, ArrowLeft } from "lucide-react";

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
  onBackToVisitor: () => void;
}

export default function AdminLogin({ onLoginSuccess, onBackToVisitor }: AdminLoginProps) {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Dados de acesso inválidos.");
      }

      onLoginSuccess(data.token);
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao servidor administrativos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="w-full max-w-md mx-auto"
      id="admin-login-container"
    >
      <div className="bg-[#12121A] border border-white/10 rounded-none p-6 sm:p-10 shadow-2xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>

        {/* Back navigation button */}
        <button
          onClick={onBackToVisitor}
          className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition text-[10px] flex items-center gap-1.5 font-mono uppercase tracking-widest cursor-pointer"
          id="back-to-form-btn"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-400" />
          [ VOLTAR ]
        </button>

        <div className="text-center pt-8 mb-8">
          <div className="w-12 h-12 bg-indigo-600 rotate-45 flex items-center justify-center mx-auto mb-4 text-white">
            <ShieldAlert className="-rotate-45 w-6 h-6 stroke-[2]" />
          </div>
          <p className="text-[10px] text-indigo-400 font-mono tracking-widest uppercase mb-1">// SECURE_PORTAL</p>
          <h3 className="text-xl font-display font-black tracking-wider uppercase text-white">Área do ADM</h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">Painel de gerenciamento corporativo de inscrições dos competidores.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex gap-2 font-mono">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
            <div>
              <span className="font-bold">[ ACCESS_DENIED ]:</span> {error}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-slate-350 text-[10px] uppercase tracking-wider font-mono mb-2" htmlFor="admin-username">
              Nome de Usuário
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                id="admin-username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nome do administrador"
                className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-700 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1.5">Usuário pré-definido: <code className="text-indigo-400 font-bold">admin</code></p>
          </div>

          <div>
            <label className="block text-slate-350 text-[10px] uppercase tracking-wider font-mono mb-2" htmlFor="admin-password">
              Senha de Acesso
            </label>
            <div className="relative">
              <KeyRound className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                id="admin-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Insira a senha mestra"
                className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-700 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1.5 leading-relaxed">
              Define via env <code className="text-indigo-400">ADMIN_PASSWORD</code>. Senha padrão: <code className="text-indigo-400">admin123</code>.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 text-xs tracking-[0.15em] font-mono transition-all duration-150 disabled:opacity-50 cursor-pointer shadow-[0_0_20px_rgba(79,70,229,0.25)]"
            id="admin-login-btn"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-none animate-spin mx-auto"></div>
            ) : (
              "[ EFETUAR_AUTENTICACAO ]"
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-white/5 text-center">
          <span className="text-[9px] text-slate-600 font-mono tracking-widest">[ SHIELD_INTEGRITY_LEVEL_HIGH ]</span>
        </div>
      </div>
    </motion.div>
  );
}
