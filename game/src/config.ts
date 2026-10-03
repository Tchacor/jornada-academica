export const W = 1920;
export const H = 1080;
export const GROUND_Y = 925;

export const COLORS = {
  brownDark: 0x5a2d0c,
  brown: 0x8b4513,
  brownLight: 0xa8672a,
  outline: 0x3b1d08,
  cream: 0xf3e5d0,
  creamHud: 0xeadfcc,
  beige: 0xdeb887,
  green: 0x8dc21f,
  yellow: 0xfdbc10,
  red: 0xe8192c,
} as const;

export const HEX = {
  brownDark: '#5a2d0c',
  brown: '#8b4513',
  cream: '#f3e5d0',
  beige: '#deb887',
  outline: '#3b1d08',
} as const;

export const FONT = "'Trebuchet MS', 'Segoe UI', system-ui, sans-serif";

export const DISCLAIMER =
  'Este jogo é educativo e não faz diagnóstico nem substitui atendimento profissional. ' +
  'Se precisar de ajuda, procure o apoio da sua universidade ou ligue 188 (CVV).';

export const CHARACTERS = [
  { id: 1, nome: 'Estudante 1', key: 'char-1' },
  { id: 2, nome: 'Estudante 2', key: 'char-2' },
  { id: 3, nome: 'Estudante 3', key: 'char-3' },
] as const;
