export interface Registration {
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

export interface ConfigStatus {
  supabaseConfigured: boolean;
  supabaseUrl: string | null;
  hasAdminPasswordSet: boolean;
}
