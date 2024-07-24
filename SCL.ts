/**
 * @author dream93
 * @description 框架初始化
 */

import { Canvas, director, Layers, Node, sys, UITransform, v3, view, Widget } from "cc";
import { PopupManager } from "./popup/manager/PopupManager";

export let rootNode: Node = null!;

export class SCL {


    static init() {
        if (null != rootNode) {
            console.warn('已经初始化了');
            return;
        }
        rootNode = new Node('SCL');
        rootNode.layer = Layers.Enum.UI_2D;
        const widget = rootNode.addComponent(Widget);
        // widgetManager.AlignFlags.TOP | widgetManager.AlignFlags.BOT | widgetManager.AlignFlags.LEFT | widgetManager.AlignFlags.RIGHT;
        widget.alignFlags = 1 | 4 | 8 | 32;
        widget.top = widget.bottom = widget.left = widget.right = 0;
        widget.alignMode = Widget.AlignMode.ON_WINDOW_RESIZE;
        director.getScene()?.addChild(rootNode);
        director.addPersistRootNode(rootNode);

        // 自定义zIndex
        Object.defineProperty(Node.prototype, 'zIndex', {
            set(zIndex: number) {
                this._zIndex = zIndex;
                let self = this as Node;
                if (self.parent) {
                    // 排序
                    const children = self.parent.children;
                    let siblingIndex = 0;
                    for (let i = children.length - 1; i >= 0; i--) {
                        if (children[i] === self) {
                            continue;
                        }
                        if (zIndex >= children[i].zIndex) {
                            siblingIndex = children[i].getSiblingIndex() + 1;
                            break;
                        }
                    }
                    self.setSiblingIndex(siblingIndex);
                }
            },
            get(): number {
                return this._zIndex || 0;
            },
            configurable: true
        });

        // 初始化弹框管理器
        PopupManager.instance.init();
    }
}

(function () {
    window.scl = window.scl || {};
    if (!scl.login) {
        scl.login = function (res) {
            res.success && res.success({ code: 'test', pf: 'device' });
            res.complete && res.complete();
        }
    }

})();
