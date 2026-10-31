import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

export const supabase = createClient(
  "https://zfeajjrvjuzujzcrobnx.supabase.co",
  "sb_publishable_rfcWS-lNsv7vB_rE-Z3yMA_bYXKcAET",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export async function ensureProfile(user, displayName = "") {
  if (!user) return { error: new Error("Not authenticated") };

  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id, display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (readError) return { error: readError };

  if (!existing) {
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        display_name: displayName || (user.email || "").split("@")[0]
      })
      .select("id, display_name, role")
      .single();

    return { data, error };
  }

  return { data: existing, error: null };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}

export async function initAuthUI() {
  const link = document.getElementById("authLink");
  if (!link) return;

  const { user } = await getCurrentUser();

  if (user) {
    link.textContent = "Account";
    link.href = "./profile.html";
  } else {
    link.textContent = "Login";
    link.href = "./login.html";
  }
}
