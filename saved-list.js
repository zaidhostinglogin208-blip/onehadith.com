import { supabase, initAuthUI } from "./auth.js";

const user = await supabase.auth.getUser().then(({data}) => data.user);
if (!user) {
  location.href = "./login.html";
  throw new Error("Not authenticated");
}
await initAuthUI();

const type = document.body.dataset.listType;
const container = document.getElementById("savedList");
const heading = type === "favorite" ? "Favorite List" : "Read Later";
const emptyText = type === "favorite" ? "No favorite Hadith yet." : "Your Read Later list is empty.";
document.getElementById("listTitle").textContent = heading;
document.getElementById("listDescription").textContent = type === "favorite"
  ? "Hadith you have marked as favorite."
  : "Your saved reading queue. Items stay here until you manually remove them.";

function showError(message) {
  container.replaceChildren();
  const p = document.createElement("p");
  p.className = "empty-list";
  p.textContent = message;
  container.append(p);
}
function addListItem(hadith, saved) {
  const card = document.createElement("article");
  card.className = "saved-item";
  const details = document.createElement("div");
  details.className = "saved-item-copy";
  const title = document.createElement("strong");
  title.textContent = (hadith.collection || "Hadith") + " · " + (hadith.hadithNumber || "");
  const snippet = document.createElement("p");
  snippet.textContent = (hadith.english || "").slice(0,155) + ((hadith.english || "").length > 155 ? "…" : "");
  const ref = document.createElement("small");
  ref.textContent = hadith.inBookReference || hadith.source || "";
  details.append(title,snippet,ref);
  const actions = document.createElement("div");
  actions.className = "saved-item-actions";
  const read = document.createElement("a");
  read.className = "saved-read";
  read.href = "./?read=" + encodeURIComponent(hadith.id);
  read.textContent = "Read";
  const remove = document.createElement("button");
  remove.type = "button";
  remove.className = "saved-remove";
  remove.textContent = "Remove";
  remove.addEventListener("click", async () => {
    remove.disabled = true;
    const {error} = await supabase.from("user_hadith_saves").delete()
      .eq("user_id",user.id).eq("hadith_id",hadith.id).eq("list_type",type);
    if (error) {
      remove.disabled = false;
      showError("Could not remove item: " + error.message);
      return;
    }
    card.remove();
    if (!container.querySelector(".saved-item")) {
      const empty = document.createElement("p");
      empty.className = "empty-list";
      empty.textContent = emptyText;
      container.append(empty);
    }
  });
  actions.append(read,remove);
  card.append(details,actions);
  container.append(card);
}

try {
  const [savedResult, hadithResult] = await Promise.all([
    supabase.from("user_hadith_saves").select("hadith_id,list_type,created_at")
      .eq("user_id",user.id).eq("list_type",type).order("created_at",{ascending:false}),
    fetch("./data/hadith.json",{cache:"no-store"}).then(r => {
      if (!r.ok) throw new Error("Hadith data could not be loaded.");
      return r.json();
    })
  ]);
  if (savedResult.error) throw savedResult.error;
  const hadiths = hadithResult;
  const rows = savedResult.data || [];
  container.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "empty-list";
    empty.textContent = emptyText;
    container.append(empty);
  } else {
    rows.forEach(row => {
      const hadith = hadiths.find(item => item.id === row.hadith_id);
      if (hadith) addListItem(hadith,row);
    });
    if (!container.querySelector(".saved-item")) {
      const empty = document.createElement("p");
      empty.className = "empty-list";
      empty.textContent = emptyText;
      container.append(empty);
    }
  }
} catch (error) {
  showError("Could not load your saved Hadith: " + error.message);
}
