# VTM5e Codex

Módulo comunitário para **Foundry Virtual Tabletop V13**, criado para organizar material de referência de *Vampire: The Masquerade 5ª edição*.

## Compêndios incluídos

- **Disciplinas** — compêndio de JournalEntry para registrar disciplinas e seus poderes.
- **Clãs** — compêndio de JournalEntry para registrar clãs, características e fraquezas.
- **Tipos de Predador** — compêndio de JournalEntry para registrar tipos de predador.

Os compêndios são entregues inicialmente vazios: o projeto fornece a estrutura para que as entradas sejam criadas e mantidas sem redistribuir texto protegido de livros oficiais.

## Requisitos

- Foundry Virtual Tabletop **V13**.
- Nenhum sistema de jogo específico é exigido para instalar a estrutura de compêndios. A integração com fichas do sistema Vampire será tratada separadamente.

## Instalação pelo Manifest

No Foundry, abra **Add-on Modules → Install Module**, cole esta URL no campo **Manifest URL** e instale:

```
https://github.com/RubioJJ/vtm5e-codex/releases/latest/download/module.json
```
## Estrutura

```text
vtm5e-codex/
├── .github/workflows/release.yml
├── assets/
├── packs/
│   ├── disciplinas.db
│   ├── clans.db
│   └── predadores.db
├── scripts/main.js
├── styles/codex.css
├── module.json
├── README.md
└── LICENSE
```

## Aviso

Este é um projeto de fã, não oficial e não afiliado à Paradox Interactive ou à Renegade Game Studios. Vampire: The Masquerade e suas marcas pertencem aos respectivos titulares. Não inclua scans, transcrições extensas ou outros materiais protegidos sem autorização.
