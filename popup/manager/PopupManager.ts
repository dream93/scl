/**
 * @author dream93
 * @description 弹框基类
 *              弹框展示逻辑
 *              1. 优先级高的先展示
 *              2. 同优先级后来的先展示
 */

import { BlockInputEvents, instantiate, Layers, Node, path, Prefab, UITransform, Vec3 } from "cc";
import { PopupBase } from "../base/PopupBase";
import { ResUtil } from "../../util/ResUtil";
import { rootNode } from "../../SCL";

type PopupShowOption = {
    bundleName?: string,
    name?: string,
    prefab?: Prefab,
    path?: string,
    priority?: number,
    params?: any,
    closePosition?: Vec3,
    keep?: boolean
}

export enum PopupCacheMode {
    ONCE, // 销毁预制体及实例
    CACHE, // 保留预制体，销毁实例
    AWAY // 保留预制体及实例
}

export class PopupManager {

    private static _instance: PopupManager;
    public static get instance() {
        if (null == this._instance) {
            this._instance = new PopupManager();
        }
        return this._instance;
    }

    private _init = false;
    private _popupNode: Node = null!;
    private _blockInputNode: Node = null!;
    private _showOptions: PopupShowOption[] = [];
    private _curOption: PopupShowOption | null = null;
    private _cacheNodeMap: { [key: string]: Node | null } = {};
    private _cachePrefabMap: { [key: string]: Prefab | null } = {};
    private _popups: string[] = [];
    get popups() {
        return this._popups;
    }

    /**
     * @description 弹框初始化
     *              框架内已处理
     */
    init() {
        this.initParent();
    }

    /**
     * @description 展示弹框
     * @param option 弹框参数
     */
    show(option: PopupShowOption) {
        if (!this._init) {
            throw new Error('请先初始化PopupManager');
        }
        // 处理名字
        const name = option.name = option.name || option.prefab?.data?.name || option.path && path.basename(option.path);
        if (!name) {
            throw new Error('name、prefab、path不能同时为空');
        }
        // 处理层级
        const priority = option.priority = option.priority || 0;
        const length = this._showOptions.length;
        let priorityMax = true;
        let repeat = false;
        for (let i = length - 1; i >= 0; i--) {
            const option = this._showOptions[i];
            if (priority < option.priority!) {
                priorityMax = false;
            }
            if (option.name === name) {
                repeat = true;
            }
        }
        // 剔重
        if (this.has(name) || repeat) {
            console.warn(`弹框${name}已被展示`);
            return;
        }
        if (priorityMax) {
            this._curOption = option;
        }
        this._showOptions.push(option);
        this.dealShow(option);
    }

    /**
     * @description 移除弹框
     * @param name 弹框名
     * @param mode 销毁模式
     * @param anim 是否展示隐藏动画
     */
    remove(name: string, mode = PopupCacheMode.ONCE, anim = true) {
        const idx = this._popups.indexOf(name);
        let isLast = idx === this._popups.length - 1;
        if (idx >= 0) {
            this._popups.splice(idx, 1);
        }
        this.hidePopup(name, mode, anim);
        if (isLast) {
            this.showLast();
        }
    }

    /**
     * @description 移除所有弹框
     * @param mode 销毁模式
     * @param anim 是否展示动画
     */
    removeAll(mode = PopupCacheMode.ONCE, anim = false) {
        const lastName = this.getCurrentName();
        for (let name in this._cacheNodeMap) {
            if (null == this._cacheNodeMap[name]) {
                continue;
            }
            if (lastName !== name) {
                const idx = this._popups.indexOf(name);
                if (idx !== -1) {
                    this._popups.splice(idx, 1);
                }
                this.hidePopup(name, mode, false);
            }
        }
        if (lastName) {
            this.remove(lastName, mode, anim);
        }
        this.cleanAllPopup();
    }

    /**
     * @description 获取当前的弹框名
     * @returns 弹框名
     */
    getCurrentName(): string | null {
        if (this._popups.length > 0) {
            return this._popups[this._popups.length - 1];
        }
        return null;
    }

    /**
     * @description 是否存在某个弹框
     * @param name 弹框名
     * @returns 
     */
    has(name: string): boolean {
        return this._popups.indexOf(name) !== -1;
    }

    /**
     * @description 获取当前的弹框
     * @returns 
     */
    getCurrentPopup(): Node | null {
        return this.getPopup(this.getCurrentName());
    }

    /**
     * @description 获取指定弹框
     * @param name 弹框名 
     * @returns 
     */
    getPopup(name: string | null): Node | null {
        if (null == name) {
            return null;
        }
        return this._cacheNodeMap[name] || null;
    }

    private async dealShow(option: PopupShowOption) {
        //  弹框过程中，背景不可以点击
        this._blockInputNode!.active = true;
        const { name = '', path = '' } = option;
        let node = this._cacheNodeMap[name];
        if (!node) {
            let prefab = option.prefab || this._cachePrefabMap[name];
            if (!prefab) {
                prefab = await ResUtil.loadAsset({ bundleName: option.bundleName, path, type: Prefab }).catch((e) => {
                    console.error(e);
                }) as Prefab;
                if (!prefab) {
                    this.completeOption(option);
                    throw new Error('动态加载的Prefab路径错误,bundleName=' + option.bundleName + ', path=' + path);
                }
                // 再次判断异步情况
                if (this.has(name)) {
                    console.warn(`弹框${name}已被展示`);
                    this.completeOption(option);
                    return;
                }
                if (this._showOptions.indexOf(option) === -1) { // 当前的已被销毁
                    // 此处的prefab并没有回收，一般而言影响不大
                    return;
                }
                prefab.addRef();
                this._cachePrefabMap[name] = prefab;
            }
            node = instantiate(prefab);
            this._cacheNodeMap[name] = node;
        }
        this.dealPopup(node!, option);
    }

    private async dealPopup(node: Node, option: PopupShowOption) {
        const popup = node.getComponent(PopupBase);
        if (null == popup) {
            this.completeOption(option);
            throw new Error('请将Popup继承PopupBase');
        }
        const { name = '', closePosition, priority = 0, keep, params } = option;
        let idx = 0;
        const length = this._popups.length;
        for (let i = length - 1; i >= 0; i--) {
            const popupNode = this._cacheNodeMap[this._popups[i]]
            if (priority >= popupNode!.zIndex) {
                idx = i + 1;
            }
        }
        this._popups.splice(idx, 0, name);
        if (node.parent != this._popupNode) {
            node.removeFromParent();
            node.parent = this._popupNode;
        }
        if (node.zIndex != priority) {
            node.zIndex = priority;
        }
        popup._init(name, params);
        if (idx === length && this._curOption === option) {
            // 显示
            if (!keep) {
                for (let i = 0; i < length; i++) {
                    const tempNode = this._cacheNodeMap[this._popups[i]];
                    // @ts-ignore
                    if (tempNode && !tempNode.getComponent(PopupBase).keepPopup) {
                        tempNode.active = false;
                    }
                }
                this.showPopup(popup, option);
            }
            return;
        }
        node.active = false;
        this.completeOption(option);
    }

    private showPopup(popup: PopupBase, option: PopupShowOption) {
        popup._show().then(() => {
            this.completeOption(option);
        });
    }

    private completeOption(option: PopupShowOption) {
        const idx = this._showOptions.indexOf(option);
        if (idx !== -1) {
            this._showOptions.splice(idx, 1);
            if (this._showOptions.length === 0) {
                this._blockInputNode.active = false;
            }
        }
        if (this._curOption === option) {
            this.showLast();
        }
    }

    private hidePopup(name: string, mode = PopupCacheMode.ONCE, anim = true) {
        const node = this._cacheNodeMap[name];
        if (null == node) {
            console.warn(`${name}已被销毁`);
            return;
        }
        if (mode != PopupCacheMode.AWAY) {
            this._cacheNodeMap[name] = null;
        }
        const prefab = this._cachePrefabMap[name]!;
        if (mode === PopupCacheMode.ONCE) {
            this._cachePrefabMap[name] = null;
        }
        const popup = node.getComponent(PopupBase);
        if (!node.active) {
            this.removeNode(node, prefab, mode);
        } else {
            popup!._hide();
            this.removeNode(node, prefab, mode);
        }
    }

    private removeNode(node: Node, prefab: Prefab, mode: PopupCacheMode) {
        if (PopupCacheMode.AWAY === mode) {
            if (null != node) {
                node.parent = null;
            }
            return;
        }
        node.destroy();
        if (PopupCacheMode.ONCE === mode && prefab) {
            prefab.decRef();
        }
    }

    private showLast() {
        let node: Node | null = null;
        if (this._popups.length > 0) {
            const name = this._popups[this._popups.length - 1];
            node = this._cacheNodeMap[name];
        }
        if (null == node) {
            return;
        }
        if (!node.active) {
            node.active = true;
            const popup = node.getComponent(PopupBase)!;
            if (!popup._isShow) {
                popup._show();
            }
        }
    }

    private cleanAllPopup() {
        this._popups.length = 0;
        this._showOptions.length = 0;
        this._blockInputNode!.active = false;
    }

    private initParent() {
        const rootTransform = rootNode.getComponent(UITransform)!;
        const popupNode = this._popupNode = new Node('PopupNode');
        popupNode.layer = Layers.Enum.UI_2D;
        popupNode.addComponent(UITransform)?.setContentSize(rootTransform.contentSize);
        popupNode.parent = rootNode;
        popupNode.zIndex = 2;

        // 实现弹框过程中，背景不可以点击
        const blockInputNode = this._blockInputNode = new Node('BlockInputNode');
        blockInputNode.addComponent(BlockInputEvents);
        blockInputNode.addComponent(UITransform)?.setContentSize(rootTransform.contentSize);
        blockInputNode.parent = this._popupNode;
        blockInputNode.zIndex = -1;
        blockInputNode.active = false;

        this._init = true;

    }
}
