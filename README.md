# VTM5e Codex

Biblioteca visual para **Foundry VTT V13** e **World of Darkness 5e (wod5e) 5.3.15+**.

## O que esta versão faz
- Janela própria na aba **Compêndios**, com busca por nome, Disciplina e nível.
- Catálogo de **203 poderes** das 11 Disciplinas listadas no PDF *All the Disciplines for Vampire V5* (atualização indicada no documento: 31/07/2025).
- Cria dois compêndios no mundo: **VTM5e Codex — Disciplinas** (itens nativos `power`) e **VTM5e Codex — Macros de Poderes**.
- Cria uma macro de rolagem para cada poder, usando os dados especiais do sistema (`dv` e `dg`).
- Permite adicionar um poder à ficha do token selecionado; itens do compêndio também podem ser arrastados para a ficha.
- As macros podem ser arrastadas do compêndio para a hotbar.

## Instalação
No Foundry VTT: **Add-on Modules → Install Module → Manifest URL**:
```
https://github.com/RubioJJ/vtm5e-codex/releases/latest/download/module.json
```
Ative o módulo em um mundo com **World of Darkness 5e**.

## Primeiro uso
1. Abra a aba **Compêndios**.
2. Clique em **Abrir VTM5e Codex**.
3. Como GM, clique em **Criar compêndios e macros**.
4. Aguarde a criação dos dois compêndios.
5. Arraste os poderes para a ficha e as macros para a hotbar.

A criação é incremental: executar novamente adiciona apenas registros ausentes.

## Importador e template externo (v0.4.0)
- Botão **Importar conteúdo** na aba Compêndios.
- Importa JSON validado e cria/atualiza itens nativos `power` no compêndio do mundo **VTM5e Codex — Disciplinas**.
- Baixa um JSON de backup ao concluir.
- Template editável: `templates/power-template.json`.
- Guia: `docs/IMPORT_TEMPLATE.md`.

**Fluxo recomendado:** copie o template, edite no VS Code, valide o JSON, importe no Foundry como GM e revise os itens. O JSON de backup pode ser adicionado manualmente a `data/powers.json` no GitHub para versionar o conteúdo.

A leitura direta de PDF é experimental e depende de PDF.js disponível globalmente no navegador do Foundry. O reconhecimento de títulos/campos varia conforme a diagramação; revise tudo antes de confiar nos resultados. O fluxo JSON é o caminho confiável. O importador não cria macros automáticas nesta etapa: custos e paradas devem ser conferidos antes de automatizar rolagens.

Projeto comunitário não oficial. Vampire: The Masquerade e World of Darkness são marcas de seus respectivos titulares.


## Importador e template externo (v0.4.0)

O módulo inclui um importador de JSON acessível pelo botão **Importar conteúdo** na aba Compêndios. O importador valida os campos e cria/atualiza itens `power` no compêndio do mundo `VTM5e Codex — Disciplinas`. Ao final, baixa um JSON de backup.

Template editável fora do Foundry: `templates/power-template.json`. Guia: `docs/IMPORT_TEMPLATE.md`.

**Fluxo recomendado:** copie o template, edite no VS Code, valide o JSON, importe no Foundry como GM e revise os itens. O JSON de backup pode ser adicionado manualmente a `data/powers.json` no GitHub para versionar o conteúdo.

A leitura direta de PDF é experimental e depende de PDF.js disponível no navegador do Foundry; PDFs com layout complexo precisam de revisão. O fluxo JSON é o caminho confiável. A importação não cria macros automáticas: os campos de macro no template são metadados para uma etapa posterior, evitando inventar rolagens ou custos quando a fonte não for inequívoca.
