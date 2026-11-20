import { openCodex, installCodexContent } from "./codex.js";
Hooks.once("init", () => console.info("VTM5e Codex | Inicializando para World of Darkness 5e."));
Hooks.once("ready", () => {
  game.modules.get("vtm5e-codex").api = { openCodex, installCodexContent };
  Hooks.on("renderCompendiumDirectory", (_app, html) => {
    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root || root.querySelector(".vtm5e-codex-open")) return;
    const header = root.querySelector(".directory-header") || root;
    const button = document.createElement("button");
    button.type = "button"; button.className = "vtm5e-codex-open";
    button.innerHTML = '<i class="fas fa-book-open"></i> Abrir VTM5e Codex';
    button.addEventListener("click", () => openCodex()); header.append(button);
  });
});
