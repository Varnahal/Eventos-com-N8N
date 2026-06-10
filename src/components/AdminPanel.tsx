import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Database, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Trash2, 
  LogOut, 
  Search, 
  Filter, 
  Code, 
  Check, 
  Copy, 
  RefreshCw, 
  Cpu, 
  Mail, 
  Bookmark, 
  Phone, 
  Sparkles,
  AlertTriangle
} from "lucide-react";
import { Registration, ConfigStatus } from "../types";

interface AdminPanelProps {
  token: string;
  onLogout: () => void;
}

export default function AdminPanel({ token, onLogout }: AdminPanelProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [loadingRegs, setLoadingRegs] = useState(true);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [errorRegs, setErrorRegs] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  // SQL code copy tracking
  const [copiedSQL, setCopiedSQL] = useState(false);

  // Webhook action states
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Delete protection ID state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);
  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const res = await fetch("/api/config-status");
      if (res.ok) {
        const data = await res.json();
        setConfigStatus(data);
      }
    } catch (err) {
      console.error("Failed to fetch configuration status", err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const fetchRegistrations = async () => {
    try {
      setLoadingRegs(true);
      setErrorRegs(null);
      const res = await fetch("/api/registrations", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao carregar lista de inscritos.");
      }
      setRegistrations(data);
    } catch (err: any) {
      setErrorRegs(err.message || "Erro de conexão ao carregar inscrições.");
    } finally {
      setLoadingRegs(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchRegistrations();
  }, [token]);

  const handleStatusUpdate = async (id: string | number, currentStatus: string, newStatus: string) => {
    if (currentStatus === newStatus) return;
    setActionInProgress(`status-${id}`);
    try {
      const res = await fetch(`/api/registrations/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      const resData = await res.json();
      if (res.ok) {
        // Update local state list
        setRegistrations(prev =>
          prev.map(r => (r.id === id ? { ...r, status: newStatus } : r))
        );
        showFeedback("success", `Inscrição alterada para '${newStatus}' com sucesso!`);
      } else {
        showFeedback("error", resData.error || "Erro ao atualizar status.");
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Erro ao tentar atualizar o status do concorrente.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDeleteRegistration = async (id: string | number) => {
    setActionInProgress(`delete-${id}`);
    try {
      const res = await fetch(`/api/registrations/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      const resData = await res.json();
      if (res.ok) {
        setRegistrations(prev => prev.filter(r => r.id !== id));
        showFeedback("success", "Inscrição removida do sistema com sucesso.");
        setDeleteConfirmId(null);
      } else {
        showFeedback("error", resData.error || "Falha ao remover inscrição.");
      }
    } catch (err: any) {
      showFeedback("error", err.message || "Erro ao tentar conectar à exclusão de dados.");
    } finally {
      setActionInProgress(null);
    }
  };

  // Fetch admin configs and registrations

  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4500);
  };

  const handleCopySQL = () => {
    const sqlText = `-- 1. Criar a tabela de competidores
CREATE TABLE IF NOT EXISTS registrations (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT null,
  name text NOT null,
  email text NOT null UNIQUE,
  game_nickname text NOT null,
  discord text,
  phone text,
  platform text,
  notes text,
  status text DEFAULT 'pendente'
);

-- 2. Desabilitar Row Level Security (RLS) para permitir que a API de inscrição grave os dados sem restrições
ALTER TABLE registrations DISABLE ROW LEVEL SECURITY;`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSQL(true);
    setTimeout(() => setCopiedSQL(false), 2000);
  };

  // Compute stat totals
  const totalInscritos = registrations.length;
  const countPendente = registrations.filter(r => r.status === "pendente").length;
  const countAprovado = registrations.filter(r => r.status === "aprovado").length;
  const countRejeitado = registrations.filter(r => r.status === "rejeitado").length;

  // Filter registrations list with search and conditions
  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.game_nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || r.status === statusFilter;
    const matchesPlatform = platformFilter === "all" || r.platform === platformFilter;

    return matchesSearch && matchesStatus && matchesPlatform;
  });

  return (
    <div className="space-y-8" id="admin-panel-main">
      {/* feedback message popup overlay */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-none shadow-2xl border text-xs font-mono tracking-wide flex items-center gap-3 ${
              feedbackMsg.type === "success" 
                ? "bg-[#12121A] border-indigo-500/50 text-indigo-300" 
                : "bg-black border-rose-500/50 text-rose-300"
            }`}
          >
            <div className={`w-1.5 h-1.5 ${feedbackMsg.type === "success" ? "bg-indigo-400" : "bg-rose-400"}`}></div>
            <span>{feedbackMsg.text.toUpperCase()}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-[#12121A] border border-white/10 rounded-none p-6 shadow-xl relative">
        <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rotate-45 flex items-center justify-center text-white">
            <Sparkles className="-rotate-45 w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <p className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase mb-0.5">// ADMIN_PANEL // EXECUTIVE_VIEW</p>
            <h2 className="text-xl font-display font-black text-white uppercase tracking-wider">Painel de Inscrições</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-[11px] tracking-widest uppercase">
          <button
            onClick={fetchRegistrations}
            disabled={loadingRegs}
            className="px-4 py-2.5 bg-black/60 hover:bg-white/5 border border-white/10 text-slate-300 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 rounded-none"
            title="Recarregar Dados"
            id="refresh-regs-btn"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loadingRegs ? "animate-spin" : ""}`} />
            Sincronizar
          </button>
          
          <button
            onClick={onLogout}
            className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-all flex items-center gap-2 cursor-pointer font-bold rounded-none"
            id="logout-btn"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            Sair
          </button>
        </div>
      </div>

      {/* Database Services Status Header */}
      <div className="grid grid-cols-1 gap-6">
        {/* Supabase Box Status */}
        <div className="bg-[#12121A] border border-white/10 rounded-none p-6 shadow-md flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-1 right-1 w-24 h-24 bg-indigo-600/5 rotate-45 translate-x-12 -translate-y-12 pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <span className="text-[10px] uppercase tracking-widest font-mono text-slate-400 font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                DATABASE_STORE: SUPABASE
              </span>
              {configStatus?.supabaseConfigured ? (
                <span className="bg-indigo-950/40 text-indigo-400 border border-indigo-800/30 text-[9px] px-2.5 py-0.5 font-mono font-bold uppercase tracking-widest rounded-none">
                  [ CONECTADO ]
                </span>
              ) : (
                <span className="bg-amber-950/40 text-amber-500 border border-amber-850/30 text-[9px] px-2.5 py-0.5 font-mono font-bold uppercase tracking-widest rounded-none">
                  [ BANCO_LOCAL ]
                </span>
              )}
            </div>
            
            {configStatus?.supabaseConfigured ? (
              <p className="text-xs text-slate-400 leading-relaxed font-sans mt-2">
                As inscrições dos competidores são transmitidas, atualizadas e removidas em tempo real diretamente de seu cluster Supabase Postgres.
              </p>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Sua chave do banco não está ativa no painel Secrets do AI Studio. Utilizando armazenamento volátil em memória em contêineres locais.
                </p>
                <div className="p-3 bg-amber-500/5 border border-white/5 rounded-none font-mono text-[9px]">
                  <span className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    PERSISTÊNCIA PERMANENTE:
                  </span>
                  <p className="text-slate-400 leading-normal">
                    Configure <code className="text-white font-bold bg-white/5 px-1 py-0.5">SUPABASE_URL</code> e <code className="text-white font-bold bg-white/5 px-1 py-0.5">SUPABASE_ANON_KEY</code> nas Secrets.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* SQL Creator Instructions */}
          {!configStatus?.supabaseConfigured && (
            <div className="mt-4 pt-3 border-t border-white/5">
              <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1 font-mono">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                Cole no "SQL Editor" do Supabase:
              </h4>
              <div className="flex items-center gap-2 bg-black/60 p-2 border border-white/5 rounded-none">
                <code className="text-[9px] text-slate-500 font-mono block overflow-x-auto whitespace-pre truncate grow">
                  create table registrations ( id bigint... );
                </code>
                <button
                  onClick={handleCopySQL}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-none text-slate-400 hover:text-white transition cursor-pointer"
                  title="Copiar SQL completo para o Supabase"
                >
                  {copiedSQL ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytical Counters Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12121A] border border-white/10 rounded-none p-5 shadow-sm flex items-center gap-4 relative">
          <div className="w-1 h-8 bg-indigo-600 absolute left-0"></div>
          <div className="w-10 h-10 bg-black/50 border border-white/5 flex items-center justify-center text-indigo-400 rounded-none">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-widest font-bold">TOTAL INSCRITOS</span>
            <span className="text-xl font-bold font-mono text-white leading-none mt-1 block">{totalInscritos}</span>
          </div>
        </div>

        <div className="bg-[#12121A] border border-white/10 rounded-none p-5 shadow-sm flex items-center gap-4 relative">
          <div className="w-1 h-8 bg-amber-500 absolute left-0"></div>
          <div className="w-10 h-10 bg-black/50 border border-white/5 flex items-center justify-center text-amber-500 rounded-none">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-widest font-bold">AGUARDANDO</span>
            <span className="text-xl font-bold font-mono text-amber-400 leading-none mt-1 block">{countPendente}</span>
          </div>
        </div>

        <div className="bg-[#12121A] border border-white/10 rounded-none p-5 shadow-sm flex items-center gap-4 relative">
          <div className="w-1 h-8 bg-emerald-500 absolute left-0"></div>
          <div className="w-10 h-10 bg-black/50 border border-white/5 flex items-center justify-center text-emerald-400 rounded-none">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-widest font-bold">CONFIRMADOS</span>
            <span className="text-xl font-bold font-mono text-emerald-400 leading-none mt-1 block">{countAprovado}</span>
          </div>
        </div>

        <div className="bg-[#12121A] border border-white/10 rounded-none p-5 shadow-sm flex items-center gap-4 relative">
          <div className="w-1 h-8 bg-rose-500 absolute left-0"></div>
          <div className="w-10 h-10 bg-black/50 border border-white/5 flex items-center justify-center text-rose-550 rounded-none">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] text-slate-500 block uppercase font-mono tracking-widest font-bold">REJEITADOS</span>
            <span className="text-xl font-bold font-mono text-rose-500 leading-none mt-1 block">{countRejeitado}</span>
          </div>
        </div>
      </div>

      {/* Main Registrations Section */}
      <div className="bg-[#12121A] border border-white/10 rounded-none p-6 sm:p-8 shadow-xl space-y-6 relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/5"></div>
        <div>
          <p className="text-[10px] font-mono text-indigo-400 tracking-widest uppercase mb-1">// REGISTERED_PLAYERS</p>
          <h3 className="text-lg font-display font-black tracking-wider uppercase text-white">Competidores Cadastrados</h3>
        </div>

        {/* Searching & Filter Controls Bar */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative grow">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por nome, nickname do jogo ou e-mail..."
              className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-700 font-mono"
            />
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-black/60 border border-white/10 focus:border-indigo-500/80 transition px-4 py-3 text-xs text-slate-300 font-mono outline-none appearance-none cursor-pointer pr-10 rounded-none"
              >
                <option value="all">Filtro: Todos os Status</option>
                <option value="pendente">Status: Pendente</option>
                <option value="aprovado">Status: Aprovado</option>
                <option value="rejeitado">Status: Rejeitado</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>

            <div className="relative">
              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-black/60 border border-white/10 focus:border-indigo-500/80 transition px-4 py-3 text-xs text-slate-300 font-mono outline-none appearance-none cursor-pointer pr-10 rounded-none"
              >
                <option value="all">Filtro: Todas Plataformas</option>
                <option value="PC">PC</option>
                <option value="PlayStation">PlayStation</option>
                <option value="Xbox">Xbox</option>
                <option value="Nintendo Switch">Switch</option>
                <option value="Mobile">Mobile</option>
                <option value="VR">VR</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500 text-[10px]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Data list view representation */}
        {loadingRegs ? (
          <div className="py-24 text-center space-y-4">
            <div className="w-8 h-8 border border-white/20 border-t-indigo-500 animate-spin mx-auto rounded-none"></div>
            <p className="text-slate-500 text-[10px] font-mono uppercase tracking-widest">// REVOLVING_RECORDS_POLL...</p>
          </div>
        ) : errorRegs ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center space-y-4 max-w-lg mx-auto my-12 font-mono">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <p className="font-bold">[ ERROR_FETCH_DEVICES ]</p>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              {errorRegs}
            </p>
            <p className="text-[10px] text-slate-500 leading-relaxed pt-2 border-t border-white/5 uppercase">
              Certifique-se de executar as migrations SQL no Supabase para criar sua estrutura schema corretas.
            </p>
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="bg-black/60 border border-white/5 py-16 text-center text-slate-500 text-xs font-mono tracking-widest">
            [ NENHUM_REGISTRO_ENCONTRADO ]
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/10 rounded-none">
            <table className="w-full text-left border-collapse" id="registrations-table">
              <thead>
                <tr className="bg-black/60 border-b border-white/10 text-[9px] uppercase tracking-widest text-slate-500 font-mono">
                  <th className="py-4 px-4 font-black">Competidor / Registro</th>
                  <th className="py-4 px-4 font-black">Plataforma / Nick</th>
                  <th className="py-4 px-4 font-black">Contato Principal</th>
                  <th className="py-4 px-4 font-black">Observações</th>
                  <th className="py-4 px-4 font-black">Estado</th>
                  <th className="py-4 px-4 font-black text-right">Ações Administrativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-sans">
                {filteredRegistrations.map((reg) => {
                  const isDeletableConfirm = deleteConfirmId === reg.id;
                  const isBusy = actionInProgress === `status-${reg.id}` || actionInProgress === `delete-${reg.id}`;

                  // Helpers for coloring status badges
                  let statusBadgeStyle = "border-amber-500/30 text-amber-500 bg-amber-500/5";
                  if (reg.status === "aprovado") {
                    statusBadgeStyle = "border-indigo-500/35 text-indigo-400 bg-indigo-950/20";
                  } else if (reg.status === "rejeitado") {
                    statusBadgeStyle = "border-rose-500/30 text-rose-500 bg-rose-500/5";
                  }

                  return (
                    <tr 
                      key={reg.id} 
                      className={`hover:bg-white/5 transition-all duration-100 ${
                        isDeletableConfirm ? "bg-rose-950/20" : ""
                      }`}
                    >
                      {/* Name / Date */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="font-bold text-white truncate max-w-[180px]">{reg.name}</div>
                        <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1.5">
                          <span>#{String(reg.id).replace("local_", "")}</span>
                          <span>•</span>
                          <span>{new Date(reg.created_at).toLocaleDateString("pt-BR")}</span>
                        </div>
                      </td>

                      {/* Platform / Nickname */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="text-white font-mono font-bold text-[11px] flex items-center gap-1.5">
                          <span className="text-indigo-400">@</span>
                          <span>{reg.game_nickname}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{reg.platform.toUpperCase()}</div>
                      </td>

                      {/* Discord / Phone / Email */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="text-slate-300 flex items-center gap-1.5 max-w-[170px]" title={reg.email}>
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate font-mono text-[11px]">{reg.email}</span>
                        </div>
                        {reg.discord && (
                          <div className="text-[10px] text-indigo-400 font-mono flex items-center gap-1">
                            <span className="w-1 h-1 bg-indigo-500"></span>
                            <span>{reg.discord}</span>
                          </div>
                        )}
                        {reg.phone && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            <span>Phone: {reg.phone}</span>
                          </div>
                        )}
                      </td>

                      {/* Notes snippet */}
                      <td className="py-4 px-4">
                        <p className="text-[11px] text-slate-400 line-clamp-2 max-w-[180px] leading-relaxed" title={reg.notes || "Sem observações"}>
                          {reg.notes || <span className="text-slate-650 font-mono italic">[ NENHUMA ]</span>}
                        </p>
                      </td>

                      {/* Registration status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-[9px] font-mono border uppercase tracking-wider font-bold rounded-none ${statusBadgeStyle}`}>
                          <span className={`w-1 h-1 ${
                            reg.status === "aprovado" ? "bg-indigo-400 animate-pulse" : reg.status === "rejeitado" ? "bg-rose-500" : "bg-amber-500"
                          }`}></span>
                          {reg.status}
                        </span>
                      </td>

                      {/* Management actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isDeletableConfirm ? (
                            <div className="flex items-center gap-1.5 animate-fadeIn font-mono">
                              <span className="text-[9px] text-rose-500 mr-1">[ CONFIRMAR? ]</span>
                              <button
                                onClick={() => handleDeleteRegistration(reg.id)}
                                disabled={isBusy}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] transition cursor-pointer"
                              >
                                DELETAR
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-[9px] transition cursor-pointer"
                              >
                                NÃO
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Quick switch status keys */}
                              <button
                                onClick={() => handleStatusUpdate(reg.id, reg.status, "aprovado")}
                                disabled={isBusy || reg.status === "aprovado"}
                                className={`p-1.5 transition ${
                                  reg.status === "aprovado" 
                                    ? "text-slate-700 cursor-not-allowed" 
                                    : "text-indigo-400 hover:bg-indigo-500/10 cursor-pointer"
                                }`}
                                title="Aprovar Competidor"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleStatusUpdate(reg.id, reg.status, "rejeitado")}
                                disabled={isBusy || reg.status === "rejeitado"}
                                className={`p-1.5 transition ${
                                  reg.status === "rejeitado" 
                                    ? "text-slate-700 cursor-not-allowed" 
                                    : "text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                                }`}
                                title="Rejeitar Competidor"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleStatusUpdate(reg.id, reg.status, "pendente")}
                                disabled={isBusy || reg.status === "pendente"}
                                className={`p-1.5 transition ${
                                  reg.status === "pendente" 
                                    ? "text-slate-700 cursor-not-allowed" 
                                    : "text-amber-500 hover:bg-amber-500/10 cursor-pointer"
                                }`}
                                title="Deixar como Pendente"
                              >
                                <Clock className="w-4 h-4" />
                              </button>

                              {/* Divider line vertical */}
                              <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                              <button
                                onClick={() => setDeleteConfirmId(reg.id)}
                                disabled={isBusy}
                                className="p-1.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
                                title="Remover Registro"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
