import { createClient } from "https://esm.sh/@supabase/supabase-js@2.118.0";

export const supabase = createClient(
  "https://zfeajjrvjuzujzcrobnx.supabase.co",
  "sb_publishable_rfcWS-lNsv7vB_rE-Z3yMA_bYXKcAET",
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);

export async function ensureProfile(user, displayName = "") {
  if (!user) return { error: new Error("Not authenticated") };
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id, display_name, first_name, last_name, preferred_length, role")
    .eq("id", user.id).maybeSingle();
  if (readError) return { error: readError };
  if (!existing) {
    const metadataName = displayName || user.user_metadata?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || (user.email || "").split("@")[0];
    const parts = metadataName.trim().split(/\s+/);
    const { data, error } = await supabase.from("profiles").insert({
      id: user.id, display_name: metadataName,
      first_name: parts.shift() || "", last_name: parts.join(" ")
    }).select("id, display_name, first_name, last_name, preferred_length, role").single();
    return { data, error };
  }
  return { data: existing, error: null };
}

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  return { user: data?.user || null, error };
}

export async function initAuthUI() {
  const host = document.getElementById("accountNav");
  const { user } = await getCurrentUser();
  if (!host) return user;
  if (!user) {
    host.innerHTML = '<a class="nav-link" href="./login.html">Login</a>';
    return null;
  }
  host.innerHTML = `
    <div class="account-menu">
      <button class="hamburger-btn" id="menuToggle" type="button" aria-label="Open account menu" aria-expanded="false"><span></span><span></span><span></span></button>
      <div class="account-dropdown" id="accountDropdown" hidden>
        <a href="./profile.html#profile">Profile</a>
        <a href="./profile.html#favorites">Favorite List</a>
        <a href="./profile.html#read-later">Read Later</a>
        <div class="menu-filter"><label for="menuLengthFilter">Hadith length</label><select id="menuLengthFilter"><option value="all">All</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></div>
        <a href="./profile.html#settings">Settings</a>
        <button id="menuLogout" type="button">Logout</button>
      </div>
    </div>`;
  const toggle = document.getElementById("menuToggle");
  const dropdown = document.getElementById("accountDropdown");
  toggle.addEventListener("click", () => {
    const open = dropdown.hidden;
    dropdown.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("click", e => {
    if (!host.contains(e.target)) { dropdown.hidden = true; toggle.setAttribute("aria-expanded","false"); }
  });
  document.getElementById("menuLogout").addEventListener("click", async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) location.href = "./";
  });
  return user;
}
