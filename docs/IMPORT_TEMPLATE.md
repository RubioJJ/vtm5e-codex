# VTM5e Codex — Template externo de poderes

Edite `templates/power-template.json` em VS Code, VS Code Web ou outro editor JSON. Salve seus registros em um arquivo chamado `vtm5e-codex-powers.json`.

## Regras de preenchimento

- O arquivo deve ser JSON válido.
- Cada poder deve ser um objeto dentro do array `powers`.
- `discipline` deve ser exatamente um destes nomes: Animalism, Auspex, Blood Sorcery, Celerity, Dominate, Fortitude, Obfuscate, Oblivion, Potence, Presence, Protean.
- `level`: número inteiro de 1 a 5.
- Preserve o idioma e a redação da sua fonte nos campos de texto.
- `cost`, `dicePools`, `system`, `duration`, `prerequisites` e `amalgam` são campos separados.
- Não marque `macro.enabled` como true até confirmar a mecânica. Macros com campos ambíguos devem permanecer manuais.

## Fluxo de trabalho

1. Copie o template e renomeie para `vtm5e-codex-powers.json`.
2. Edite fora do Foundry.
3. Valide o JSON (VS Code destaca erros de sintaxe).
4. No Foundry, abra Compêndios → Abrir VTM5e Codex → Importar conteúdo.
5. Selecione o JSON e valide.
6. O importador gera um JSON atualizado para download. Revise e envie o arquivo para `data/powers.json` no GitHub.
7. Publique uma nova versão quando quiser distribuir o catálogo.

## Importação de PDF

O leitor PDF é experimental e depende de PDF.js estar disponível globalmente no Foundry. A detecção automática de títulos/campos varia com a estrutura do PDF. Sempre revise o resultado e prefira o template JSON para importações completas e confiáveis.

## Segurança e preservação

O importador não envia o PDF para serviços externos. O arquivo é lido no navegador local do Foundry. O JSON gerado é baixado no computador; o usuário decide se o adiciona ao repositório.
