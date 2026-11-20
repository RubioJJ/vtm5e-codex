const MODULE_ID = "vtm5e-codex";
const ITEM_PACK = "world.vtm5e-codex-disciplinas";
const MACRO_PACK = "world.vtm5e-codex-macros";
const DISCIPLINE_KEYS = { Animalism:"animalism", Auspex:"auspex", "Blood Sorcery":"sorcery", Celerity:"celerity", Dominate:"dominate", Fortitude:"fortitude", Obfuscate:"obfuscate", Oblivion:"oblivion", Potence:"potence", Presence:"presence", Protean:"protean" };
async function loadCatalog() {
  const response = await fetch(`modules/${MODULE_ID}/data/powers.json`);
  if (!response.ok) throw new Error(`Falha ao carregar catálogo (${response.status}).`);
  return response.json();
}
function selectedActor() { return canvas.tokens.controlled[0]?.actor ?? game.user.character ?? null; }
function dicepoolObject(power) {
  const paths = power.dicepoolPaths || [];
  return Object.fromEntries(paths.map((path, index) => [`codex${index}`, { path }]));
}
function itemData(power) {
  const cost = Number(power.rouseCost || 0);
  return {
    name: power.name, type: "power", img: "icons/magic/perception/eye-ringed-glow-angry-large-red.webp",
    system: { level: power.level, cost, discipline: DISCIPLINE_KEYS[power.discipline], selected: false, dicepool: dicepoolObject(power),
      description: `<h3>${power.discipline} • Nível ${power.level}</h3><p>${power.summary || power.sourceSummary}</p><p><strong>Custo:</strong> ${power.mechanics.cost}</p><p><strong>Parada:</strong> ${power.mechanics.dicePool}</p><p><strong>Duração:</strong> ${power.mechanics.duration}</p><p><em>Referência: All the Disciplines for Vampire V5, p. ${power.page}. Consulte o livro para exceções, pré-requisitos e a descrição completa.</em></p>`,
      macroid: "" },
    flags: { [MODULE_ID]: { discipline: power.discipline, level: power.level, sourcePage: power.page, catalogEntry: true, cost, dicePoolPaths: power.dicepoolPaths || [] } }
  };
}
function macroCommand(power) {
 const name=JSON.stringify(power.name);
 const summary=JSON.stringify(power.summary || power.sourceSummary || "");
 const paths=JSON.stringify(power.dicepoolPaths || []);
 const cost=Number(power.rouseCost||0);
 const discipline=JSON.stringify(DISCIPLINE_KEYS[power.discipline]);
 const title=JSON.stringify(`${power.name} • ${power.discipline}`);
 return `// VTM5e Codex — macro integrada ao sistema World of Darkness 5e
const actor = canvas.tokens.controlled[0]?.actor ?? game.user.character;
if (!actor) { ui.notifications.warn("Selecione um token ou defina um personagem."); return; }
if (game.system.id !== "wod5e" || !WOD5E?.api?.Roll) { ui.notifications.error("Esta macro requer World of Darkness 5e."); return; }
const powerName = ${name};
const flavor = ${summary};
const paths = ${paths};
const discipline = ${discipline};
const cost = ${cost};
const title = ${title};
const valuePaths = paths.map(path => path + ".value");
const selectors = ["disciplines", "disciplines." + discipline];
let basicDice = 0;
if (valuePaths.length) basicDice = await WOD5E.api.getBasicDice({ valuePaths, actor });
let advancedDice = await WOD5E.api.getAdvancedDice({ actor });
const hasPool = valuePaths.length > 0;
if (actor.system.gamesystem === "vampire" && actor.type !== "ghoul") {
  advancedDice = Math.min(basicDice, advancedDice);
  basicDice = Math.max(basicDice - advancedDice, 0);
} else if (actor.system.gamesystem === "werewolf") {
  advancedDice = Math.min(basicDice, advancedDice);
  basicDice = Math.max(basicDice - advancedDice, 0);
}
if (hasPool) {
  await WOD5E.api.Roll({
    basicDice, advancedDice, actor, data: actor.system, title,
    flavor: flavor + "\\nParada: " + paths.join(" + "),
    selectors, increaseHunger: false, difficulty: 0
  });
} else {
  ChatMessage.create({ speaker: ChatMessage.getSpeaker({actor}), content: "<h3>" + powerName + "</h3><p>" + flavor + "</p><p>Poder sem parada automática indicada; consulte a referência para sua resolução.</p>" });
}
if (cost > 0 && actor.type === "vampire") {
  await WOD5E.api.Roll({
    advancedDice: cost, actor, data: actor.system,
    title: "Teste de Despertar — " + powerName,
    flavor: "Custo de ativação do poder", disableBasicDice: true,
    quickRoll: true, increaseHunger: true, selectors: ["rouse"]
  });
} else if (cost > 0 && actor.type === "ghoul" && Number(${power.level}) > 1) {
  const health = actor.system.health;
  await actor.update({ "system.health.aggravated": Math.min(Number(health.aggravated || 0) + 1, Number(health.max || 0)) });
}
`;
}
async function ensurePack(collection, label, type) {
  let pack = game.packs.get(collection);
  if (pack) return pack;
  if (!game.user.isGM) throw new Error("Somente o Narrador (GM) pode criar os compêndios no mundo.");
  return CompendiumCollection.createCompendium({ name: collection.split(".").at(-1), label, type, package: "world", system: "wod5e" });
}
export async function installCodexContent() {
  if (game.system.id !== "wod5e") throw new Error("Este módulo requer World of Darkness 5e.");
  if (!game.user.isGM) throw new Error("A criação dos compêndios precisa ser feita pelo Narrador (GM).");
  const catalog = await loadCatalog();
  const itemPack = await ensurePack(ITEM_PACK, "VTM5e Codex — Disciplinas", "Item");
  const macroPack = await ensurePack(MACRO_PACK, "VTM5e Codex — Macros de Poderes", "Macro");
  const itemDocs = await itemPack.getDocuments();
  const macroDocs = await macroPack.getDocuments();
  const itemMap = new Map(itemDocs.map(doc => [doc.name, doc]));
  const macroMap = new Map(macroDocs.map(doc => [doc.name, doc]));
  let createdItems = 0, updatedItems = 0, createdMacros = 0, updatedMacros = 0;
  for (const power of catalog.disciplines) {
    const item = itemMap.get(power.name);
    const source = itemData(power);
    if (item) { await item.update(source); updatedItems++; }
    else { await Item.implementation.createDocuments([source], { pack: itemPack.collection }); createdItems++; }
    const macroName = `VTM5e | ${power.name}`;
    const macroSource = { name: macroName, type: "script", img: "icons/svg/dice-target.svg", command: macroCommand(power), ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER }, flags: { [MODULE_ID]: { discipline: power.discipline, power: power.name, level: power.level, sourcePage: power.page } } };
    const macro = macroMap.get(macroName);
    if (macro) { await macro.update(macroSource); updatedMacros++; }
    else { await Macro.implementation.createDocuments([macroSource], { pack: macroPack.collection }); createdMacros++; }
  }
  ui.notifications.info(`VTM5e Codex atualizado: ${createdItems} poderes e ${createdMacros} macros novos; ${updatedItems} poderes e ${updatedMacros} macros atualizados.`);
  return { total: catalog.disciplines.length, createdItems, updatedItems, createdMacros, updatedMacros };
}
export async function openCodex() {
  let catalog;
  try { catalog = await loadCatalog(); } catch (error) { console.error(error); return ui.notifications.error(error.message); }
  const disciplines = [...new Set(catalog.disciplines.map(power => power.discipline))];
  const content = await renderTemplate(`modules/${MODULE_ID}/templates/codex.hbs`, { disciplines, powers: catalog.disciplines, total: catalog.disciplines.length });
  new Dialog({ title: "VTM5e Codex — Biblioteca de Disciplinas", content,
    buttons: { install: { label: "Criar / atualizar compêndios e macros", callback: async () => { try { await installCodexContent(); } catch (error) { console.error(error); ui.notifications.error(error.message); } } }, close: { label: "Fechar" } },
    default: "close", render: html => bindControls(html, catalog)
  }, { width: 900, height: 740, resizable: true, classes: ["wod5e", "vtm5e-codex-window"] }).render(true);
}
function bindControls(html, catalog) {
  const root = html[0] ?? html;
  const search = root.querySelector("[name='codex-search']");
  const discipline = root.querySelector("[name='codex-discipline']");
  const level = root.querySelector("[name='codex-level']");
  const rows = [...root.querySelectorAll("[data-power-name]")];
  const filter = () => {
    const query = (search.value || "").toLocaleLowerCase("pt-BR");
    rows.forEach(row => { row.hidden = !row.dataset.powerName.toLocaleLowerCase("pt-BR").includes(query) || (!!discipline.value && row.dataset.discipline !== discipline.value) || (!!level.value && row.dataset.level !== level.value); });
  };
  search.addEventListener("input", filter); discipline.addEventListener("change", filter); level.addEventListener("change", filter);
  root.querySelectorAll("[data-add-power]").forEach(button => button.addEventListener("click", async () => {
    const power = catalog.disciplines.find(entry => entry.name === button.dataset.addPower);
    const actor = selectedActor();
    if (!actor) return ui.notifications.warn("Selecione um token ou defina um personagem para adicionar o poder.");
    const existing = actor.items.find(item => item.name === power.name && item.getFlag(MODULE_ID, "catalogEntry"));
    if (existing) await existing.update(itemData(power));
    else await actor.createEmbeddedDocuments("Item", [itemData(power)]);
    ui.notifications.info(`${power.name} sincronizado na ficha de ${actor.name}.`);
  }));
}
