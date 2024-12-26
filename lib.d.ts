/**
 * 自定义错误信息
 */
type CustomError = {
    /**
     * 错误码
     */
    errCode: number;
    /**
     * 错误信息
     */
    errMsg: string;
}

type FailFunction = (err: CustomError) => void;

declare namespace scl {
    export function login(object: { success: (res: { pf: string, code: string }) => void, fail?: (err: any) => void, complete?: Function }): void;
}

declare module "cc" {
    export interface Node {
        zIndex: number;
    }
}