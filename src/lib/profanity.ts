// Mesma lista do banco (016_feed.sql). O banco é quem manda; aqui é só pra
// avisar antes de enviar.
const WORDS = [
  "pora", "porra", "caralho", "carai", "caraio", "krl", "puta", "puto", "putaria", "pqp", "fdp", "vsf", "tnc", "vtnc",
  "merda", "bosta", "buceta", "boceta", "cu", "cuzao", "foda", "foder", "fodase", "fudido", "punheta", "viado", "veado",
  "bicha", "sapatao", "traveco", "arombado", "desgracado", "desgracada", "vagabundo", "vagabunda", "piranha", "vadia",
  "otario", "otaria", "babaca", "escroto", "escrota", "corno", "retardado", "retardada", "mongoloide", "imbecil",
  "cretino", "cretina", "macaca", "macaco imundo", "nazista",
];

export function normalizeText(t: string) {
  const from = "áàâãäéèêëíìîïóòôõöúùûüç013457@$";
  const to = "aaaaaeeeeiiiiooooouuuucoieastas";
  let out = "";
  for (const ch of t.toLowerCase()) {
    const i = from.indexOf(ch);
    out += i >= 0 ? to[i] : ch;
  }
  return out.replace(/(.)\1+/g, "$1");
}

const RE = new RegExp(`(^|[^a-z0-9])(${WORDS.join("|")})(?![a-z0-9])`);

export function hasProfanity(t: string) {
  return RE.test(normalizeText(t));
}
