import { Canvas, director, game, Layers, Node, UITransform, v3, view } from "cc";
import { PopupManager } from "./popup/manager/PopupManager";

/**
 * Predefined variables
 * Name = SCL
 * DateTime = Thu Jan 13 2022 21:45:07 GMT+0800 (中国标准时间)
 * Author = dream93
 * FileBasename = SCL.ts
 * FileBasenameNoExtension = SCL
 * URL = db://assets/libs/SCL.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 * 框架初始类
 */

export let rootNode: Node = null;

export class SCL {


    static init() {
        if (null != rootNode) {
            console.warn('已经初始化了');
            return;
        }
        rootNode = new Node('Root');
        rootNode.layer = Layers.Enum.UI_2D;
        rootNode.addComponent(Canvas);
        // Canvas组件依赖UITransform，所以不用额外添加UITransform组件
        // 如果再次添加，会产生两个UITransform组件
        // 相关讨论 https://forum.cocos.org/t/topic/127107
        let transform = rootNode.getComponent(UITransform);
        director.getScene()?.addChild(rootNode);
        game.addPersistRootNode(rootNode);
        let size = view.getVisibleSize();

        transform.contentSize = size;
        rootNode.position = v3(size.width / 2, size.height / 2, 0);

        // 自定义zIndex
        Object.defineProperty(Node, 'zIndex', {
            set(zIndex: number) {
                this._zIndex = zIndex;
                let self = this as Node;
                if (self.parent) {
                    // 排序
                    for (let i = self.parent.children.length - 1; i >= 0; i--) {
                        if (zIndex >= self.parent.children[i].zIndex) {
                            self.setSiblingIndex(self.parent.children[i].getSiblingIndex());
                        }
                    }
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
