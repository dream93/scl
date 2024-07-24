declare module "cc" {
    export interface Node {
        zIndex: number;
    }
}

declare namespace scl {
    export function login(object: { success: (res: { pf: string, code: string }) => void, fail?: (err: any) => void, complete?: Function }): void;
}