let hadiths=[],current=-1;
const state={saved:JSON.parse(localStorage.getItem("oh-saved")||"[]"),lang:localStorage.getItem("oh-lang")||"en"};
const $=id=>document.getElementById(id);

async function load(){
  try{
    const response=await fetch("./data/hadith.json",{cache:"no-store"});
    if(!response.ok) throw new Error("Hadith data HTTP "+response.status);
    const data=await response.json();
    if(!Array.isArray(data)||!data.length) throw new Error("Empty Hadith data");
    hadiths=data;
  }catch(error){
    hadiths=[{
      id:"bukhari-1",
      collection:"Sahih al-Bukhari",
      grade:"SAHIH",
      arabic:"إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى",
      english:"The reward of deeds depends upon the intentions and every person will get the reward according to what he has intended.",
      bangla:"কাজের ফল নিয়তের ওপর নির্ভরশীল। প্রত্যেক ব্যক্তি তার নিয়ত অনুযায়ী ফল লাভ করবে।",
      reference:"Sahih al-Bukhari 1 • Book 1, Hadith 1"
    }];
    console.warn("Hadith JSON could not be loaded; using built-in fallback.",error);
  }
  setLang(state.lang);
}

function render(){
  const h=hadiths[current];
  if(!h)return;
  $("collection").textContent=h.collection||"Hadith";
  $("grade").textContent=h.grade||"";
  $("arabic").textContent=h.arabic||"";
  $("english").textContent=h.english||"";
  $("bangla").textContent=h.bangla||"";
  $("reference").textContent=h.reference||"";
  const saved=state.saved.includes(h.id);
  $("save").textContent=saved?"♥":"♡";
  $("save").classList.toggle("saved",saved);
}

function randomHadith(){
  if(!hadiths.length)return;
  let n=Math.floor(Math.random()*hadiths.length);
  if(hadiths.length>1&&n===current)n=(n+1)%hadiths.length;
  current=n;
  render();
  $("reader").classList.add("show");
  $("reader").scrollIntoView({behavior:"smooth",block:"start"});
}

function setLang(l){
  state.lang=l;
  localStorage.setItem("oh-lang",l);
  document.querySelectorAll(".lang").forEach(x=>x.classList.toggle("active",x.dataset.lang===l));
  if(l==="bn"){
    $("title").innerHTML="কোথা থেকে শুরু করবেন ভাববেন না।<br><em>শুধু একটি পড়ুন।</em>";
    $("subtitle").textContent="কী খুঁজবেন তা ভাবার দরকার নেই। একটি নির্ভরযোগ্য হাদিস পড়ুন, ভাবুন, তারপর এগিয়ে যান।";
    $("randomText").textContent="একটি হাদিস পড়ুন";
    $("anotherText").textContent="আরেকটি হাদিস";
  }else{
    $("title").innerHTML="Don’t choose where to start.<br><em>Just read one.</em>";
    $("subtitle").textContent="No complicated search. No endless feed. Read one verified Hadith, reflect, then continue.";
    $("randomText").textContent="Read a Random Hadith";
    $("anotherText").textContent="Another Hadith";
  }
}

document.addEventListener("DOMContentLoaded",()=>{
  $("random").addEventListener("click",randomHadith);
  $("another").addEventListener("click",randomHadith);
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
      await navigator.clipboard.writeText([h.arabic,h.english,h.bangla,h.reference].filter(Boolean).join("\n\n"));
      $("copy").textContent="Copied ✓";
    }catch(e){
      $("copy").textContent="Copy failed";
    }
    setTimeout(()=>$("copy").textContent="Copy",1400);
  });
  if(localStorage.getItem("oh-theme")==="dark")document.body.classList.add("dark");
  load();
});