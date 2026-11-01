import { supabase, initAuthUI } from "./auth.js";
let hadiths=[],current=-1;
const state={lang:localStorage.getItem("oh-lang")||"en",seen:[],user:null,favorites:[],readLater:[],length:"all"};
const $=id=>document.getElementById(id);
const wordCount=h=>(h.english||"").trim().split(/\s+/).filter(Boolean).length;
function matchesLength(h){
  const n=wordCount(h);
  return state.length==="small"?n<40:state.length==="medium"?n>=40&&n<=80:state.length==="large"?n>80:true;
}
async function load(){
  try{
    const r=await fetch("./data/hadith.json",{cache:"no-store"});
    if(!r.ok)throw new Error("HTTP "+r.status);
    hadiths=await r.json();
    if(!Array.isArray(hadiths)||!hadiths.length)throw new Error("Empty data");
  }catch(e){console.error("Hadith data could not be loaded.",e);hadiths=[];}
  if(state.user){
    $("memberActions").hidden=false;
    const {data:profile}=await supabase.from("profiles").select("preferred_length").eq("id",state.user.id).maybeSingle();
    state.length=profile?.preferred_length||"all";
    const {data:saves,error}=await supabase.from("user_hadith_saves").select("hadith_id,list_type").eq("user_id",state.user.id);
    if(!error&&saves){
      state.favorites=saves.filter(x=>x.list_type==="favorite").map(x=>x.hadith_id);
      state.readLater=saves.filter(x=>x.list_type==="read_later").map(x=>x.hadith_id);
    }
    $("lengthFilterBar").hidden=false;
    $("lengthFilter").value=state.length;
  }
  setLang(state.lang);
  const params=new URLSearchParams(location.search);
  const readId=params.get("read");
  if(readId){
    history.replaceState({}, "", location.pathname);
    const idx=hadiths.findIndex(h=>h.id===readId);
    if(idx>=0)showHadith(idx);
    else randomHadith();
  }else if(params.get("start")==="1"){
    history.replaceState({}, "", location.pathname);
    randomHadith();
  }
}
function filteredIndices(){return hadiths.map((h,i)=>matchesLength(h)?i:-1).filter(i=>i>=0);}
function randomHadith(){
  const pool=filteredIndices();
  if(!pool.length){$("randomText").textContent="No Hadith in this length yet";return;}
  let available=pool.filter(i=>!state.seen.includes(hadiths[i].id));
  if(!available.length){state.seen=[];available=pool;}
  let n=available[Math.floor(Math.random()*available.length)];
  if(available.length>1&&n===current){const alt=available.filter(i=>i!==current);if(alt.length)n=alt[Math.floor(Math.random()*alt.length)];}
  showHadith(n);
}
function showHadith(index){
  current=index;state.seen.push(hadiths[current].id);render();
  $("reader").classList.add("show");
  $("reader").scrollIntoView({behavior:"smooth",block:"start"});
}
function render(){
  const h=hadiths[current];if(!h)return;
  ["collection","grade","book","chapter","narrator","arabic","english","bangla","understanding","realLifeExample","practicalLesson"].forEach(k=>$(k).textContent=h[k]||"");
  $("reference").textContent=(h.collection||"")+" "+(h.hadithNumber||"")+" • "+(h.inBookReference||"");
  $("usc").textContent=h.uscMsaReference||"";$("related").textContent=h.relatedReferences||"";
  $("source").textContent=h.source||"";$("sourceLink").href=h.sourceUrl||"#";
  const fav=state.favorites.includes(h.id);
  $("save").textContent=fav?"♥":"♡";$("save").classList.toggle("saved",fav);
  const later=state.readLater.includes(h.id);
  $("readLater").textContent=later?"✓ Saved for later":"＋ Read Later";
  $("readLater").classList.toggle("saved",later);
}
async function toggleList(type){
  if(current<0)return;
  if(!state.user){location.href="./login.html";return;}
  const id=hadiths[current].id;
  const list=type==="favorite"?state.favorites:state.readLater;
  const exists=list.includes(id);
  let result;
  if(exists){
    result=await supabase.from("user_hadith_saves").delete().eq("user_id",state.user.id).eq("hadith_id",id).eq("list_type",type);
  }else{
    result=await supabase.from("user_hadith_saves").insert({user_id:state.user.id,hadith_id:id,list_type:type});
  }
  if(result.error){console.error(result.error);return;}
  const next=exists?list.filter(x=>x!==id):[...list,id];
  if(type==="favorite")state.favorites=next;else state.readLater=next;
  render();
}
async function changeLength(value){
  state.length=value;state.seen=[];
  if(state.user){
    const {error}=await supabase.from("profiles").update({preferred_length:value}).eq("id",state.user.id);
    if(error)console.error("Could not save reading filter",error);
  }
  if(current>=0&&!matchesLength(hadiths[current])){$("reader").classList.remove("show");current=-1;}
}
function setLang(l){
  state.lang=l;localStorage.setItem("oh-lang",l);
  document.querySelectorAll(".lang").forEach(x=>x.classList.toggle("active",x.dataset.lang===l));
  if(l==="bn"){
    $("title").innerHTML="কোথা থেকে শুরু করবেন ভাববেন না।<br><em>শুধু একটি পড়ুন।</em>";
    $("subtitle").textContent="কী খুঁজবেন তা ভাবার দরকার নেই। একটি নির্ভরযোগ্য হাদিস পড়ুন, বুঝুন, ভাবুন, তারপর এগিয়ে যান।";
    $("randomText").textContent="একটি হাদিস পড়ুন";$("anotherText").textContent="আরেকটি হাদিস";
  }else{
    $("title").innerHTML="Don’t choose where to start.<br><em>Just read one.</em>";
    $("subtitle").textContent="No complicated search. No endless feed. Read one verified Hadith, understand it, reflect, then continue.";
    $("randomText").textContent="Read a Random Hadith";$("anotherText").textContent="Another Hadith";
  }
}
document.addEventListener("DOMContentLoaded",async()=>{
  state.user=await initAuthUI();
  $("random").addEventListener("click",randomHadith);
  $("another").addEventListener("click",randomHadith);
  $("save").addEventListener("click",()=>toggleList("favorite"));
  $("readLater").addEventListener("click",()=>toggleList("read_later"));
  $("lengthFilter").addEventListener("change",e=>changeLength(e.target.value));
  document.querySelectorAll(".lang").forEach(x=>x.addEventListener("click",()=>setLang(x.dataset.lang)));
  $("theme").addEventListener("click",()=>{
    document.body.classList.toggle("dark");
    localStorage.setItem("oh-theme",document.body.classList.contains("dark")?"dark":"light");
  });
  $("copy").addEventListener("click",async()=>{
    if(current<0)return;const h=hadiths[current];
    try{await navigator.clipboard.writeText([h.arabic,h.english,h.bangla,"Reference: "+h.collection+" "+h.hadithNumber+" • "+h.inBookReference,"Source: "+h.sourceUrl].filter(Boolean).join("\n\n"));$("copy").textContent="Copied ✓";}
    catch(e){$("copy").textContent="Copy failed";}
    setTimeout(()=>$("copy").textContent="Copy",1400);
  });
  if(localStorage.getItem("oh-theme")==="dark")document.body.classList.add("dark");
  await load();
});
