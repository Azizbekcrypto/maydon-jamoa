// Pro holati (13-Modul 4-dars): pro_gacha hozirdan keyin bo'lsa — Pro bor. Muddat tugasa Pro o'zi to'xtaydi.
export function proBormi(proGacha: Date | null | undefined, hozir = new Date()): boolean {
  return !!proGacha && proGacha.getTime() > hozir.getTime();
}
