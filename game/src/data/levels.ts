import { W } from '../config';

export type NpcSprite = 'npc-colega' | 'npc-professor' | 'npc-orientadora';

export interface Choice {
  text: string;
  delta: number; // variação no medidor (negativo = acalma)
  healthy: boolean;
  feedback: string;
}

export interface NpcDef {
  x: number;
  sprite: NpcSprite;
  name: string;
  line: string; // aceita {nome}
  choices: Choice[];
}

export interface SpotDef {
  x: number;
  label: string;
  delta: number;
  message: string;
}

export interface StressZone {
  from: number;
  to: number;
  label: string;
}

export interface LevelDef {
  id: number;
  title: string;
  focus: string;
  intro: string;
  bg: string;
  screens: number;
  startAnxiety: number;
  clouds: number[];
  thoughts: { negative: string; reframe: string }[];
  stress: StressZone[];
  npcs: NpcDef[];
  spots: SpotDef[];
  ending: string;
}

export const worldWidth = (l: LevelDef): number => l.screens * W;

const PENSAMENTOS_GERAIS = [
  { negative: '“E se eu errar tudo?”', reframe: 'Errar faz parte de aprender. Um passo de cada vez.' },
  { negative: '“Todo mundo vai perceber que estou nervoso(a).”', reframe: 'Quase ninguém está reparando. Cada pessoa está cuidando de si.' },
  { negative: '“Eu não vou dar conta.”', reframe: 'Você já deu conta de muita coisa para chegar até aqui.' },
  { negative: '“Os outros são melhores que eu.”', reframe: 'Comparar-se só tira a sua atenção. Cada um tem seu ritmo.' },
];

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: 'Fase 1 · Início da Jornada',
    focus: 'Reconhecer os gatilhos e os pensamentos intrusivos',
    intro:
      'É o seu primeiro dia na universidade. Dá um frio na barriga, e isso é comum.\n' +
      'Pule para desviar das nuvens de pensamentos, use a respiração quando precisar e converse com as pessoas pelo botão de interagir.',
    bg: 'bg-fase1',
    screens: 3,
    startAnxiety: 62,
    clouds: [1000, 1650, 2250, 3150, 3800, 4500],
    thoughts: PENSAMENTOS_GERAIS,
    stress: [],
    npcs: [
      {
        x: 1900,
        sprite: 'npc-colega',
        name: 'Colega',
        line: 'Oi, {nome}! Também é meu primeiro dia e estou superansioso(a)… Você também sente isso?',
        choices: [
          { text: 'Também! Vamos juntos até a sala?', delta: -16, healthy: true, feedback: 'Dividir o que sentimos alivia. Você não está sozinho(a) nisso.' },
          { text: 'Prefiro ficar na minha. Vão me achar perdido(a).', delta: 8, healthy: false, feedback: 'Pensar que todos estão julgando você aumenta a tensão. Procurar alguém costuma ajudar.' },
          { text: 'Estou bem, nem ligo.', delta: 3, healthy: false, feedback: 'Tudo bem sentir nervosismo. Reconhecer o que sentimos é o primeiro passo.' },
        ],
      },
      {
        x: 3500,
        sprite: 'npc-professor',
        name: 'Professor',
        line: 'Bem-vindo(a), {nome}! Se tiver qualquer dúvida neste semestre, pode me procurar ou falar com a coordenação.',
        choices: [
          { text: 'Obrigado(a)! Vou lembrar disso.', delta: -14, healthy: true, feedback: 'Saber que há apoio disponível diminui a sensação de estar sozinho(a).' },
          { text: 'Não quero incomodar ninguém.', delta: 6, healthy: false, feedback: 'Pedir apoio não é incômodo — é uma estratégia que funciona.' },
        ],
      },
    ],
    spots: [],
    ending: 'A ansiedade acadêmica é comum — e pode ser cuidada. Você deu o primeiro passo: perceber o que sente e pedir apoio.',
  },
  {
    id: 2,
    title: 'Fase 2 · Primeira Apresentação',
    focus: 'Ansiedade no corpo: coração acelerado, mãos geladas',
    intro:
      'Hoje tem o seminário. O corpo percebe antes da cabeça: coração disparado, mãos frias.\n' +
      'Nas áreas de tensão sua ansiedade sobe sozinha. Respire fundo (botão do pulmão) e faça pausas nos bancos.',
    bg: 'bg-fase2',
    screens: 3,
    startAnxiety: 25,
    clouds: [1300, 2800, 4300],
    thoughts: PENSAMENTOS_GERAIS,
    stress: [
      { from: 1700, to: 2600, label: 'Corredor da sala · coração acelerado' },
      { from: 3700, to: 4800, label: 'Porta da apresentação · mãos geladas' },
    ],
    npcs: [
      {
        x: 3100,
        sprite: 'npc-colega',
        name: 'Colega',
        line: 'Minhas mãos estão geladas e a voz até tremeu no ensaio… Como você faz para se acalmar antes de apresentar?',
        choices: [
          { text: 'Respiro devagar umas três vezes e faço pausas na fala.', delta: -18, healthy: true, feedback: 'Respiração lenta e pausas ajudam o corpo a baixar o alarme.' },
          { text: 'Decoro tudo sem parar até a hora.', delta: 7, healthy: false, feedback: 'Repetir sem pausa costuma aumentar a tensão. Descansar também prepara.' },
          { text: 'Evito pensar nisso.', delta: 4, healthy: false, feedback: 'Fugir do pensamento costuma fazê-lo voltar mais forte. Respirar ajuda mais.' },
        ],
      },
    ],
    spots: [
      { x: 2250, label: 'Sentar no banco', delta: -10, message: 'Pausas curtas devolvem o fôlego. Sentir o apoio do banco também ajuda.' },
      { x: 4940, label: 'Beber água', delta: -8, message: 'Um gole de água devagar é uma pausa que o corpo agradece.' },
    ],
    ending: 'Respirar devagar e fazer pausas ajuda o corpo a sair do alarme. Você foi até o fim da apresentação no seu ritmo.',
  },
  {
    id: 3,
    title: 'Fase 3 · Desenvolvimento do TCC',
    focus: 'Ansiedade cognitiva: sobrecarga e pensamentos repetitivos',
    intro:
      'O TCC está pesando: prazos, dúvidas, cansaço. Os pensamentos não param.\n' +
      'Divida as tarefas, faça pausas e peça apoio. Os pensamentos negativos podem ser reformulados.',
    bg: 'bg-fase3',
    screens: 3,
    startAnxiety: 28,
    clouds: [900, 1400, 2000, 2700, 3300, 3900, 4400, 5000],
    thoughts: [
      { negative: '“Nunca vou terminar esse TCC.”', reframe: 'Divida em partes pequenas: hoje, só a próxima tarefa.' },
      { negative: '“Se eu pedir ajuda, vão achar que sou incapaz.”', reframe: 'Orientação existe justamente para isso. Pedir ajuda é inteligente.' },
      { negative: '“Preciso de tudo perfeito.”', reframe: 'Feito é melhor que perfeito. Dá para revisar depois.' },
      { negative: '“Estou ficando para trás.”', reframe: 'Cada pessoa tem seu ritmo. O seu também conta.' },
    ],
    stress: [{ from: 3600, to: 4800, label: 'Prazo de entrega · sobrecarga' }],
    npcs: [
      {
        x: 2350,
        sprite: 'npc-orientadora',
        name: 'Orientadora',
        line: '{nome}, vi que o TCC está acumulando. Como você pretende lidar com isso nesta semana?',
        choices: [
          { text: 'Dividir em tarefas pequenas e combinar um prazo para cada uma.', delta: -20, healthy: true, feedback: 'Dividir o trabalho reduz a sensação de montanha e devolve o controle.' },
          { text: 'Virar a noite escrevendo tudo de uma vez.', delta: 12, healthy: false, feedback: 'Sono curto aumenta a ansiedade. Descanso faz parte da produtividade.' },
          { text: 'Contar com a sua orientação para ajustar o plano.', delta: -14, healthy: true, feedback: 'Pedir apoio cedo evita que o peso cresça.' },
        ],
      },
      {
        x: 4100,
        sprite: 'npc-colega',
        name: 'Colega',
        line: 'Estou há horas olhando para a tela. Você também está cansado(a)?',
        choices: [
          { text: 'Vamos fazer uma pausa de 10 minutos e voltamos.', delta: -15, healthy: true, feedback: 'Pausas curtas ajudam a mente a se reorganizar.' },
          { text: 'Vou continuar sem parar. Descansar é perda de tempo.', delta: 9, healthy: false, feedback: 'Cansaço acumulado piora a concentração. Pausar também é trabalhar.' },
        ],
      },
    ],
    spots: [{ x: 3100, label: 'Pausa de 5 minutos', delta: -10, message: 'Afastar-se da tela, alongar e respirar ajuda a mente a descansar.' }],
    ending: 'Dividir tarefas, pausar e buscar apoio tornam o caminho mais leve. Pensamentos podem ser reformulados.',
  },
  {
    id: 4,
    title: 'Fase 4 · Formatura',
    focus: 'Ansiedade social e de encerramento',
    intro:
      'A reta final! Expectativa, despedidas e a sensação de ser observado(a).\n' +
      'Converse, respire e lembre: você chegou até aqui no seu ritmo.',
    bg: 'bg-fase4',
    screens: 3,
    startAnxiety: 30,
    clouds: [1000, 1700, 2500, 3300, 4800],
    thoughts: [
      { negative: '“E se eu travar na frente de todo mundo?”', reframe: 'Uma pausa não é fracasso. Respire, retome e siga.' },
      { negative: '“E depois da formatura, o que será de mim?”', reframe: 'Você não precisa saber tudo agora. Passos pequenos também levam longe.' },
      { negative: '“Vão julgar meu trabalho.”', reframe: 'Você se dedicou. O que importa é o que você aprendeu.' },
    ],
    stress: [{ from: 3700, to: 4700, label: 'Plateia · olhares' }],
    npcs: [
      {
        x: 1450,
        sprite: 'npc-colega',
        name: 'Colega',
        line: 'Ei, {nome}! Está chegando o fim. Estou entre feliz e apavorado(a). E você?',
        choices: [
          { text: 'Também! Vamos comemorar o que vencemos juntos.', delta: -16, healthy: true, feedback: 'Compartilhar sentimentos fortalece os laços e acalma.' },
          { text: 'Prefiro não falar sobre isso.', delta: 5, healthy: false, feedback: 'Está tudo bem ter limites, mas conversar com quem entende costuma aliviar.' },
        ],
      },
      {
        x: 2900,
        sprite: 'npc-professor',
        name: 'Professor',
        line: 'Parabéns pela caminhada, {nome}. Tem alguma dúvida para a apresentação final?',
        choices: [
          { text: 'Sim! Posso treinar a abertura com o senhor?', delta: -18, healthy: true, feedback: 'Ensaiar com apoio traz segurança. Perguntar é sinal de preparo.' },
          { text: 'Não, vou me virar sozinho(a).', delta: 7, healthy: false, feedback: 'Fazer sozinho(a) é possível, mas apoio costuma deixar tudo mais leve.' },
        ],
      },
      {
        x: 4300,
        sprite: 'npc-orientadora',
        name: 'Orientadora',
        line: 'Respire. Estou aqui na plateia torcendo por você. Pronto(a) para fechar essa jornada?',
        choices: [
          { text: 'Inspirar fundo, ir devagar e sorrir para quem torce por mim.', delta: -22, healthy: true, feedback: 'Respirar e olhar para quem apoia traz presença e calma.' },
          { text: 'Falar o mais rápido possível para acabar logo.', delta: 10, healthy: false, feedback: 'Pressa aumenta a ansiedade. Pausas deixam a fala mais segura.' },
        ],
      },
    ],
    spots: [],
    ending: 'Você chegou até aqui no seu próprio ritmo. A ansiedade pode aparecer de novo, e agora você conhece formas de cuidar dela.',
  },
];

export const SAFE_MESSAGES = [
  'Respire. Você está em um lugar seguro.',
  'Não há pressa. Este momento é seu.',
  'Observe o vento nas árvores e os sons ao redor.',
  'Sentir ansiedade não é fraqueza. Pausar é cuidar.',
  'Um passo de cada vez. Você está indo bem.',
];
