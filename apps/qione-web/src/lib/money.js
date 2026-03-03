export function cents(n) {
    return Math.round(n * 100);
}
export function dollars(c) {
    const sign = c < 0 ? "-" : "";
    const abs = Math.abs(c);
    return `${sign}$${(abs / 100).toFixed(2)}`;
}
