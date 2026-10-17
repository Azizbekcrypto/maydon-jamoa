// kun — '2026-10-10' ko'rinishidagi sana; ekranda — kun nomi
const KUN_NOMLARI = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export function kunNomi(kun: string): string {
  return KUN_NOMLARI[new Date(`${kun}T00:00:00Z`).getUTCDay()] ?? kun;
}

function sanaMatni(d: Date): string {
  const oy = String(d.getMonth() + 1).padStart(2, '0');
  const kun = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${oy}-${kun}`;
}

// E'lon berish uchun: bugundan boshlab 7 kun — { sana: '2026-10-11', nom: 'Yakshanba' }
export function keyingiKunlar(soni = 7): { sana: string; nom: string }[] {
  const bugun = new Date();
  return Array.from({ length: soni }, (_, i) => {
    const d = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate() + i);
    const sana = sanaMatni(d);
    return { sana, nom: kunNomi(sana) };
  });
}
