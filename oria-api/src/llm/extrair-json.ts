/** Modelos às vezes cercam o JSON em ```json ... ```` mesmo quando instruídos a não fazer isso. */
export function extrairJson(texto: string): unknown {
  const limpo = texto
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '');
  return JSON.parse(limpo);
}
