import { Canvas, director, game, Layers, Node, UITransform, v3, view } from "cc";
import { PopupManager } from "./popup/manager/PopupManager";

export class App {

    private static _instance: App | null = null;
    public static get instance() {
        if (null == this._instance) {
            this._instance = new App();
        }
        return this._instance;
    }

    private _root: Node = null!;
    get root() {
        if (null == this._root) {
            this.init();
        }
        return this._root;
    }

    init() {
        if (null != this._root) {
            console.warn('已经初始化了');
            return;
        }
        this._root = new Node('Root');
        this._root.layer = Layers.Enum.UI_2D;
        this._root.addComponent(Canvas);
        director.getScene()?.addChild(this._root);
        game.addPersistRootNode(this._root);
        let size = view.getVisibleSize();
        let transform = this._root.addComponent(UITransform);
        transform.contentSize = size;
        this._root.position = v3(size.width / 2, size.height / 2, 0);

        PopupManager.instance.init();
    }

}
