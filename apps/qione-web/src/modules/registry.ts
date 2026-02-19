import QiHome from "./qihome";
export type ModuleKey = "qihome" | "qione_admin";

export type ModuleDef = {
    key: ModuleKey;
    name: string;
    basePath: string; // /m/qihome
    Component: React.ComponentType;
};

export const MODULES: Record<ModuleKey, ModuleDef> = {
    qihome: { key: "qihome", name: "QiHome", basePath: "/m/qihome", Component: QiHome },
    qione_admin: {
        key: "qione_admin",
        name: "QiOne Admin",
        basePath: "/t/:tenantId/settings",
        Component: () => null // stub for now
    },
};
