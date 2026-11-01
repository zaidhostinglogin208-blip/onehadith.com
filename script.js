import { supabase, initAuthUI } from "./auth.js";
let hadiths=[],current=-1;
const state={saved:JSON.parse(localStorage.getItem("oh-saved")||"[]"),lang:localStorage.getItem("oh-lang")||"en",seen:[]};
const $=id=>document.getElementById(id);

async function load(){
  try{
    const r=await fetch("./data/hadith.json",{cache:"no-store"});
    if(!r.ok)throw new Error("HTTP "+r.status);
    hadiths=await r.json();
    if(!Array.isArray(hadiths)||!hadiths.length)throw new Error("Empty data");
    current=-1;
  }catch(e){
    console.error("Hadith data could not be loaded.",e);
    hadiths=[];
  }
  setLang(state.lang);
  if(new URLSearchParams(location.search).get("start")==="1"){
    history.replaceState({}, "", location.pathname);
    randomHadith();
  }
}

function randomHadith(){
  if(!hadiths.length)return;
  let available=hadiths.map((_,i)=>i).filter(i=>!state.seen.includes(hadiths[i].id));
  if(!available.length){state.seen=[];available=hadiths.map((_,i)=>i);}
  let n=available[Math.floor(Math.random()*available.length)];
  if(hadiths.length>1&&n===current){
    const alternatives=available.filter(i=>i!==current);
    if(alternatives.length)n=alternatives[Math.floor(Math.random()*alternatives.length)];
  }
  current=n;
  state.seen.push(hadiths[current].id);
  render();
  $("reader").classList.add("show");
  $("reader").scrollIntoView({behavior:"smooth",block:"start"});
}

function render(){
  const h=hadiths[current];if(!h)return;
  ["collection","grade","book","chapter","narrator","arabic","english","bangla","understanding","realLifeExample","practicalLesson"].forEach(k=>$(k).textContent=h[k]||"");
  $("reference").textContent=(h.collection||"")+" "+(h.hadithNumber||"")+" • "+(h.inBookReference||"");
  $("usc").textContent=h.uscMsaReference||"";
  $("related").textContent=h.relatedReferences||"";
  $("source").textContent=h.source||"";
  $("sourceLink").href=h.sourceUrl||"#";
  const saved=state.saved.includes(h.id);
  $("save").textContent=saved?"♥":"♡";
  $("save").classList.toggle("saved",saved);
}

function setLang(l){
  state.lang=l;localStorage.setItem("oh-lang",l);
  document.querySelectorAll(".lang").forEach(x=>x.classList.toggle("active",x.dataset.lang===l));
  if(l==="bn"){
    $("title").innerHTML="কোথা থেকে শুরু করবেন ভাববেন না।<br><em>শুধু একটি পড়ুন।</em>";
    $("subtitle").textContent="কী খুঁজবেন তা ভাবার দরকার নেই। একটি নির্ভরযোগ্য হাদিস পড়ুন, বুঝুন, ভাবুন, তারপর এগিয়ে যান।";
    $("randomText").textContent="একটি হাদিস পড়ুন";
    $("anotherText").textContent="আরেকটি হাদিস";
  }else{
    $("title").innerHTML="Don’t choose where to start.<br><em>Just read one.</em>";
    $("subtitle").textContent="No complicated search. No endless feed. Read one verified Hadith, understand it, reflect, then continue.";
    $("randomText").textContent="Read a Random Hadith";
    $("anotherText").textContent="Another Hadith";
  }
}

document.addEventListener("DOMContentLoaded",async()=>{
  await initAuthUI();
  $("random").addEventListener("click",()=>randomHadith(false));
  $("another").addEventListener("click",()=>randomHadith(false));
  document.querySelectorAll(".lang").forEach(x=>x.addEventListener("click",()=>setLang(x.dataset.lang)));
  $("theme").addEventListener("click",()=>{
    document.body.classList.toggle("dark");
    localStorage.setItem("oh-theme",document.body.classList.contains("dark")?"dark":"light");
  });
  $("save").addEventListener("click",()=>{
    if(current<0)return;
    const id=hadiths[current].id;
    state.saved=state.saved.includes(id)?state.saved.filter(x=>x!==id):[...state.saved,id];
    localStorage.setItem("oh-saved",JSON.stringify(state.saved));
    render();
  });
  $("copy").addEventListener("click",async()=>{
    if(current<0)return;
    const h=hadiths[current];
    try{
      await navigator.clipboard.writeText([h.arabic,h.english,h.bangla,"Reference: "+h.collection+" "+h.hadithNumber+" • "+h.inBookReference,"Source: "+h.sourceUrl].filter(Boolean).join("\n\n"));
      $("copy").textContent="Copied ✓";
    }catch(e){$("copy").textContent="Copy failed";}
    setTimeout(()=>$("copy").textContent="Copy",1400);
  });
  if(localStorage.getItem("oh-theme")==="dark")document.body.classList.add("dark");
  load();
});