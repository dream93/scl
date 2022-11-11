/**
 *
 * @file PopupManager.ts
 * @author dream
 * @description 弹框管理类
 *
 */

import { BlockInputEvents, instantiate, Layers, Node, Prefab, UITransform, view } from "cc";
import { rootNode } from "../../SCL";
import { CCUtil } from "../../util/CCUtil";
import { PopupBase } from "../base/PopupBase";

export class PopupManager {

    private static _instance: PopupManager;
    public static get instance() {
        if (null == this._instance) {
            this._instance = new PopupManager();
        }
        return this._instance;
    }

    private popupNode: Node | null = null;
    private blockInputNode: Node | null = null;
    private popups: Array<string>;
    private nodes: Map<string, Node>;
    private paths: Map<string, string>;
    private popupInit: boolean = false;

    private constructor() {
        this.popups = new Array();
        this.nodes = new Map();
        this.paths = new Map();
    }

    /**
     * 初始化
     * 主要实例化父节点
     */
    init() {
        this.setParent();
    }

    /**
     * 预加载Prefab，提前实例化
     * @param option  {name: 自定义名字 prafab: Prefab url: 动态加载的prefab的名字}
     * @returns 
     */
    preLoad(option: { name?: string, prefab?: Prefab, url?: string }) {
        let name = option.name || option.prefab?.data._name || this.getNameByPath(option.url);
        if (null != name && null != this.nodes.get(name)) {
            console.warn(`${name}已经预加载了`);
            return;
        }
        if (null != option.prefab) {
            let node = instantiate(option.prefab);
            this.nodes.set(name, node);
            return;
        }
        if (null != option.url) {
            CCUtil.loadAsset({
                paths: option.url,
                type: Prefab
            }).then((prefab) => {
                this.setNameByPath(option.url!, prefab.data._name);
                if (null == name) {
                    name = prefab.data._name;
                }
                let node = instantiate(prefab);
                this.nodes.set(name, node);
            }).catch((err) => {
                console.error(`${option.url}加载失败`);
            });
        }
    }

    /**
     * 显示弹框
     * @param option {name:自定义弹框名字 prefab:Prefab path: 动态加载的路径 siblingIndex:层级 params: 传递参数 keep: 正在显示的弹框是否保留}
     */
    show(option: { name?: string, prefab?: Prefab, path?: string, siblingIndex?: number, params?: any, keep?: boolean }) {
        if (!this.popupInit) {
            throw new Error('请先初始化UIManager');
        }
        // 如果需要一个prefab对应两个弹框，则名字需要自行定义
        let name = option.name || option.prefab?.data._name || this.getNameByPath(option.path);
        if (null == name && null == option.path) {
            throw new Error('name、prefab、path不同同时为空');
        }

        // 当前弹框不重复显示
        if (name === this.getCurrentName()) {
            console.warn('当前界面已经展示');
            return;
        }

        // 弹框过程中，背景不可以点击
        this.blockInputNode!.active = true;
        let siblingIndex = option.siblingIndex || 0;
        let node: Node | undefined;
        if (null != name) {
            node = this.nodes.get(name);
        }
        if (null == node) {
            if (null == option.prefab) {
                if (null == option.path) {
                    this.blockInputNode!.active = false;
                    throw new Error('首次创建必须传入prefab或者path');
                }
                CCUtil.loadAsset({
                    paths: option.path,
                    type: Prefab
                }).then((prefab: Prefab) => {
                    this.setNameByPath(option.path!, prefab.data._name);
                    if (null == name) {
                        name = prefab.data._name;
                    }
                    node = instantiate(prefab);
                    this.nodes.set(name, node);
                    this._show(name, node, siblingIndex, option.params, option.keep || false);
                }).catch((err) => {
                    console.error(`${option.path}加载失败`);
                    this.blockInputNode!.active = false;
                });
                return;
            }
            node = instantiate(option.prefab);
            this.nodes.set(name, node);
            this._show(name, node, siblingIndex, option.params, option.keep || false);
        } else {
            this._show(name, node, siblingIndex, option.params, option.keep || false);
        }
    }

    private _show(name: string, node: Node, zIndex: number, params: any, keep: boolean) {
        // 先从缓存中取出
        let idx = this.popups.indexOf(name);
        if (idx >= 0) {
            this.popups.splice(idx, 1);
        }

        // 层级高的优先显示
        let curZIndex = this.getCurrentPopup()?.zIndex || 0;
        if (zIndex < curZIndex) {
            node.active = false;
            for (let i = 0; i <= this.popups.length - 1; i++) {
                let tempNode = this.nodes.get(this.popups[i]);
                if (zIndex <= (tempNode!.zIndex || 0)) {
                    this.popups.splice(i, 0, name);
                    break;
                }
            }
        } else if (!keep) {
            this._hideAll();
            this.popups.push(name);
        }
        let popup = node.getComponent(PopupBase);
        if (null == popup) {
            this.blockInputNode!.active = false;
            throw new Error('请将Popup继承PopupBase');
        }
        popup._init(name, params);
        if (node.parent == this.popupNode) {
            node.parent = null;
        }
        node.parent = this.popupNode;
        if (node.zIndex != zIndex) {
            node.zIndex = zIndex;
        }
        if (zIndex >= curZIndex) {
            popup!._show().then(() => {
                this.blockInputNode!.active = false;
            });
        } else {
            this.blockInputNode!.active = false;
        }
    }

    private showLast() {
        let node: Node | null = null;
        if (this.popups.length > 0) {
            let name = this.popups[this.popups.length - 1];
            node = this.nodes.get(name) || null;
        }
        if (null == node) {
            return;
        }
        if (!node.active) {
            this.blockInputNode!.active = true;
            let ui = node.getComponent(PopupBase)!;
            ui._show().then(() => {
                this.blockInputNode!.active = false;
            });
        }
    }

    /**
     * 隐藏弹框
     * @param name 弹框的名字
     */
    hide(name: string) {
        let idx = this.popups.indexOf(name);
        let isLast = idx === this.popups.length - 1;
        if (idx >= 0) {
            this.popups.splice(idx, 1);
        }
        this._hideUI(name);
        if (isLast) {
            this.showLast();
        }
    }

    /**
     * 隐藏所有弹框
     */
    hideAll() {
        this._hideAll();
        this.popups.length = 0;
    }

    _hideAll() {
        for (let i = 0; i < this.popups.length; i++) {
            this._hideUI(this.popups[i]);
        }
    }

    private _hideUI(name: string) {
        let node = this.nodes.get(name);
        if (null == node) {
            console.warn(`${name}已被销毁`);
            return;
        }
        let ui = node.getComponent(PopupBase);
        ui!._hide();
    }

    /**
     * 移除弹框
     * @param name 弹框名字 
     * @returns 
     */
    remove(name: string) {
        this.hide(name);
        let node = this.nodes.get(name);
        if (null == node) {
            return;
        }
        this.nodes.delete(name);
        let ui = node.getComponent(PopupBase);
        ui!._remove();
    }

    /**
     * 移除弹框
     */
    removeAll() {
        this.hideAll();
        for (let name in this.nodes) {
            this.remove(name);
        }
    }

    /**
     * 获取当前弹框
     * @returns 弹框Node，如果当前没有弹框，返回null
     */
    getCurrentPopup(): Node | null {
        let name = this.getCurrentName();
        if (null == name) {
            return null;
        }
        return this.nodes.get(name) || null;
    }

    /**
     * 获取当前弹框的名字
     * @returns 弹框名字，如果当前没有弹框，则返回null
     */
    getCurrentName(): string | null {
        if (this.popups.length > 0) {
            return this.popups[this.popups.length - 1];
        }
        return null;
    }

    /**
     * 根据弹框名，获取弹框Node
     * @param name 弹框名
     * @returns 弹框Node,如果没有对应的弹框，则返回null
     */
    getPopup(name: string): Node | null {
        return this.nodes.get(name) || null;
    }

    private setNameByPath(path: string, name: string) {
        if (null == this.getNameByPath(path)) {
            this.paths.set(path, name);
        }
    }

    private getNameByPath(path: string | null | undefined): string | null | undefined {
        if (null == path) {
            return null;
        }
        return this.paths.get(path);
    }


    private setParent() {
        if (this.popupInit) {
            throw new Error('PopupManager已经初始化了');
        }
        this.popupNode = new Node('Popup');
        this.popupNode.layer = Layers.Enum.UI_2D;
        rootNode.addChild(this.popupNode);
        let size = view.getVisibleSize();
        let transform = this.popupNode.addComponent(UITransform);
        transform.contentSize = size;
        this.popupInit = true;

        this.blockInputNode = new Node('blockInputNode');
        this.blockInputNode.addComponent(BlockInputEvents);
        this.blockInputNode.parent = this.popupNode;
        this.blockInputNode.zIndex = 0;
        let blockInputTransform = this.blockInputNode.addComponent(UITransform);
        blockInputTransform.contentSize = size;
        this.blockInputNode!.active = false;

    }
}

