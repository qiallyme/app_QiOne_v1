export function allows(level, min) {
    const map = { none: 0, read: 1, write: 2, admin: 3 };
    return map[level] >= map[min];
}
