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
function itemData(power) {
  return {
    name: power.name, type: "power", img: "icons/magic/perception/eye-ringed-glow-angry-large-red.webp",
    system: { level: power.level, cost: 0, discipline: DISCIPLINE_KEYS[power.discipline], selected: false, dicepool: {},
      description: `<p><strong>${power.discipline} • Nível ${power.level}</strong></p><p>Referência: <em>All the Disciplines for Vampire V5</em>, p. ${power.page}.</p><p>Custo 0 é apenas um valor técnico provisório, não indica que o poder seja gratuito. Consulte a página para custo, requisitos, parada de dados, efeitos e duração.</p><p>Registro de catálogo; não é transcrição das regras.</p>`, macroid: "" },
    flags: { [MODULE_ID]: { discipline: power.discipline, level: power.level, sourcePage: power.page, catalogEntry: true } }
  };
}
function macroCommand(power) {
  const safeName = power.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `// VTM5e Codex — ${safeName}
const actor = canvas.tokens.controlled[0]?.actor ?? game.user.character;
if (!actor) { ui.notifications.warn("Selecione um token ou defina um personagem."); return; }
const values = await new Promise(resolve => {
  const content = '<form><div class="form-group"><label>Dados normais (dV)</label><input name="normal" type="number" min="0" max="30" value="0"></div><div class="form-group"><label>Dados de Fome (dG)</label><input name="hunger" type="number" min="0" max="5" value="0"></div></form>';
  new Dialog({ title: "${safeName} — Parada de dados", content, buttons: { roll: { label: "Rolar", callback: html => resolve({ normal: Number(html.find('[name=normal]').val()), hunger: Number(html.find('[name=hunger]').val()) }) }, cancel: { label: "Cancelar", callback: () => resolve(null) } }, default: "roll", close: () => resolve(null) }).render(true);
});
if (!values) return;
if (values.normal + values.hunger < 1) { ui.notifications.warn("Informe ao menos um dado."); return; }
const formula = [values.normal ? values.normal + "dv" : null, values.hunger ? values.hunger + "dg" : null].filter(Boolean).join(" + ");
const roll = await new Roll(formula).evaluate();
await roll.toMessage({ speaker: ChatMessage.getSpeaker({ actor }), flavor: "${safeName}" });`;
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
  await itemPack.getIndex(); await macroPack.getIndex();
  const knownItems = new Set(itemPack.index.contents.map(entry => entry.name));
  const knownMacros = new Set(macroPack.index.contents.map(entry => entry.name));
  const newItems = catalog.disciplines.filter(power => !knownItems.has(power.name)).map(itemData);
  const newMacros = catalog.disciplines.filter(power => !knownMacros.has(`VTM5e | ${power.name}`)).map(power => ({
    name: `VTM5e | ${power.name}`, type: "script", img: "icons/svg/dice-target.svg", command: macroCommand(power),
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER },
    flags: { [MODULE_ID]: { discipline: power.discipline, power: power.name, level: power.level, sourcePage: power.page } }
  }));
  if (newItems.length) await Item.implementation.createDocuments(newItems, { pack: itemPack.collection });
  if (newMacros.length) await Macro.implementation.createDocuments(newMacros, { pack: macroPack.collection });
  ui.notifications.info(`VTM5e Codex: ${newItems.length} poderes e ${newMacros.length} macros adicionados.`);
  return { total: catalog.disciplines.length, itemsAdded: newItems.length, macrosAdded: newMacros.length };
}
export async function openCodex() {
  let catalog;
  try { catalog = await loadCatalog(); } catch (error) { console.error(error); return ui.notifications.error(error.message); }
  const disciplines = [...new Set(catalog.disciplines.map(power => power.discipline))];
  const content = await renderTemplate(`modules/${MODULE_ID}/templates/codex.hbs`, { disciplines, powers: catalog.disciplines, total: catalog.disciplines.length });
  new Dialog({ title: "VTM5e Codex — Biblioteca de Disciplinas", content,
    buttons: { install: { label: "Criar compêndios e macros", callback: async () => { try { await installCodexContent(); } catch (error) { ui.notifications.error(error.message); } } }, close: { label: "Fechar" } },
    default: "close", render: html => bindControls(html, catalog)
  }, { width: 860, height: 720, resizable: true, classes: ["wod5e", "vtm5e-codex-window"] }).render(true);
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
    await actor.createEmbeddedDocuments("Item", [itemData(power)]);
    ui.notifications.info(`${power.name} adicionado à ficha de ${actor.name}.`);
  }));
}