export type AccessLevel = "none" | "read" | "write" | "admin";

export function allows(level: AccessLevel, min: Exclude<AccessLevel, "none">): boolean {
    const map: Record<AccessLevel, number> = { none: 0, read: 1, write: 2, admin: 3 };
    return map[level] >= map[min];
}
