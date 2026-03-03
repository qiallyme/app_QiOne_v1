import QiHome from "./qihome";
export const MODULES = {
    qihome: { key: "qihome", name: "QiHome", basePath: "/m/qihome", Component: QiHome },
    qione_admin: {
        key: "qione_admin",
        name: "QiOne Admin",
        basePath: "/t/:tenantId/settings",
        Component: () => null // stub for now
    },
};
