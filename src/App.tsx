import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Gamepad2, 
  Users, 
  Lock, 
  Trophy, 
  Calendar, 
  MapPin, 
  Flame, 
  ShieldCheck,
  Database
} from "lucide-react";
import RegistrationForm from "./components/RegistrationForm";
import AdminLogin from "./components/AdminLogin";
import AdminPanel from "./components/AdminPanel";
import { Registration } from "./types";

enum AppTab {
  VISITOR_REGISTRATION = "visitor",
  ADMIN_PORTAL = "admin"
}

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.VISITOR_REGISTRATION);
  
  // Persistent admin authentication token (loaded from localStorage)
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return typeof window !== "undefined" ? localStorage.getItem("game_event_admin_token") : null;
  });

  // Keep track of the last successful registration strictly on current session
  const [sessionRegSuccess, setSessionRegSuccess] = useState<{
    data: Registration;
    webhookSuccess: boolean;
  } | null>(null);

  const handleAdminLogin = (token: string) => {
    setAdminToken(token);
    localStorage.setItem("game_event_admin_token", token);
    setActiveTab(AppTab.ADMIN_PORTAL);
  };

  const handleAdminLogout = () => {
    setAdminToken(null);
    localStorage.removeItem("game_event_admin_token");
    setActiveTab(AppTab.VISITOR_REGISTRATION);
  };

  const handleRegistrationCompleted = (data: Registration, webhookSuccess: boolean) => {
    setSessionRegSuccess({ data, webhookSuccess });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-slate-200 font-sans flex flex-col selection:bg-indigo-600 selection:text-white">
      
      {/* Geometric Ambient Dot Background */}
      <div className="absolute inset-0 bg-grid-dots opacity-20 pointer-events-none z-0"></div>

      {/* Main Global Navigation */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-6 md:px-12 bg-black/40 backdrop-blur-md z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rotate-45 flex items-center justify-center">
            <div className="w-4 h-4 bg-[#0A0A0F] -rotate-45 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-white rounded-none"></div>
            </div>
          </div>
          <span className="font-display font-black tracking-[0.2em] text-sm md:text-base uppercase text-white">
            ARENA.CON
          </span>
          <span className="hidden md:inline-block text-[9px] uppercase font-semibold font-mono tracking-widest text-indigo-400 bg-indigo-950/40 px-2 py-0.5 border border-indigo-800/30">
            [ INSCRICOES_ABERTAS ]
          </span>
        </div>

        {/* Toggle Screen Actions */}
        <div className="flex gap-6 text-[11px] font-semibold tracking-widest uppercase font-mono">
          <button
            onClick={() => setActiveTab(AppTab.VISITOR_REGISTRATION)}
            className={`pb-1 transition-all border-b-2 cursor-pointer ${
              activeTab === AppTab.VISITOR_REGISTRATION
                ? "text-indigo-400 border-indigo-400"
                : "text-slate-500 hover:text-slate-300 border-transparent"
            }`}
            id="tab-visitor-btn"
          >
            Inscrição
          </button>
          
          <button
            onClick={() => setActiveTab(AppTab.ADMIN_PORTAL)}
            className={`pb-1 transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === AppTab.ADMIN_PORTAL
                ? "text-indigo-400 border-indigo-400"
                : "text-slate-500 hover:text-slate-300 border-transparent"
            }`}
            id="tab-admin-btn"
          >
            {adminToken ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Admin
              </span>
            ) : "Admin Area"}
          </button>
        </div>
      </nav>

      {/* Main Content Sections Wrapper */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
        
        {/* Left: Branding & Info Panel */}
        <div className="w-full md:w-[380px] lg:w-[420px] border-b md:border-b-0 md:border-r border-white/10 flex flex-col p-8 md:p-12 justify-center relative bg-black/20">
          <div className="absolute inset-0 bg-grid-dots opacity-40 pointer-events-none"></div>
          
          <div className="z-10 space-y-8">
            <div>
              <p className="text-indigo-500 font-mono text-xs mb-4 tracking-widest uppercase">[ ACCESS_GRANTED ]</p>
              <h1 className="text-4xl lg:text-5xl font-black leading-none uppercase italic text-white font-display">
                Entre na <br />
                <span className="text-transparent block mt-1" style={{ WebkitTextStroke: "1px white" }}>
                  Arena
                </span>
              </h1>
              <p className="text-slate-400 text-xs mt-4 leading-relaxed font-sans font-medium">
                Inscreva-se para garantir o seu passe de competidor no maior evento interescolar de games de 2026. Integração automatizada em tempo real.
              </p>
            </div>

            {/* Event Key Bullet Metadata */}
            <div className="space-y-6 border-l-2 border-indigo-600 pl-6">
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Data do Torneio</p>
                <p className="text-lg font-bold text-slate-200 font-display">15 e 16 de Agosto, 2026</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Premiação Total</p>
                <p className="text-lg font-bold text-indigo-400 font-display">R$ 5.000,00</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">Formato do Evento</p>
                <p className="text-lg font-bold text-slate-250 font-display">Online & Presencial</p>
              </div>
            </div>

            {/* Tech Logs indicator */}
            <div className="pt-4 border-t border-white/5 space-y-2">
              <span className="text-[9px] text-slate-650 font-mono block uppercase tracking-wider">
                [ ESTADO_DO_SISTEMA_INTEGRADO ]
              </span>
              <div className="flex flex-wrap gap-2">
                <span className="text-[9px] font-mono bg-slate-900 border border-white/5 px-2.5 py-1 text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-indigo-400" />
                  Supabase DB
                </span>
                <span className="text-[9px] font-mono bg-slate-900 border border-white/5 px-2.5 py-1 text-slate-400 flex items-center gap-1.5">
                  <Gamepad2 className="w-3 h-3 text-indigo-400" />
                  n8n Automate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Active Component View Interface */}
        <div className="flex-1 bg-[#0F0F17] p-6 md:p-12 overflow-y-auto flex flex-col justify-center min-h-[500px]">
          <div className="max-w-4xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {activeTab === AppTab.VISITOR_REGISTRATION ? (
                <motion.div
                  key="visitor-screen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <RegistrationForm onSuccess={handleRegistrationCompleted} />
                </motion.div>
              ) : (
                <motion.div
                  key="admin-screen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {adminToken ? (
                    <AdminPanel token={adminToken} onLogout={handleAdminLogout} />
                  ) : (
                    <AdminLogin 
                      onLoginSuccess={handleAdminLogin} 
                      onBackToVisitor={() => setActiveTab(AppTab.VISITOR_REGISTRATION)} 
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Global simple footer */}
      <footer className="h-12 border-t border-white/10 bg-black/40 flex items-center px-6 md:px-12 justify-between text-[10px] text-slate-500 font-mono tracking-wider z-10 shrink-0">
        <div className="flex gap-6">
          <span className="hidden sm:inline-block">SUPABASE_CONNECTED: TRUE</span>
          <span>N8N_RELAY: DISPATCH_ACTIVE</span>
        </div>
        <div>© 2026 ARENA.CON // SYSTEM V2.04</div>
      </footer>
    </div>
  );
}
