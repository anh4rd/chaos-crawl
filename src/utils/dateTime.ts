export const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export function timePlus(time: string, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m + minutes);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
