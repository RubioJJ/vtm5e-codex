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
  return errors;
}
async function readJson(file) {
  const parsed=JSON.parse(await file.text());
  const list=Array.isArray(parsed)?parsed:parsed.powers;
  if(!Array.isArray(list)) throw new Error("JSON inválido: esperado um array 'powers'.");
  return list.map(normalizePower);
}
async function readPdf(file) {
  const pdfjs=globalThis.pdfjsLib || globalThis.pdfjs;
  if(!pdfjs?.getDocument) throw new Error("PDF.js não está disponível nesta instalação do Foundry. Use o template JSON para importar, ou converta o PDF em texto/JSON fora do Foundry.");
  const buffer=await file.arrayBuffer();
  const pdf=await pdfjs.getDocument({data:buffer}).promise;
  const textPages=[];
  for(let n=1;n<=pdf.numPages;n++){
    const page=await pdf.getPage(n);
    const content=await page.getTextContent();
    textPages.push(content.items.map(item=>item.str).join(" "));
  }
  return parsePdfText(textPages.join("\n"));
}
function parsePdfText(text) {
  const entries=[];
  const titleRe=/\b(Animalism|Auspex|Blood Sorcery|Celerity|Dominate|Fortitude|Obfuscate|Oblivion|Potence|Presence|Protean)\s+(?:Level\s+)?([1-5])\b/gi;
  const matches=[...text.matchAll(titleRe)];
  for(let i=0;i<matches.length;i++){
    const start=matches[i].index+matches[i][0].length;
    const end=matches[i+1]?.index??text.length;
    const block=text.slice(start,end);
    const name=(block.match(/^\s*([A-Z][A-Za-z’'() -]{2,65})/m)||[])[1]?.trim();
    if(!name) continue;
    const field=(label,next)=>{const re=new RegExp(label+"\\s*:?\\s*([\\s\\S]*?)(?="+next+"|$)","i");return (block.match(re)||[])[1]?.trim()||"";};
    entries.push(normalizePower({
      name,discipline:matches[i][1],level:Number(matches[i][2]),
      description:field("Description","Cost|Dice Pools?|System|Duration|Prerequisite|Amalgam"),
      cost:field("Cost","Dice Pools?|System|Duration|Prerequisite|Amalgam"),
      dicePools:field("Dice Pools?","System|Duration|Prerequisite|Amalgam"),
      system:field("System","Duration|Prerequisite|Amalgam"),
      duration:field("Duration","Prerequisite|Amalgam"),
      prerequisites:field("Prerequisite","Amalgam"),
      amalgam:field("Amalgam","$"),
      source:"PDF importado"
    }));
  }
  return entries;
}
async function importPowers(powers) {
  const normalized=powers.map(normalizePower);
  const bad=normalized.map((p,i)=>({i,p,errors:validate(p)})).filter(x=>x.errors.length);
  if(bad.length) throw new Error(`${bad.length} registro(s) precisam de revisão. Primeiro problema: ${bad[0].p.name||"(sem nome)"} — ${bad[0].errors.join(", ")}.`);
  const catalogResponse=await fetch(`modules/${MODULE_ID}/data/powers.json`);
  const catalog=catalogResponse.ok?await catalogResponse.json():{disciplines:[]};
  const existing=new Map((catalog.disciplines||[]).map(p=>[`${p.discipline}|${p.name}`,p]));
  let added=0,updated=0;
  for(const p of normalized){
    const key=`${p.discipline}|${p.name}`;
    const old=existing.get(key);
    const record={
      discipline:p.discipline,level:p.level,page:p.page,name:p.name,
      summary:p.description,description:p.description,
      source:p.source,
      mechanics:{cost:p.cost,dicePool:p.dicePools,system:p.system,duration:p.duration,prerequisites:p.prerequisites,amalgam:p.amalgam},
      importData:p,
      rouseCost:Number((p.cost.match(/(\\d+)\\s*(?:Rouse Check|Rouse Checks)/i)||[])[1]||0),
      dicepoolPaths:old?.dicepoolPaths||[]
    };
    if(old) updated++; else added++;
    existing.set(key,record);
  }
  const payload={schemaVersion:1,sourceTitle:"User imported content",disciplines:[...existing.values()]};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download="vtm5e-codex-powers.json";a.click();URL.revokeObjectURL(url);
  notify(`Importação preparada: ${added} novos e ${updated} atualizados. Baixe o JSON e carregue-o no repositório para manter o catálogo versionado.`);
  return {added,updated};
}
export async function openImporter() {
  const content=`<form class="vtm5e-importer"><p>Importe um PDF (extração experimental) ou um JSON preenchido a partir do template externo.</p><div class="form-group"><label>Arquivo PDF ou JSON</label><input type="file" name="source" accept=".pdf,.json,application/pdf,application/json" required></div><p class="notes">Recomendado: edite o template JSON fora do Foundry para garantir a separação correta dos campos. A extração automática de PDF exige PDF.js disponível no Foundry e deve ser revisada.</p><div class="form-group"><label><input type="checkbox" name="replace" checked> Atualizar entradas com mesmo nome e Disciplina</label></div></form>`;
  new Dialog({title:"VTM5e Codex | Importar conteúdo",content,buttons:{
    template:{label:"Baixar template JSON",callback:async()=>{const r=await fetch(TEMPLATE_URL);const b=await r.blob();const u=URL.createObjectURL(b);const a=document.createElement("a");a.href=u;a.download="power-template.json";a.click();URL.revokeObjectURL(u);}},
    import:{label:"Ler e validar arquivo",callback:async html=>{try{const file=html.find('[name="source"]')[0]?.files?.[0];if(!file)throw new Error("Selecione um arquivo.");const powers=file.name.toLowerCase().endsWith(".json")?await readJson(file):await readPdf(file);const report=powers.map((p,i)=>({i:i+1,name:p.name,discipline:p.discipline,errors:validate(p)}));const invalid=report.filter(x=>x.errors.length);if(invalid.length)throw new Error(`${invalid.length} registro(s) com campos faltando. Exemplo: ${invalid[0].name||"sem nome"} — ${invalid[0].errors.join(", ")}`);await importPowers(powers);}catch(e){console.error(e);notify(e.message,"error");}}}
  },default:"import"},{width:560}).render(true);
}
