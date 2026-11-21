import { openCodex, installCodexContent } from "./codex.js";
import { openImporter } from "./importer.js";

function getRoot(html) {
  if (html instanceof HTMLElement) return html;
  if (html?.[0] instanceof HTMLElement) return html[0];
  return null;
}

function addCodexButton(_app, html) {
  const root = getRoot(html);
  if (!root || root.querySelector(".vtm5e-codex-open")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "vtm5e-codex-open";
  button.innerHTML = '<i class="fas fa-book-open"></i> Abrir VTM5e Codex';
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openCodex();
  });


  const importButton = document.createElement("button");
  importButton.type = "button";
  importButton.className = "vtm5e-codex-import";
  importButton.innerHTML = '<i class="fas fa-file-import"></i> Importar conteúdo';
  importButton.addEventListener("click", event => { event.preventDefault(); event.stopPropagation(); openImporter(); });

  const header = root.querySelector(".directory-header");
  const actions = header?.querySelector(".header-actions");
  if (actions) actions.append(button, importButton);
  else if (header) header.append(button, importButton);
  else {
    const content = root.querySelector(".window-content") || root;
    content.prepend(importButton, button);
  }
}

// Registra o hook durante o carregamento do módulo, antes do primeiro render
// da aba de Compêndios. Isso evita perder o evento no início do mundo.
Hooks.on("renderCompendiumDirectory", addCodexButton);

Hooks.once("init", () => {
  game.settings.register("vtm5e-codex", "libraryData", { scope: "world", config: false, type: Object, default: { schemaVersion: 2, entries: [] } });
  console.info("VTM5e Codex | Inicializando para World of Darkness 5e.");
});

Hooks.once("ready", () => {
  const module = game.modules.get("vtm5e-codex");
  if (module) module.api = { openCodex, installCodexContent, openImporter };
  console.info("VTM5e Codex | Pronto. Abra a aba Compêndios.");
});
