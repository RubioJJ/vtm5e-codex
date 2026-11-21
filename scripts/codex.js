const MODULE_ID = "vtm5e-codex";
const SETTING_KEY = "libraryData";
const SECTIONS = [
  {id:"disciplines",label:"Disciplinas",types:["power"]},
  {id:"rituals",label:"Rituais",types:["ritual"]},
  {id:"ceremonies",label:"Cerimônias",types:["ceremony"]},
  {id:"clans",label:"Clãs e Banes",types:["clan"]},
  {id:"advantages",label:"Vantagens",types:["advantage"]},
  {id:"disadvantages",label:"Desvantagens",types:["disadvantage"]},
  {id:"backgrounds",label:"Antecedentes",types:["background"]},
  {id:"predators",label:"Tipos de Predador",types:["predatorType"]}
];
const emptyLibrary = () => ({schemaVersion:2,entries:[]});
function library(){ return foundry.utils.deepClone(game.settings.get(MODULE_ID,SETTING_KEY) || emptyLibrary()); }
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function activeActor(){return canvas.tokens.controlled[0]?.actor ?? game.user.character ?? null;}
function sectionEntries(data,section){return data.entries.filter(e=>section.types.includes(e.type));}
function shell(data,active="disciplines"){
 const section=SECTIONS.find(s=>s.id===active)||SECTIONS[0];
 const entries=sectionEntries(data,section);
 return `<div class="vtm5e-shell">
 <header class="vc-top"><div class="vc-brand"><span class="vc-sigil">✧</span><div><small>VAMPIRE • THE MASQUERADE</small><h1>VTM5e Codex</h1><p>Biblioteca pessoal da Crônica</p></div></div><div class="vc-head-actions"><span class="vc-counter">${data.entries.length} registros</span><button type="button" class="vc-close" data-action="close">×</button></div></header>
 <section class="vc-status"><div><small>CONTEÚDO CADASTRADO</small><strong>${data.entries.length}</strong><span>entradas na biblioteca</span></div><div><small>SEÇÃO ATUAL</small><strong>${entries.length}</strong><span>${esc(section.label.toLowerCase())}</span></div><div><small>FORMATO</small><strong>JSON v2</strong><span>importação por categoria</span></div></section>
 <nav class="vc-tabs">${SECTIONS.map(s=>`<button type="button" class="${s.id===active?"active":""}" data-tab="${s.id}">${esc(s.label)}</button>`).join("")}</nav>
 <main class="vc-main"><section class="vc-panel">
 <div class="vc-panel-heading"><div><small>BIBLIOTECA • ${esc(section.label.toUpperCase())}</small><h2>${esc(section.label)}</h2><p>Pesquise, revise e organize o conteúdo da sua crônica.</p></div><label class="vc-import-button">＋ Importar JSON<input type="file" accept=".json,application/json" data-import-section="${section.id}" hidden></label></div>
 <div class="vc-toolbar"><input type="search" placeholder="Buscar por nome..." data-search><select data-filter-level><option value="">Todos os níveis</option>${[1,2,3,4,5].map(n=>`<option value="${n}">Nível ${n}</option>`).join("")}</select><span>${entries.length} registros</span></div>
 <div class="vc-entry-list">${entries.length?entries.map(e=>`<article class="vc-entry" data-name="${esc(e.name).toLowerCase()}" data-level="${e.level||""}"><div class="vc-entry-icon">${section.id==="clans"?"♜":section.id==="predators"?"♟":section.id==="advantages"?"✦":section.id==="disadvantages"?"✧":section.id==="rituals"?"⌁":section.id==="ceremonies"?"☽":"◆"}</div><div class="vc-entry-copy"><strong>${esc(e.name||"Sem nome")}</strong><span>${esc(e.discipline||e.category||section.label)} ${e.level? "• Nível "+e.level:""} ${e.page?"• p. "+e.page:""}</span><small>${e.description?esc(e.description).slice(0,150):"Descrição ainda não preenchida"}</small></div><button type="button" class="vc-edit" data-edit="${esc(e.id||e.name)}">Ver</button></article>`).join(""):`<div class="vc-empty"><div class="vc-empty-glyph">✧</div><h3>Esta seção ainda está vazia</h3><p>Importe o JSON correspondente para adicionar conteúdo à sua biblioteca.</p><label class="vc-import-button secondary">Selecionar arquivo<input type="file" accept=".json,application/json" data-import-section="${section.id}" hidden></label></div>`}</div>
 <footer class="vc-panel-footer"><span>VTM5e Codex • Conteúdo local do mundo</span><button type="button" data-action="export">Exportar biblioteca JSON</button></footer>
 </section></main><footer class="vc-bottom"><span>VAMPIRE</span><small>WORLD OF DARKNESS • V5</small></footer></div>`;
}
function render(active="disciplines"){
 const data=library();
 const content=shell(data,active);
 new Dialog({title:"VTM5e Codex",content,buttons:{close:{label:"Fechar"}},default:"close",render:html=>bind(html,active)}, {width:1120,height:820,resizable:true,classes:["wod5e","vtm5e-codex-window","vtm5e-codex-v2"]}).render(true);
}
function bind(html,active){
 const root=html[0]||html;
 root.querySelectorAll("[data-tab]").forEach(btn=>btn.addEventListener("click",()=>{root.closest(".app")?.querySelector(".window-content")?.replaceChildren();render(btn.dataset.tab);root.closest(".app")?.querySelector(".header-button.close")?.click();}));
 root.querySelectorAll("[data-import-section]").forEach(input=>input.addEventListener("change",async()=>{
  const file=input.files?.[0];if(!file)return;
  try{
   const parsed=JSON.parse(await file.text());
   const entries=Array.isArray(parsed.entries)?parsed.entries:Array.isArray(parsed.powers)?parsed.powers:null;
   if(!entries)throw new Error("JSON sem a lista 'entries' ou 'powers'.");
   const target=SECTIONS.find(s=>s.id===input.dataset.importSection);
   const valid=entries.filter(e=>target.types.includes(e.type)||(!e.type&&target.id==="disciplines"&&e.discipline));
   if(!valid.length)throw new Error("Nenhum registro compatível com a seção "+target.label+".");
   const data=library();const keys=new Set(data.entries.map(e=>(e.type||"power")+"|"+e.name));
   let added=0,updated=0;
   for(const entry of valid){const type=entry.type||(target.id==="disciplines"?"power":target.types[0]);const normalized={...entry,type};const key=type+"|"+normalized.name;const index=data.entries.findIndex(e=>(e.type||"power")+"|"+e.name===key);if(index>=0){data.entries[index]={...data.entries[index],...normalized};updated++;}else{data.entries.push(normalized);added++;}}
   await game.settings.set(MODULE_ID,SETTING_KEY,data);
   ui.notifications.info(`Importação concluída: ${added} novos, ${updated} atualizados.`);
   render(active);root.closest(".app")?.querySelector(".header-button.close")?.click();
  }catch(err){console.error(err);ui.notifications.error(err.message);}
 }));
 const search=root.querySelector("[data-search]");const level=root.querySelector("[data-filter-level]");
 const filter=()=>root.querySelectorAll(".vc-entry").forEach(row=>{row.hidden=!(row.dataset.name||"").includes((search.value||"").toLowerCase())||!!level.value&&row.dataset.level!==level.value;});
 search?.addEventListener("input",filter);level?.addEventListener("change",filter);
 root.querySelector("[data-action='export']")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(library(),null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="vtm5e-codex-library.json";a.click();URL.revokeObjectURL(url);});
 root.querySelector("[data-action='close']")?.addEventListener("click",()=>root.closest(".app")?.querySelector(".header-button.close")?.click());
 root.querySelectorAll("[data-edit]").forEach(btn=>btn.addEventListener("click",()=>{const entry=library().entries.find(e=>(e.id||e.name)===btn.dataset.edit);if(entry)new Dialog({title:entry.name,content:`<div class="vc-detail"><p><b>Tipo:</b> ${esc(entry.type)}</p><p><b>Descrição:</b> ${esc(entry.description||"Não preenchida")}</p><p><b>Cost:</b> ${esc(entry.cost||"—")}</p><p><b>Dice Pools:</b> ${esc(entry.dicePools||"—")}</p><p><b>System:</b> ${esc(entry.system||"—")}</p><p><b>Duration:</b> ${esc(entry.duration||"—")}</p></div>`,buttons:{close:{label:"Fechar"}}}).render(true);}));
}
export async function openCodex(){if(!game.settings.settings.has(`${MODULE_ID}.${SETTING_KEY}`))game.settings.register(MODULE_ID,SETTING_KEY,{scope:"world",config:false,type:Object,default:emptyLibrary()});render();}
export async function installCodexContent(){ui.notifications.info("A biblioteca personalizada já está ativa. A criação de itens arrastáveis para fichas será habilitada após validar o mapeamento dos campos do sistema.");return {total:library().entries.length};}
