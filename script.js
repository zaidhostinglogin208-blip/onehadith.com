let hadiths=[],current=-1;
const state={saved:JSON.parse(localStorage.getItem("oh-saved")||"[]"),lang:localStorage.getItem("oh-lang")||"en"),seen:[]};
const $=id=>document.getElementById(id);

async function load(){
  setLang(state.lang);
  await randomHadith(true);
}

async function fetchRandomHadith(){
  const res=await fetch("https://ummahapi.com/api/hadith/random",{cache:"no-store"});
  if(!res.ok)throw new Error("API HTTP "+res.status);
  const random=await res.json();
  const d=random.data;
  if(!d)throw new Error("Invalid API response");

  let full=d;
  try{
    const detail=await fetch("https://ummahapi.com/api/hadith/"+encodeURIComponent(d.collection)+"/"+encodeURIComponent(d.hadithnumber),{cache:"no-store"});
    if(detail.ok){
      const detailJson=await detail.json();
      if(detailJson&&detailJson.data)full={...d,...detailJson.data};
    }
  }catch(e){console.warn("Detailed Hadith metadata unavailable.",e);}

  return {
    id:full.id||d.id,
    collection:full.collection_name||full.collection||"",
    book:full.book||"",
    chapter:full.chapter||"",
    narrator:full.narrator||"",
    grade:full.grade||"",
    arabic:full.arabic||"",
    english:full.english||"",
    bangla:full.bangla||"",
    hadithNumber:full.hadithnumber||d.hadithnumber||"",
    inBookReference:full.in_book_reference||("Hadith "+(full.hadithnumber||d.hadithnumber||"")),
    uscMsaReference:full.usc_msa_reference||"",
    relatedReferences:full.related_references||"",
    source:"UmmahAPI",
    sourceUrl:"https://ummahapi.com/hadith-api",
    understanding:"",
    realLifeExample:"",
    practicalLesson:""
  };
}

async function randomHadith(initial=false){
  try{
    const h=await fetchRandomHadith();
    if(state.seen.length>0&&state.seen.includes(h.id)&&!initial){
      for(let i=0;i<4&&state.seen.includes(h.id);i++)h=await fetchRandomHadith();
    }
    state.seen.push(h.id);
    if(state.seen.length>50)state.seen.shift();
    hadiths=[h];
    current=0;
    render();
    $("reader").classList.add("show");
    if(!initial)$("reader").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){
    console.error("Hadith API could not be loaded.",e);
    if(!hadiths.length)loadLocalFallback(initial);
  }
}

async function loadLocalFallback(initial){
  try{
    const r=await fetch("./data/hadith.json",{cache:"no-store"});
    if(!r.ok)throw new Error("Fallback HTTP "+r.status);
    const data=await r.json();
    if(!Array.isArray(data)||!data.length)throw new Error("Empty fallback");
    hadiths=data;
    current=Math.floor(Math.random()*hadiths.length);
    render();
    $("reader").classList.add("show");
    if(!initial)$("reader").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){console.error("Hadith fallback could not be loaded.",e);}
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

document.addEventListener("DOMContentLoaded",()=>{
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