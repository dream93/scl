declare module "cc" {
    interface Node {
        zIndex: number;
    }
}

declare module scl {
    export function login(object: { success: (res: { pf: string, code: string }) => void, fail?: (err: any) => void, complete?: Function }): void;
}