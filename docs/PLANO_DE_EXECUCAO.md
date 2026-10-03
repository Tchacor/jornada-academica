# Plano de Execução — Jornada Acadêmica

Base: GDD, Descrição das telas, Proposta 2.0 (artigo) e as 8 telas/UI em `Telas Jogo/`.

## 1. O que é o jogo (resumo do material)

- **Gênero:** jogo sério (serious game) educativo/emocional, 2D, **side-scroller** em cenário de campus universitário (visual cartoon acolhedor, paleta marrom/bege, ambientado no UFOPA – Campus Oriximiná).
- **Público:** universitários. **Plataforma:** web (desktop + toque/mobile). **Idioma:** pt-BR. Single player.
- **Objetivo:** ajudar o jogador a reconhecer sinais de ansiedade e praticar autorregulação. Inspirado nos domínios da Escala de Beck (BAI) **apenas como referência teórica — sem fins diagnósticos ou terapêuticos**.
- **Loop central (das telas):** andar pelo cenário (◀ ▶) → desviar/pular de "nuvens de pensamentos intrusivos" → interagir com objetos/NPCs (apoio social) → usar **respiração guiada** (minijogo) para baixar o **medidor de ansiedade** (verde / amarelo / vermelho).
- **Progressão:** 4 fases + **Zona Segura** (bosque de regulação) → cada fase concluída sem ansiedade crítica gera um **card/carta** simbólico.
- **HUD (todas as fases):** medidor de ansiedade (topo-esq.), nome da fase + pausa (topo-dir.), setas (baixo-esq.), pulo / respiração / interagir (baixo-dir.).
- **Menu:** Iniciar · Personagem (seleção + nome) · Cartas (coleção) · Configurações · botão de som.
- **MVP definido no GDD:** 2 fases jogáveis, sistema básico de ansiedade, Zona Segura funcional, sistema de cards, personagem com animação simples, pontuação simbólica, interface de progresso.

### Fases (tela × foco emocional)

| Fase | Cenário | Foco (Descrição das telas) | Arte pronta |
|---|---|---|---|
| 1 | Entrada do campus | Gatilhos/pensamentos negativos, pulo, apoio social | Sim |
| 2 | Corredor/área externa com bancos | Ansiedade **física** → respiração guiada | Sim |
| 3 | Laboratório de informática | Ansiedade **cognitiva** | Sim |
| 4 | Sala de aula | Ansiedade **social** | Sim |
| Zona Segura | Bosque com pavilhão | Recuperação, respiração, acolhimento | Sim |

## 2. Inconsistências a resolver ANTES de codar (Sprint 0)

1. **Fases: GDD × Descrição das telas divergem.** GDD: F2 = seminário, F3 = TCC (biblioteca/quarto/laboratório), F4 = formatura (auditório). Telas: F2 = corredor/respiração, F3 = informática/cognitiva, F4 = sala/social. → *Proposta:* manter os **cenários das telas** (já ilustrados) e reaproveitar a narrativa do GDD sobre eles (F2 = falar em público/seminário, F3 = TCC, F4 = formatura/encerramento).
2. **Tecnologia:** GDD cita Unity (WebGL). Para jogo 2D leve, web e mobile, com conexão possivelmente limitada, Unity WebGL tem build pesado e carregamento lento em celular. → *Recomendação:* **Phaser 3 + TypeScript** (ou Godot 4 Web) — a decidir. Se Unity for requisito (equipe/orientação), manter e otimizar build.
3. **Recursos colaborativos da Proposta** (trajetórias anonimizadas, reflexões compartilhadas, discussão mediada) **não estão no GDD**; GDD diz "multijogador: não" e login só no futuro. → *Proposta:* tratar como **fase pós-MVP** (backend + consentimento); no MVP, apenas registrar localmente.
4. **Terminologia:** "cards" (GDD) × "Cartas" (menu). Padronizar (sugestão: **Cartas**).
5. **Ícone de pulo** aparece nas 5 telas, mas a descrição só trata de pular em F1 e F3. Definir se há obstáculos em todas as fases.
6. **Numeração dos ícones** na descrição repete "03" (obstáculo e pulo). Corrigir no documento.
7. **Conteúdo clínico/ético:** validar textos de acolhimento e estratégias com profissional de psicologia; avaliar necessidade de **CEP/Plataforma Brasil** para os testes com usuários; incluir aviso "não substitui atendimento profissional" e canal de ajuda (CVV 188 / serviço da universidade).
8. **Repositório:** `Cópia de Proposta.2.0.docx` é duplicata; `UI START GAME.eps` precisa virar PNG/SVG para uso na web.

## 3. Regras de jogo propostas (valores iniciais, a balancear)

- **Medidor de ansiedade 0–100:** verde 0–33, amarelo 34–66, vermelho 67–100.
- **Sobe:** colidir com nuvem de pensamento (+10 a +15), ficar parado em zona de estresse (+1/s), ignorar eventos de fase.
- **Desce:** respiração guiada bem-sucedida (−20 a −30), interação de apoio social com NPC (−10), escolha saudável em diálogo (−5 a −10), Zona Segura (regeneração).
- **Respiração guiada:** ciclo inspirar 4s · segurar 4s · expirar 6s com círculo animado; toque/tecla segura e solta no tempo; cooldown de 20–30s para não virar "botão de cura".
- **Vermelho sustentado (> ~5s) ou 100:** o jogador é conduzido à **Zona Segura**, sem "game over" punitivo — coerente com o tom acolhedor.
- **Conclusão da fase:** chegar ao fim do cenário sem ficar no vermelho → ganha **Carta** (emoção/conquista/superação/cuidado) + frase de acolhimento. Pontuação **simbólica** (cuidado emocional, não velocidade).
- **Eventos de fase:** obstáculos + 2–3 NPCs com diálogo de escolha (feedback imediato educativo).

## 4. Arquitetura sugerida (independente da engine)

- **Cenas:** Boot/Preload → Menu → Seleção de personagem → Fase (reutilizável, configurada por dados) → Zona Segura → Cartas → Configurações.
- **Fases data-driven (JSON):** background, comprimento do cenário, obstáculos, NPCs, diálogos, carta de recompensa → permite criar F3/F4 sem código novo.
- **Sistemas:** `AnxietyMeter`, `BreathingMinigame`, `DialogueSystem`, `CardCollection`, `Score`, `SaveManager` (localStorage), `Audio`, `Input` (teclado + toque unificados), `Analytics local` (desempenho por fase, estratégias usadas — exigido pela "Avaliação" do GDD).
- **Assets:** converter EPS → SVG/PNG; separar personagem (sprites/animações idle/andar/pular) e **parallax** dos fundos; atlas de sprites; áudio em .ogg/.mp3 leve.
- **Responsivo:** base 1920×1080 (16:9), escala para mobile em paisagem; orientar rotação.
- **Qualidade:** CI com build + deploy (GitHub Pages/Netlify), testes unitários das regras do medidor, teste manual em Android de entrada.

## 5. Cronograma (estimativa para 2–3 pessoas; ajustar à equipe real)

| Sprint | Entrega | Critério de pronto |
|---|---|---|
| **0 — Alinhamento (1 sem.)** | Decisões da seção 2, engine, estrutura do repo, pipeline de assets, board de tarefas | Decisões registradas; "hello world" publicado na web |
| **1 — Núcleo (2 sem.)** | Movimento (teclado/toque), câmera/parallax, pulo, HUD, medidor de ansiedade | Personagem anda e pula na Fase 1; medidor muda de cor |
| **2 — Menus e identidade (1–2 sem.)** | Menu, seleção de personagem + nome, pausa, configurações (som), save local | Fluxo Menu → Fase 1 → Pausa funcionando |
| **3 — Fase 1 completa (2 sem.)** | Obstáculos, NPC/interação, respiração guiada, fim de fase, 1ª Carta | Fase 1 jogável do início ao fim |
| **4 — Zona Segura + Cartas (1–2 sem.)** | Zona Segura, transição automática, tela de Cartas, pontuação simbólica, áudio ambiente | **Fecha o MVP junto com a Fase 2** |
| **5 — Fase 2 (1–2 sem.)** | Fase 2 via JSON, balanceamento | **MVP: 2 fases + Zona Segura + cards (marco do GDD)** |
| **6 — Teste exploratório (1 sem.)** | Playtest com ~5–10 universitários, ajuste de fluxo/usabilidade | Relatório de usabilidade + lista de ajustes |
| **7 — Fases 3 e 4 (2–3 sem.)** | Conteúdos cognitivo e social, diálogos com NPCs, cartas restantes | 4 fases + Zona Segura completas |
| **8 — Avaliação e polimento (2 sem.)** | Testes estruturados (usabilidade/percepção de autoconhecimento), bugs, performance mobile, acessibilidade básica | Versão 1.0 para o artigo |
| **Pós-v1** | Áudio narrado/acessibilidade, login, relatórios a professores, recursos colaborativos da Proposta, novas fases | Backlog priorizado |

Total estimado: **~12–16 semanas** até v1.0; **MVP em ~7–9 semanas**.

## 6. Papéis sugeridos

Game dev (lógica/UI) · Artista/UI (cortes de sprites, animações do personagem — 3 personagens visíveis nas telas) · Conteúdo/psicologia (diálogos, validação clínica) · Pesquisa (protocolo de teste, ética, artigo).

## 7. Riscos e mitigação

| Risco | Mitigação |
|---|---|
| Escopo (4 fases + extras) maior que o prazo | Fases data-driven; MVP congelado em 2 fases; resto incremental |
| Arte: personagens só em pose estática | Começar com animação simples (GDD permite); priorizar idle/andar/pular |
| Build pesado/lento em celular e internet limitada | Escolha de engine leve, compressão de assets, preload por fase |
| Jogo ser lido como ferramenta clínica | Texto de aviso, linguagem não diagnóstica, revisão por psicólogo |
| Frustração do jogador com ansiedade alta | Sem game over; Zona Segura como acolhimento |
| Aprovação ética atrasar os testes | Iniciar submissão ao CEP já na Sprint 0/1 |

## 8. Próximas ações imediatas

1. Reunião de decisão: engine (Unity × Phaser/Godot), conteúdo final das fases (seção 2.1) e escopo colaborativo.
2. Criar estrutura do projeto e CI/deploy; converter o EPS da UI.
3. Fatiar a arte em camadas (personagem, fundo, HUD) e definir as animações mínimas.
4. Redigir roteiro de diálogos/NPCs da Fase 1 e passar para validação psicológica.
5. Iniciar o protocolo de ética/testes.
