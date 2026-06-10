import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Gamepad2, 
  Mail, 
  User, 
  Phone, 
  Hash, 
  Cpu, 
  AlertCircle, 
  Bookmark,
  Database
} from "lucide-react";
import { Registration } from "../types";

interface RegistrationFormProps {
  onSuccess: (data: Registration, webhookSuccess: boolean) => void;
}

export default function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    game_nickname: "",
    discord: "",
    phone: "",
    platform: "PC",
    notes: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorDetails(null);

    // Simple validations
    if (!formData.name.trim() || !formData.email.trim() || !formData.game_nickname.trim()) {
      setError("Por favor, preencha todos os campos obrigatórios (Nome, E-mail e Nickname).");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const resData = await response.json();

      if (!response.ok) {
        if (resData.details) {
          setErrorDetails(typeof resData.details === 'object' ? JSON.stringify(resData.details, null, 2) : resData.details);
        }
        throw new Error(resData.error || "Erro ao realizar inscrição.");
      }

      setSuccessData(resData);
      onSuccess(resData.data, false);
    } catch (err: any) {
      setError(err.message || "Erro de conexão com o servidor de inscrição.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setFormData({
      name: "",
      email: "",
      game_nickname: "",
      discord: "",
      phone: "",
      platform: "PC",
      notes: ""
    });
    setSuccessData(null);
    setError(null);
  };

  if (successData) {
    const reg = successData.data;
    
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-xl mx-auto"
        id="success-ticket-container"
      >
        {/* Ticket Header Wrapper */}
        <div className="bg-[#12121A] border border-white/10 rounded-none overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 px-6 py-8 text-center text-white relative border-b border-white/10">
            <div className="absolute top-4 right-4 bg-black/40 border border-white/10 text-[9px] uppercase font-mono tracking-widest px-2.5 py-1 text-indigo-300 font-bold">
              [ INSCRIÇÃO_ATIVA ]
            </div>
            
            <div className="w-12 h-12 mx-auto bg-indigo-600 rotate-45 flex items-center justify-center mb-4 text-white">
              <Gamepad2 className="-rotate-45 w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-xl font-display font-black tracking-widest uppercase italic">CREDENCIAL CONFIRMADA</h3>
            <p className="text-slate-400 text-xs mt-2 font-mono">[ ENTRY_TICKET // VERIFIED ]</p>
          </div>

          <div className="bg-black/30 p-6 sm:p-8 space-y-6 relative border-y border-dashed border-white/10">
            {/* Ticket Information Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 border-b border-white/5 pb-3">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Competidor</span>
                <p className="text-lg font-bold text-white truncate mt-0.5">{reg.name}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Nick de Combate</span>
                <p className="text-indigo-400 font-mono font-bold text-sm bg-indigo-950/20 px-2 py-1 border border-indigo-800/10 truncate mt-1">
                  @{reg.game_nickname}
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Dispositivo / Plataforma</span>
                <p className="text-slate-350 font-bold text-sm mt-1 flex items-center gap-1.5 font-mono">
                  <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                  {reg.platform.toUpperCase()}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">ID Registro</span>
                <p className="text-white font-mono text-xs mt-1">#{String(reg.id).replace("local_", "")}</p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Data Emissão</span>
                <p className="text-white font-mono text-xs mt-1">
                  {new Date(reg.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>

              {reg.discord && (
                <div className="col-span-2 border-t border-white/5 pt-3">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Discord Origin</span>
                  <p className="text-sm font-mono text-slate-300 mt-1 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500"></span>
                    {reg.discord}
                  </p>
                </div>
              )}
            </div>

            {/* Simulated Ticket Cutout Rings */}
            <div className="absolute -left-3 bottom-0 w-6 h-6 rounded-full bg-[#0A0A0F] border-r border-white/10"></div>
            <div className="absolute -right-3 bottom-0 w-6 h-6 rounded-full bg-[#0A0A0F] border-l border-white/10"></div>
          </div>

          {/* Integration Status Footer on Ticket */}
          <div className="bg-[#12121A] p-6 space-y-4 font-mono text-xs">
            <div className="p-4 bg-black/50 border border-white/5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 text-[10px] tracking-wider uppercase">SALVO NO BANCO:</span>
                <span className={`font-bold flex items-center gap-1.5 ${
                  successData.database === "Supabase" ? "text-indigo-400" : "text-amber-500"
                }`}>
                  <span className={`w-1.5 h-1.5 ${
                    successData.database === "Supabase" ? "bg-indigo-400" : "bg-amber-500"
                  }`}></span>
                  {successData.database.toUpperCase()}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[10px]">STATUS CRONOGRAMA:</span>
                <span className="text-indigo-400 font-bold">[ SISTEMA_ATIVO ]</span>
              </div>
            </div>

            {/* Sci-fi Barcode Element */}
            <div className="pt-2 text-center text-slate-500">
              <div className="h-10 mx-auto w-3/4 bg-black/60 border border-white/5 flex items-center justify-between px-4 overflow-hidden relative opacity-70">
                {[...Array(28)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1.5 : 0.8)}px`,
                      backgroundColor: "#4f46e5"
                    }}
                    className="h-full inline-block"
                  ></div>
                ))}
              </div>
              <span className="text-[9px] uppercase tracking-widest text-slate-600 block mt-2">
                VERIFIED_BARCODE_SUPABASE_#_{String(reg.id).substr(0, 8)}
              </span>
            </div>
            
            <button
              onClick={handleResetForm}
              className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all font-mono py-3 text-center uppercase tracking-widest text-[11px] cursor-pointer"
              id="register-another-btn"
            >
              [ + REALIZAR_OUTRO_REGISTRO ]
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-[#12121A]/80 border border-white/10 p-6 sm:p-10 relative overflow-hidden rounded-none"
    >
      {/* Upper precise outline */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>

      <div className="mb-8">
        <p className="text-xs font-mono text-indigo-400 tracking-widest uppercase mb-1">// SUBMIT_REGISTRATION</p>
        <h2 className="text-2xl font-display font-black text-white flex items-center gap-3 tracking-wider uppercase">
          Fazer Minha Inscrição
        </h2>
        <p className="text-slate-400 text-xs mt-2">Seus dados de competidor serão persistidos em tempo real em nosso banco de dados relacional Supabase.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex flex-col gap-2 font-mono">
          <div className="flex gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <span className="font-bold">[ ERROR_LOG ]:</span> {error}
            </div>
          </div>
          {errorDetails && (
            <div className="mt-2 pt-2 border-t border-white/5 text-slate-400 text-[10px] leading-relaxed whitespace-pre-wrap">
              <span className="text-rose-450 font-bold block mb-1">COMO RESOLVER:</span>
              {errorDetails}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-slate-350 text-[10px] uppercase tracking-wider font-mono mb-2" htmlFor="name">
            Nome Completo <span className="text-indigo-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex: Pedro Henrique Silva"
              className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-700 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-350 text-[10px] uppercase tracking-wider font-mono mb-2" htmlFor="email">
              E-mail Principal <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="pedro.silva@email.com"
                className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-700 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-350 text-[10px] uppercase tracking-wider font-mono mb-2" htmlFor="game_nickname">
              Game Nickname <span className="text-indigo-400">*</span>
            </label>
            <div className="relative">
              <Hash className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                id="game_nickname"
                name="game_nickname"
                required
                value={formData.game_nickname}
                onChange={handleInputChange}
                placeholder="Ex: ShadowHunter99"
                className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-700 font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-slate-350 text-[10px] uppercase tracking-wider font-mono mb-2" htmlFor="discord">
              Discord ID
            </label>
            <div className="relative">
              <Bookmark className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                id="discord"
                name="discord"
                value={formData.discord}
                onChange={handleInputChange}
                placeholder="username#0000"
                className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-700 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-350 text-[10px] uppercase tracking-wider font-mono mb-2" htmlFor="phone">
              WhatsApp / Celular
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="(11) 98765-4321"
                className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all pl-12 pr-4 py-3 text-xs text-white placeholder:text-slate-700 font-mono"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-350 text-[10px] uppercase tracking-wider font-mono mb-2" htmlFor="platform">
            Plataforma Principal de Jogos
          </label>
          <div className="relative">
            <Cpu className="absolute left-4 top-3.5 w-4 h-4 text-slate-500" />
            <select
              id="platform"
              name="platform"
              value={formData.platform}
              onChange={handleInputChange}
              className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all pl-12 pr-10 py-3 text-xs text-slate-300 font-mono appearance-none cursor-pointer"
            >
              <option value="PC">Computador (PC)</option>
              <option value="PlayStation">PlayStation 4 / 5</option>
              <option value="Xbox">Xbox Series / One</option>
              <option value="Nintendo Switch">Nintendo Switch</option>
              <option value="Mobile">Mobile (Android / iOS)</option>
              <option value="VR">Virtual Reality (VR / Quest)</option>
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500 text-[10px]">
              ▼
            </div>
          </div>
        </div>

        <div>
          <label className="block text-slate-350 text-[10px] uppercase tracking-wider font-mono mb-2" htmlFor="notes">
            Observações de Combate
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleInputChange}
            placeholder="Ex: Procuro equipe ativa ou jogo estilo FPS..."
            className="w-full bg-black/60 border border-white/10 focus:border-indigo-500/80 outline-none transition-all p-4 text-xs text-white placeholder:text-slate-700 font-mono resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 px-4 text-xs tracking-[0.2em] font-mono transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed justify-center flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(79,70,229,0.25)]"
          id="submit-registration-btn"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-none animate-spin"></div>
              <span>REGISTRANDO_VAGA...</span>
            </>
          ) : (
            <>
              <span>[ CONFIRMAR_INSCRIÇÃO_NA_ARENA ]</span>
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
