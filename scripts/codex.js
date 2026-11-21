const MODULE_ID="vtm5e-codex",SETTING_KEY="libraryData";
const SECTIONS=[
{id:"disciplines",label:"Disciplinas",types:["power"]},
{id:"rituals",label:"Rituais",types:["ritual"]},
{id:"ceremonies",label:"Cerimônias",types:["ceremony"]},
{id:"elders",label:"Poderes de Anciões",types:["elder"] ,gmOnly:true},
{id:"methuselah",label:"Poderes de Matusalém",types:["methuselah"],gmOnly:true},
{id:"clans",label:"Clãs e Banes",types:["clan"]},
{id:"advantages",label:"Vantagens",types:["advantage"]},
{id:"disadvantages",label:"Desvantagens",types:["disadvantage"]},
{id:"backgrounds",label:"Antecedentes",types:["background"]},
{id:"predators",label:"Tipos de Predador",types:["predatorType"]}
];
let codexApp=null;
const emptyLibrary=()=>({schemaVersion:2,entries:[]});
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function library(){return foundry.utils.deepClone(game.settings.get(MODULE_ID,SETTING_KEY)||emptyLibrary());}
function canSee(s){return !s.gmOnly||game.user.isGM||game.settings.get(MODULE_ID,"playersSeeElderPowers");}
function visibleSections(){return SECTIONS.filter(canSee);}
function sectionEntries(data,s){return data.entries.filter(e=>s.types.includes(e.type));}
function shell(data,active){
 const sections=visibleSections();const s=sections.find(x=>x.id===active)||sections[0];const entries=sectionEntries(data,s);
 return `<div class="vtm5e-shell">
 <header class="vc-top"><div class="vc-brand"><span class="vc-sigil">✧</span><div><small>VAMPIRE • THE MASQUERADE</small><h1>VTM5e Codex</h1><p>Biblioteca pessoal da Crônica</p></div></div><div class="vc-head-actions"><span class="vc-counter">${data.entries.length} registros</span><button type="button" class="vc-close" data-action="close">×</button></div></header>
 <section class="vc-status"><div><small>CONTEÚDO CADASTRADO</small><strong>${data.entries.length}</strong><span>entradas na biblioteca</span></div><div><small>SEÇÃO ATUAL</small><strong>${entries.length}</strong><span>${esc(s.label.toLowerCase())}</span></div><div><small>ACESSO</small><strong>${game.user.isGM?"Mestre":game.settings.get(MODULE_ID,"playersSeeElderPowers")?"Compartilhado":"Jogador"}</strong><span>permissões do módulo</span></div></section>
 <nav class="vc-tabs">${sections.map(x=>`<button type="button" class="${x.id===s.id?"active":""}" data-tab="${x.id}">${esc(x.label)}</button>`).join("")}</nav>
 <main class="vc-main"><section class="vc-panel"><div class="vc-panel-heading"><div><small>BIBLIOTECA • ${esc(s.label.toUpperCase())}</small><h2>${esc(s.label)}</h2><p>Pesquise, revise e organize o conteúdo da sua crônica.</p></div><label class="vc-import-button">＋ Importar JSON<input type="file" accept=".json,application/json" data-import-section="${s.id}" hidden></label></div>
 <div class="vc-toolbar"><input type="search" placeholder="Buscar por nome..." data-search>${s.id==="disciplines"?`<select data-filter-discipline><option value="">Todas as Disciplinas</option>${[...new Set(entries.map(e=>e.discipline).filter(Boolean))].sort((a,b)=>a.localeCompare(b)).map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("")}</select>`:""}<select data-filter-level><option value="">Todos os níveis</option>${[1,2,3,4,5].map(n=>`<option value="${n}">Nível ${n}</option>`).join("")}</select><span>${entries.length} registros</span></div>
 <div class="vc-entry-list">${entries.length?entries.map(e=>`<article class="vc-entry" data-name="${esc(e.name).toLowerCase()}" data-level="${e.level||""}" data-discipline="${esc(e.discipline||"")}"><div class="vc-entry-icon">◆</div><div class="vc-entry-copy"><strong>${esc(e.name||"Sem nome")}</strong><span>${esc(e.discipline||e.category||s.label)} ${e.level?"• Nível "+e.level:""} ${e.page?"• p. "+e.page:""}</span><small>${e.description?esc(e.description).slice(0,150):"Descrição ainda não preenchida"}</small></div><div class="vc-entry-actions"><button type="button" class="vc-edit" data-edit="${esc(e.id||e.name)}">Ver</button><button type="button" class="vc-sheet-add" data-add-sheet="${esc(e.id||e.name)}">Adicionar à ficha</button></div></article>`).join(""):`<div class="vc-empty"><div class="vc-empty-glyph">✧</div><h3>Esta seção ainda está vazia</h3><p>Importe o JSON correspondente para adicionar conteúdo à sua biblioteca.</p><label class="vc-import-button secondary">Selecionar arquivo<input type="file" accept=".json,application/json" data-import-section="${s.id}" hidden></label></div>`}</div>
 <footer class="vc-panel-footer"><span>VTM5e Codex • Conteúdo local do mundo</span><button type="button" data-action="export">Exportar biblioteca JSON</button></footer></section></main><footer class="vc-bottom"><span>VAMPIRE</span><small>WORLD OF DARKNESS • V5</small></footer></div>`;
}

function entryToItemSource(e){
 const blocks=[
  ["Descrição",e.description],["Custo",e.cost],["Parada de Dados",e.dicePools],
  ["Sistema",e.system],["Duração",e.duration],["Pré-requisitos",e.prerequisites],["Amálgama",e.amalgam]
 ].filter(([,v])=>v).map(([label,value])=>`<h3>${esc(label)}</h3><p>${esc(value).replace(/\\n/g,"<br>")}</p>`).join("");
 const disciplineKey=({Animalism:"animalism",Auspex:"auspex","Blood Sorcery":"sorcery",Celerity:"celerity",Dominate:"dominate",Fortitude:"fortitude",Obfuscate:"obfuscate",Oblivion:"oblivion",Potence:"potence",Presence:"presence",Protean:"protean"})[e.discipline]||String(e.discipline||"").toLowerCase();
 return {name:e.name,type:"power",img:"icons/magic/perception/eye-ringed-glow-angry-large-red.webp",system:{level:Number(e.level)||1,cost:0,discipline:disciplineKey,selected:false,dicepool:{},description:blocks,macroid:""},flags:{[MODULE_ID]:{imported:true,sourceEntry:e}}};
}

function closeCurrent(){if(codexApp){const old=codexApp;codexApp=null;old.close();}}
function render(active="disciplines"){
 const data=library(),content=shell(data,active);
 if(codexApp){codexApp.data.content=content;codexApp.render(true);return;}
 codexApp=new Dialog({title:"VTM5e Codex",content,buttons:{close:{label:"Fechar"}},default:"close",render:html=>bind(html,active),close:()=>{codexApp=null;}},{width:1120,height:820,resizable:true,classes:["wod5e","vtm5e-codex-window","vtm5e-codex-v2"]});
 codexApp.render(true);
}
function bind(html,active){
 const root=html[0]||html;
 root.querySelectorAll("[data-tab]").forEach(b=>b.addEventListener("click",()=>render(b.dataset.tab)));
 root.querySelectorAll("[data-import-section]").forEach(input=>input.addEventListener("change",async()=>{
  const file=input.files?.[0];if(!file)return;
  try{
   const parsed=JSON.parse(await file.text());
   const entries=Array.isArray(parsed.entries)?parsed.entries:Array.isArray(parsed.powers)?parsed.powers:null;
   if(!entries)throw new Error("JSON sem a lista 'entries' ou 'powers'.");
   const target=SECTIONS.find(x=>x.id===input.dataset.importSection);
   const accepted=entries.filter(e=>target.types.includes(e.type)||(!e.type&&target.id==="disciplines"&&e.discipline));
   if(!accepted.length)throw new Error("Nenhum registro compatível com "+target.label+". Confira o campo type no JSON.");
   const data=library();let added=0,updated=0;
   for(const e of accepted){const type=e.type||(target.id==="disciplines"?"power":target.types[0]);const item={...e,type};const idx=data.entries.findIndex(x=>(x.type||"power")+"|"+x.name===type+"|"+item.name);if(idx>=0){data.entries[idx]={...data.entries[idx],...item};updated++;}else{data.entries.push(item);added++;}}
   await game.settings.set(MODULE_ID,SETTING_KEY,data);
   ui.notifications.info(`Importação concluída: ${added} novos, ${updated} atualizados.`);render(active);
  }catch(err){console.error(err);ui.notifications.error(err.message);}
 }));
 const search=root.querySelector("[data-search]"),level=root.querySelector("[data-filter-level]"),discipline=root.querySelector("[data-filter-discipline]");
 const filter=()=>root.querySelectorAll(".vc-entry").forEach(row=>{const nameMatch=(row.dataset.name||"").includes((search?.value||"").toLowerCase());const levelMatch=!level?.value||row.dataset.level===level.value;const disciplineMatch=!discipline?.value||row.dataset.discipline===discipline.value;row.hidden=!(nameMatch&&levelMatch&&disciplineMatch);});
 search?.addEventListener("input",filter);level?.addEventListener("change",filter);discipline?.addEventListener("change",filter);
 root.querySelector("[data-action=export]")?.addEventListener("click",()=>{const blob=new Blob([JSON.stringify(library(),null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="vtm5e-codex-library.json";a.click();URL.revokeObjectURL(url);});
 root.querySelector("[data-action=close]")?.addEventListener("click",()=>closeCurrent());

 root.querySelectorAll("[data-add-sheet]").forEach(b=>b.addEventListener("click",async()=>{
  const entry=library().entries.find(x=>(x.id||x.name)===b.dataset.addSheet);
  if(!entry)return;
  const actor=canvas.tokens.controlled[0]?.actor;
  if(!actor){ui.notifications.warn("Selecione um token para adicionar o poder à ficha.");return;}
  if(game.system.id!=="wod5e"){ui.notifications.error("A importação para ficha requer o sistema World of Darkness 5e.");return;}
  const disciplineKey=({Animalism:"animalism",Auspex:"auspex","Blood Sorcery":"sorcery",Celerity:"celerity",Dominate:"dominate",Fortitude:"fortitude",Obfuscate:"obfuscate",Oblivion:"oblivion",Potence:"potence",Presence:"presence",Protean:"protean"})[entry.discipline]||entry.discipline?.toLowerCase().replace(/\\s+/g,"");
  const section=(label,value)=>value?'<h3>'+esc(label)+'</h3><p>'+esc(value).replace(/\\n/g,"<br>")+'</p>':"";
  const description=[
   section("Descrição",entry.description||entry.description_pt),
   section("Custo",entry.cost||entry.cost_pt),
   section("Parada de Dados",entry.dicePools||entry.dice_pools_pt),
   section("Regras / Sistema",entry.system||entry.system_pt),
   section("Duração",entry.duration||entry.duration_pt),
   section("Pré-requisitos",entry.prerequisites||entry.prerequisites_pt),
   section("Amálgama",entry.amalgam||entry.amalgam_pt)
  ].join("");
  const source={name:entry.name,type:"power",img:"icons/magic/perception/eye-ringed-glow-angry-large-red.webp",system:{level:Number(entry.level||0),cost:0,discipline:disciplineKey,selected:false,dicepool:{},description,macroid:""},flags:{[MODULE_ID]:{imported:true,entryId:entry.id,discipline:entry.discipline,source:entry.source||"",macro:entry.macro||{}}}};
  try{
   const existing=actor.items.find(i=>i.type==="power"&&i.name===entry.name);
   if(existing){await existing.update(source);ui.notifications.info(entry.name+" atualizado na ficha de "+actor.name+".");}
   else{await actor.createEmbeddedDocuments("Item",[source]);ui.notifications.info(entry.name+" adicionado à ficha de "+actor.name+".");}
  }catch(error){console.error("VTM5e Codex | Falha ao adicionar poder à ficha",error);ui.notifications.error("Não foi possível adicionar à ficha: "+error.message);}
 }));

 root.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>{
  const e=library().entries.find(x=>(x.id||x.name)===b.dataset.edit);if(!e)return;
  const detail=field=>esc(e[field]||"—").replace(/\\n/g,"<br>");
  const content=`<div class="vc-detail">
   <p><b>Descrição</b><br>${detail("description")}</p>
   <p><b>Custo</b><br>${detail("cost")}</p>
   <p><b>Parada de Dados</b><br>${detail("dicePools")}</p>
   <p><b>Sistema</b><br>${detail("system")}</p>
   <p><b>Duração</b><br>${detail("duration")}</p>
   <p><b>Pré-requisitos</b><br>${detail("prerequisites")}</p>
   <p><b>Amálgama</b><br>${detail("amalgam")}</p>
   <button type="button" class="vc-add-to-sheet"><i class="fas fa-user-plus"></i> Adicionar à ficha selecionada</button>
   <small>Selecione um token antes de adicionar o poder à ficha.</small>
  </div>`;
  const dlg=new Dialog({title:e.name,content,buttons:{close:{label:"Fechar"}},render:html=>{
    html.find(".vc-add-to-sheet").on("click",async()=>{
      try{
       if(game.system.id!=="wod5e")throw new Error("A importação para ficha requer o sistema World of Darkness 5e.");
       const actor=canvas.tokens.controlled[0]?.actor;
       if(!actor)throw new Error("Selecione um token com uma ficha antes de adicionar o poder.");
       const source=entryToItemSource(e);
       await actor.createEmbeddedDocuments("Item",[source]);
       ui.notifications.info(e.name+" foi adicionado à ficha de "+actor.name+".");
       dlg.close();
      }catch(err){console.error(err);ui.notifications.error(err.message);}
    });
  }});dlg.render(true);
 }));
}

class CodexAdminSettings extends FormApplication {
 static get defaultOptions(){return foundry.utils.mergeObject(super.defaultOptions,{id:"vtm5e-codex-admin",title:"VTM5e Codex — Configurações do Mestre",template:null,width:520,height:"auto",closeOnSubmit:false});}
 async _renderInner(){
  return $(`<form class="vtm5e-admin-settings"><p>Configurações administrativas da biblioteca. A remoção apaga todos os registros importados deste mundo.</p><hr><button type="button" class="vct-danger"><i class="fas fa-trash"></i> Remover todo o conteúdo do Codex</button><p class="notes">Esta ação não pode ser desfeita. Exporte uma cópia JSON antes de continuar.</p></form>`);
 }
 activateListeners(html){
  super.activateListeners(html);
  html.find(".vct-danger").on("click",async event=>{
   event.preventDefault();
   const confirmed=await Dialog.confirm({title:"Remover todo o conteúdo?",content:"<p>Isso apagará permanentemente todos os poderes, rituais, cerimônias e demais registros salvos neste mundo.</p><p><strong>Recomendamos exportar uma cópia antes.</strong></p>",yes:()=>true,no:()=>false,defaultYes:false});
   if(!confirmed)return;
   await game.settings.set(MODULE_ID,SETTING_KEY,emptyLibrary());
   ui.notifications.info("Todo o conteúdo do VTM5e Codex foi removido.");
   this.close();
  });
 }
}

export function registerCodexSettings(){
 if(!game.settings.settings.has(MODULE_ID+".libraryData"))game.settings.register(MODULE_ID,SETTING_KEY,{scope:"world",config:false,type:Object,default:emptyLibrary()});
 if(!game.settings.settings.has(MODULE_ID+".playersSeeElderPowers"))game.settings.register(MODULE_ID,"playersSeeElderPowers",{name:"Permitir que jogadores vejam poderes de Anciões e Matusalém",hint:"Quando ativado, as abas de poderes de Anciões e Matusalém ficam visíveis para todos os jogadores deste mundo.",scope:"world",config:true,type:Boolean,default:false});
 if(!game.settings.menus.has(MODULE_ID+".adminSettings"))game.settings.registerMenu(MODULE_ID,"adminSettings",{name:"Configurações administrativas do Codex",label:"Abrir configurações",hint:"Ferramentas exclusivas do Mestre para administrar a biblioteca.",icon:"fas fa-tools",type:CodexAdminSettings,restricted:true});
}
export async function openCodex(){registerCodexSettings();render();}
export async function installCodexContent(){ui.notifications.info("Use as abas do Codex para importar os arquivos JSON de cada categoria.");return {total:library().entries.length};}
