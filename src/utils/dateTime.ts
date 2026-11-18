export const today = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
};

export function timePlus(time: string, minutes: number) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !Number.isFinite(minutes))
    return "Time TBC";
  const [h, m] = time.split(":").map(Number);
  const d = new Date(2000, 0, 1, h, m + minutes);
  if (Number.isNaN(d.getTime())) return "Time TBC";
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
