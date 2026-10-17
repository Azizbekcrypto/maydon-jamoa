// kun — '2026-10-10' ko'rinishidagi sana; ekranda — kun nomi
const KUN_NOMLARI = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export function kunNomi(kun: string): string {
  return KUN_NOMLARI[new Date(`${kun}T00:00:00Z`).getUTCDay()] ?? kun;
}
