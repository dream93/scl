/**
 *
 * @file EventManager.ts
 * @author dream
 * @description 全局分发管理
 *
 */
import { EventTarget } from "cc";

export class EventManager {
    private static _instance: EventTarget;
    public static get instance() {
        if (null == this._instance) {
            this._instance = new EventTarget();
        }
        return this._instance;
    }

}
