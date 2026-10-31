export const TIPOS_EVENTO = [
  'abriu',
  'fechou',
  'rolou',
  'abriu_panorama',
  'gerou_fichamento',
  'editou_fichamento',
  'respondeu',
  'pediu_dica',
  'desistiu',
  'clicou_citacao',
  'registrou_metacognicao',
] as const;

export type TipoEvento = (typeof TIPOS_EVENTO)[number];
