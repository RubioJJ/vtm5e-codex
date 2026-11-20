# VTM5e Codex

Biblioteca visual para **Foundry VTT V13** e **World of Darkness 5e (wod5e) 5.3.15+**.

## O que esta versão faz
- Janela própria na aba **Compêndios**, com busca por nome, Disciplina e nível.
- Catálogo de **196 poderes** das 11 Disciplinas listadas no PDF *All the Disciplines for Vampire V5* (atualização indicada no documento: 31/07/2025).
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

## Limites desta versão
O PDF fornecido foi usado como referência para nomes, níveis e páginas. Para respeitar direitos autorais, o módulo não redistribui descrições extensas nem o texto integral das regras. As entradas indicam a página; custo, requisitos, parada de dados, efeitos e duração ainda precisam ser conferidos no livro. As macros são modelos de rolagem: solicitam a quantidade de dados normais e de Fome, pois a parada varia conforme personagem e poder.

O campo de custo 0 nos itens é apenas um valor técnico provisório, não significa que o poder seja gratuito. A automação de efeitos específicos (dano, condições, modificadores e custos de Fome) não é aplicada automaticamente nesta versão.

Projeto comunitário não oficial. Vampire: The Masquerade e World of Darkness são marcas de seus respectivos titulares.
