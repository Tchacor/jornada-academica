# Jornada Acadêmica

Jogo sério (serious game) educativo, 2D e web, que ajuda estudantes universitários a reconhecer sinais de ansiedade e a praticar estratégias de autorregulação em situações do cotidiano acadêmico. Inspirado nos domínios da Escala de Ansiedade de Beck (BAI) **apenas como referência teórica — sem finalidade diagnóstica ou terapêutica**.

## Jogar / desenvolver

```bash
cd game
npm install
npm run dev      # servidor local (Vite)
npm test         # testes das regras (medidor de ansiedade e pontuação)
npm run build    # build de produção em game/dist
```

Funciona em desktop (teclado) e celular em paisagem (botões de toque na tela).

| Ação | Teclado | Toque |
|---|---|---|
| Andar | ← → ou A D | setas na tela |
| Pular | ↑, W ou Espaço | botão de pulo |
| Interagir / conversar | E ou Enter | botão circular grande |
| Respiração guiada | B ou R | botão do pulmão |
| Pausa | P ou Esc | botão de pausa |

## Como funciona

- **4 fases + Zona Segura** em um campus universitário (side-scroller). O **medidor de ansiedade** vai de verde (controlada) a amarelo (moderada) e vermelho (intensa).
- Desvie (pulando) das **nuvens de pensamentos intrusivos**, converse com colegas/professores (escolhas com feedback imediato) e use a **respiração guiada** (segure para inspirar e segurar, solte para expirar).
- Ficar tempo demais no vermelho leva o jogador à **Zona Segura**, sem “game over”. É possível ir à Zona Segura quando quiser pelo menu de pausa.
- A **pontuação é simbólica** (“pontos de cuidado”): valoriza respirar, pedir apoio e fazer pausas, não velocidade.
- Fases: 1 Início da Jornada · 2 Primeira Apresentação (ansiedade no corpo) · 3 Desenvolvimento do TCC (ansiedade cognitiva) · 4 Formatura (ansiedade social).
- O sistema de cartas descrito no GDD foi **removido por ora**.

## Estrutura

```
game/                 projeto Phaser 3 + TypeScript + Vite
  public/assets/      toda a arte em SVG vetorial (personagens, cenários, UI, props)
  src/data/levels.ts  conteúdo das fases (obstáculos, NPCs, diálogos, zonas de tensão)
  src/systems/        medidor de ansiedade, pontuação, save local, áudio procedural
  src/scenes/         Boot, Menu, Personagem, Configurações, Fases, Level, Fim
  tests/              testes unitários
docs/PLANO_DE_EXECUCAO.md   plano do projeto
GDD/ Artigo/ Descrição das telas/ Telas Jogo/   material de referência original
```

## Aviso

Este jogo é educativo, não faz diagnóstico nem substitui atendimento profissional. Os textos de diálogos e acolhimento devem ser **revisados por um profissional de psicologia** antes de testes com usuários, e os testes podem exigir aprovação de comitê de ética.
