const MODULE_ID = "vtm5e-codex";
const DISCIPLINES = ["Animalism","Auspex","Blood Sorcery","Celerity","Dominate","Fortitude","Obfuscate","Oblivion","Potence","Presence","Protean"];
const TEMPLATE_URL = `modules/${MODULE_ID}/templates/power-template.json`;

function notify(message, type="info") {
  const fn = ui.notifications[type] || ui.notifications.info;
  fn.call(ui.notifications, message);
}
function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function normalizePower(p) {
  return {
    name:String(p.name||"").trim(),
    discipline:String(p.discipline||"").trim(),
    level:Number(p.level||0),
    page:Number(p.page||0),
    source:String(p.source||""),
    description:String(p.description||""),
    cost:String(p.cost||""),
    dicePools:String(p.dicePools||p.dicePool||""),
    system:String(p.system||""),
    duration:String(p.duration||""),
    prerequisites:String(p.prerequisites||p.prerequisite||""),
    amalgam:String(p.amalgam||""),
    macro:{ enabled:p.macro?.enabled===true, mode:p.macro?.mode||"manual", normalPool:String(p.macro?.normalPool||""), hungerPool:String(p.macro?.hungerPool||""), costType:p.macro?.costType||"manual", notes:String(p.macro?.notes||"") }
  };
}
function validate(p) {
  const errors=[];
  if(!p.name) errors.push("nome ausente");
  if(!DISCIPLINES.includes(p.discipline)) errors.push("Disciplina inválida");
  if(!Number.isInteger(p.level)||p.level<1||p.level>5) errors.push("nível deve ser de 1 a 5");
  if(!p.description) errors.push("descrição vazia");
  if(!p.cost && !p.dicePools && !p.system) errors.push("campos mecânicos ausentes");
  return errors;
}
async function readJson(file) {
  const parsed=JSON.parse(await file.text());
  const list=Array.isArray(parsed)?parsed:parsed.powers;
  if(!Array.isArray(list)) throw new Error("JSON inválido: esperado um array 'powers'.");
  return list.map(normalizePower);
}
async function loadPdfJs() {
  const existing = globalThis.pdfjsLib || globalThis.pdfjs;
  if (existing?.getDocument) return existing;
  // Foundry V13 não expõe PDF.js como global em todas as instalações.
  // Carrega uma versão fixa do PDF.js quando a importação de PDF é solicitada.
  try {
    const pdfjs = await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
    return pdfjs;
  } catch (error) {
    console.error("VTM5e Codex | Não foi possível carregar PDF.js.", error);
    throw new Error("Não foi possível carregar o leitor de PDF. Verifique a conexão com a internet e se o navegador permite acessar cdn.jsdelivr.net. Como alternativa, importe o arquivo JSON.");
  }
}
async function readPdf(file) {
  const pdfjs = await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const textPages = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n);
    const content = await page.getTextContent();
    // Reconstruct text lines from PDF coordinates; joining every token with
    // spaces destroys the heading/source/field structure used by this PDF.
    const rows = new Map();
    for (const item of content.items) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform?.[5] ?? 0);
      if (!rows.has(y)) rows.set(y, []);
      rows.get(y).push({ x: item.transform?.[4] ?? 0, text: item.str });
    }
    const lines = [...rows.entries()]
      .sort((a,b) => b[0]-a[0])
      .map(([,items]) => items.sort((a,b)=>a.x-b.x).map(x=>x.text).join(" ").trim());
    textPages.push(lines.join("\\n"));
  }
  const entries = parsePdfText(textPages.join("\\n"));
  if (!entries.length) throw new Error("O PDF foi aberto, mas nenhum poder foi reconhecido automaticamente. Use o template JSON e revise os campos manualmente.");
  return entries;
}
function parsePdfText(text) {
  const lines = text.split(/\\r?\\n/).map(line => line.replace(/\\s+/g," ").trim());
  const entries = [];
  let discipline = "";
  let level = 0;
  const isDiscipline = line => DISCIPLINES.some(d => d.toLowerCase() === line.toLowerCase());
  const isLevel = line => /^Level\\s+([1-5])$/i.test(line);
  const isField = line => /^■\\s*(Cost|Dice Pools?|System|Duration|Prerequisite|Amalgam)\\s*:/i.test(line);
  const clean = value => value.replace(/^■\\s*/,"").trim();
  for (let i=0;i<lines.length;i++) {
    const line=lines[i];
    if (isDiscipline(line)) { discipline=DISCIPLINES.find(d=>d.toLowerCase()===line.toLowerCase()); continue; }
    const lm=line.match(/^Level\\s+([1-5])$/i);
    if (lm) { level=Number(lm[1]); continue; }
    if (!discipline || !level || !line || isField(line) || /^\\[.*pag/i.test(line)) continue;

    // A power heading is followed by a bracketed source line, e.g. [Core Rulebook, pag 245].
    let sourceIndex=i+1;
    while(sourceIndex<lines.length && !lines[sourceIndex]) sourceIndex++;
    if(sourceIndex>=lines.length || !/^\\[.*(?:pag|page)\\s*\\d+/i.test(lines[sourceIndex])) continue;

    const name=line.replace(/\\s+/g," ").trim();
    const source=lines[sourceIndex].replace(/^\\[|\\]$/g,"").trim();
    const fields={description:[],cost:[],dicePools:[],system:[],duration:[],prerequisites:[],amalgam:[]};
    let current="description";
    let j=sourceIndex+1;
    for(;j<lines.length;j++){
      const row=lines[j];
      if(!row) continue;
      if(isDiscipline(row) || isLevel(row)) break;
      const fm=row.match(/^■\\s*(Cost|Dice Pools?|System|Duration|Prerequisite|Amalgam)\\s*:\\s*(.*)$/i);
      if(fm){
        const key=/^cost$/i.test(fm[1])?"cost":/^dice pools?$/i.test(fm[1])?"dicePools":/^system$/i.test(fm[1])?"system":/^duration$/i.test(fm[1])?"duration":/^prerequisite$/i.test(fm[1])?"prerequisites":"amalgam";
        current=key;
        if(fm[2]) fields[current].push(fm[2]);
        continue;
      }
      if(/^\\[.*(?:pag|page)\\s*\\d+/i.test(row)) break;
      fields[current].push(row);
    }
    const value=key=>fields[key].join(" ").replace(/\\s+/g," ").trim();
    entries.push(normalizePower({
      name,discipline,level,source,page:Number((source.match(/(?:pag|page)\\s*(\\d+)/i)||[])[1]||0),
      description:value("description"),cost:value("cost"),dicePools:value("dicePools"),
      system:value("system"),duration:value("duration"),prerequisites:value("prerequisites"),
      amalgam:value("amalgam")
    }));
    i=j-1;
  }
  return entries;
}
async function ensurePowerPack() {
  const collection = "world.vtm5e-codex-disciplinas";
  let pack = game.packs.get(collection);
  if (pack) return pack;
  if (!game.user.isGM) throw new Error("Somente o Narrador pode criar o compêndio.");
  return CompendiumCollection.createCompendium({
    name: "vtm5e-codex-disciplinas",
    label: "VTM5e Codex — Disciplinas",
    type: "Item",
    package: "world",
    system: "wod5e"
  });
}
function toItemSource(p) {
  const html = [
    `<h2>${escapeHtml(p.discipline)} — Level ${p.level}</h2>`,
    p.description ? `<h3>Description</h3><p>${escapeHtml(p.description).replace(/\\n/g,"<br>")}</p>` : "",
    p.cost ? `<h3>Cost</h3><p>${escapeHtml(p.cost)}</p>` : "",
    p.dicePools ? `<h3>Dice Pools</h3><p>${escapeHtml(p.dicePools)}</p>` : "",
    p.system ? `<h3>System</h3><p>${escapeHtml(p.system).replace(/\\n/g,"<br>")}</p>` : "",
    p.duration ? `<h3>Duration</h3><p>${escapeHtml(p.duration)}</p>` : "",
    p.prerequisites ? `<h3>Prerequisites</h3><p>${escapeHtml(p.prerequisites)}</p>` : "",
    p.amalgam ? `<h3>Amalgam</h3><p>${escapeHtml(p.amalgam)}</p>` : "",
    p.source || p.page ? `<p><em>${escapeHtml(p.source)} ${p.page ? `— p. ${p.page}` : ""}</em></p>` : ""
  ].filter(Boolean).join("");
  return {
    name:p.name,
    type:"power",
    img:"icons/magic/perception/eye-ringed-glow-angry-large-red.webp",
    system:{
      level:p.level,
      cost:0,
      discipline:({Animalism:"animalism",Auspex:"auspex","Blood Sorcery":"sorcery",Celerity:"celerity",Dominate:"dominate",Fortitude:"fortitude",Obfuscate:"obfuscate",Oblivion:"oblivion",Potence:"potence",Presence:"presence",Protean:"protean"})[p.discipline],
      selected:false,
      dicepool:{},
      description:html,
      macroid:""
    },
    flags:{[MODULE_ID]:{imported:true,discipline:p.discipline,level:p.level,page:p.page,source:p.source,originalFields:p}}
  };
}
async function importPowers(powers) {
  const normalized=powers.map(normalizePower);
  const bad=normalized.map(p=>({p,errors:validate(p)})).filter(x=>x.errors.length);
  if(bad.length) throw new Error(`${bad.length} registro(s) precisam de revisão. Primeiro problema: ${bad[0].p.name||"(sem nome)"} — ${bad[0].errors.join(", ")}.`);
  if(game.system.id!=="wod5e") throw new Error("Este importador requer World of Darkness 5e.");
  if(!game.user.isGM) throw new Error("Entre como Narrador (GM) para importar no compêndio.");
  const pack=await ensurePowerPack();
  const docs=await pack.getDocuments();
  const existing=new Map(docs.map(doc=>[`${doc.getFlag(MODULE_ID,"discipline")||doc.system.discipline}|${doc.name}`,doc]));
  let added=0,updated=0;
  for(const p of normalized){
    const key=`${p.discipline}|${p.name}`;
    const old=existing.get(key);
    const source=toItemSource(p);
    if(old){await old.update(source);updated++;}
    else {await Item.implementation.createDocuments([source],{pack:pack.collection});added++;}
  }
  const payload={schemaVersion:1,sourceTitle:"User imported content",disciplines:normalized};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="vtm5e-codex-imported-powers.json";a.click();URL.revokeObjectURL(url);
  notify(`Importação concluída: ${added} poderes adicionados e ${updated} atualizados no compêndio. Um JSON de backup foi baixado.`);
  return {added,updated};
}
export async function openImporter() {
  const content=`<form class="vtm5e-importer"><p>Importe um PDF (extração experimental) ou um JSON preenchido a partir do template externo.</p><div class="form-group"><label>Arquivo PDF ou JSON</label><input type="file" name="source" accept=".pdf,.json,application/pdf,application/json" required></div><p class="notes">Recomendado: edite o template JSON fora do Foundry para garantir a separação correta dos campos. A extração automática de PDF exige PDF.js disponível no Foundry e deve ser revisada.</p><div class="form-group"><label><input type="checkbox" name="replace" checked> Atualizar entradas com mesmo nome e Disciplina</label></div></form>`;
  new Dialog({title:"VTM5e Codex | Importar conteúdo",content,buttons:{
    template:{label:"Baixar template JSON",callback:async()=>{const r=await fetch(TEMPLATE_URL);const b=await r.blob();const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="power-template.json";a.click();URL.revokeObjectURL(u);}},
    import:{label:"Ler e validar arquivo",callback:async html=>{try{const file=html.find('[name="source"]')[0]?.files?.[0];if(!file)throw new Error("Selecione um arquivo.");const powers=file.name.toLowerCase().endsWith(".json")?await readJson(file):await readPdf(file);const report=powers.map((p,i)=>({i:i+1,name:p.name,discipline:p.discipline,errors:validate(p)}));const invalid=report.filter(x=>x.errors.length);if(invalid.length)throw new Error(`${invalid.length} registro(s) com campos faltando. Exemplo: ${invalid[0].name||"sem nome"} — ${invalid[0].errors.join(", ")}`);await importPowers(powers);}catch(e){console.error(e);notify(e.message,"error");}}}
  },default:"import"},{width:560}).render(true);
}
