/**
 *
 * @file Toast.ts
 * @author dream
 * @description 模拟安卓吐司效果
 *
 */

import { BlockInputEvents, Canvas, color, director, ImageAsset, Label, Layers, Node, Sprite, SpriteFrame, Texture2D, tween, UIOpacity, UITransform, v3, view } from "cc";

/**
 * 位置
 */
export enum Gravity {

    BOTTOM,

}

export class Toast {

    static readonly LENGTH_SHORT: number = 2; // 短时间吐司
    static readonly LENGTH_LONG: number = 3.5; // 长时间吐司

    private static pNode: Node | null = null;


    private node: Node;
    private _text: string = '';
    /**
     * 文字
     */
    get text() {
        return this._text;
    }
    set text(text: string) {
        this._text = text;
        this.setText();
    }
    /**
     * 时间
     */
    private _time: number = 1;
    get time() {
        return this._time;
    }
    set time(time: number) {
        this._time = time;
    }

    /**
     * 字体大小
     */
    private _textSize: number = 20;
    get textSize() {
        return this._textSize;
    }
    set textSize(size: number) {
        this._textSize = size;
        this.setTextSize();
    }

    /**
     * 位置
     */
    private _gravity: Gravity = Gravity.BOTTOM;
    get gravity() {
        return this._gravity;
    }
    set gravity(gravity: Gravity) {
        this._gravity = gravity;
    }

    private bgNode: Node;
    private textNode: Node;

    private constructor(node: Node | null) {
        if (null == node) {
            this.node = this.getPNode();
        } else {
            this.node = node;
        }

        this.bgNode = new Node();
        this.bgNode.layer = Layers.Enum.UI_2D;
        this.bgNode.addComponent(BlockInputEvents);
        let sprite = this.bgNode.addComponent(Sprite);
        sprite.type = Sprite.Type.SLICED;
        let imageObj = new Image();
        imageObj.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAA1BMVEX///+nxBvIAAAACklEQVQI12MAAgAABAABINItbwAAAABJRU5ErkJggg==";
        let textureObj = new Texture2D();
        textureObj.image = new ImageAsset(imageObj);
        let sf = new SpriteFrame();
        sf.texture = textureObj;
        sprite.spriteFrame = sf;
        sprite.color = color(0, 0, 0, 200);
        this.bgNode.active = false;

        this.textNode = new Node('Text');
        this.textNode.layer = Layers.Enum.UI_2D;
        let uiTransform = this.textNode.addComponent(UITransform);
        uiTransform.width = this.node.getComponent(UITransform)!.width;
        let label = this.textNode.addComponent(Label);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        this.textSize = 20;
        this.textNode.parent = this.bgNode;

        this.bgNode.parent = this.node;
    }

    /**
     * 生成吐司
     * @param node  
     * @param text 
     * @param time 
     * @returns 
     */
    static makeText(node: Node | null, text: string, time: number) {
        let toast = new Toast(node);
        toast.text = text;
        toast.time = time;
        return toast;
    }

    /**
     * 显示吐司
     */
    show() {
        this.setOverFlow();
        this.bgNode.active = true;
        let uiOpacity = this.bgNode.getComponent(UIOpacity);
        if (null == uiOpacity) {
            uiOpacity = this.bgNode.addComponent(UIOpacity);
        }
        tween(uiOpacity)
            .delay(this.time)
            .to(0.3, { opacity: 0 })
            .call(() => {
                this.bgNode.destroy();
            })
            .start();
    }

    private setText() {
        let label = this.textNode.getComponent(Label)!;
        label.string = this.text;
    }

    private setTextSize() {
        let label = this.textNode.getComponent(Label)!;
        label.fontSize = this.textSize;
    }

    private setGravity() {
        let uiTransform = this.node.getComponent(UITransform)!;
        let bgUITransform = this.bgNode.getComponent(UITransform)!;
        if (Gravity.BOTTOM === this.gravity) {
            let y = -uiTransform.height / 2 + bgUITransform.height / 2 + 64;
            this.bgNode.position = v3(0, y, 0);
        }
    }

    private setOverFlow() {
        let maxLength = this.node.getComponent(UITransform)!.width / 2;
        let label = this.textNode.getComponent(Label)!;
        let fontLength = this.text.length * label.fontSize;
        let uiTransform = this.textNode.getComponent(UITransform)!;
        if (fontLength > maxLength) {
            uiTransform.width = maxLength;
            label.overflow = Label.Overflow.RESIZE_HEIGHT;
        } else {
            uiTransform.width = fontLength;
            label.overflow = Label.Overflow.NONE;
        }
        let bgUITransform = this.bgNode.getComponent(UITransform)!;
        bgUITransform.width = uiTransform.width + label.fontSize * 4;
        bgUITransform.height = uiTransform.height;
        this.setGravity();
    }

    private getPNode(): Node {
        if (null == Toast.pNode || !Toast.pNode.isValid) {
            Toast.pNode = new Node('Toast');
            let transform = Toast.pNode.addComponent(UITransform);
            Toast.pNode.layer = Layers.Enum.UI_2D;
            Toast.pNode.addComponent(Canvas);
            director.getScene()?.addChild(Toast.pNode);
            let size = view.getVisibleSize();
            transform.contentSize = size;
            transform.width = size.width;
            transform.height = size.height;
            Toast.pNode.position = v3(size.width / 2, size.height / 2, 0);
        }
        return Toast.pNode;
    }

}