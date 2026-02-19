export function cents(n: number): number {
    return Math.round(n * 100);
}
export function dollars(c: number): string {
    const sign = c < 0 ? "-" : "";
    const abs = Math.abs(c);
    return `${sign}$${(abs / 100).toFixed(2)}`;
}
