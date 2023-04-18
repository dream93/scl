/**
 * @author dream93
 * @description 模拟安卓吐司效果
 *
 */

import { BlockInputEvents, color, ImageAsset, Label, Layers, Node, Sprite, SpriteFrame, Texture2D, tween, UIOpacity, UITransform, v3, view } from "cc";
import { rootNode } from "../SCL";

/**
 * 位置
 */
export enum Gravity {

    BOTTOM,

}



const imageObj = new Image();
imageObj.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAACAQMAAABIeJ9nAAAAA1BMVEX///+nxBvIAAAACklEQVQI12MAAgAABAABINItbwAAAABJRU5ErkJggg==";
const imageAsset = new ImageAsset(imageObj);


export class Toast {

    static readonly LENGTH_SHORT = 2; // 短时间吐司
    static readonly LENGTH_LONG = 3.5; // 长时间吐司

    private static pNode: Node | null = null;
    private _bgNode: Node = null!;
    private _textNode: Node = null!;

    private _node: Node = null!;
    private _text = '';
    private _time = 0;
    private _textSize = 18;
    private _gravity = Gravity.BOTTOM;

    private constructor(node: Node | null) {
        if (null == node) {
            this._node = this.getPNode();
        } else {
            this._node = node;
        }

        this._bgNode = new Node();
        this._bgNode.layer = Layers.Enum.UI_2D;
        this._bgNode.addComponent(BlockInputEvents);
        const sprite = this._bgNode.addComponent(Sprite);
        sprite.type = Sprite.Type.SLICED;
        const textureObj = new Texture2D();
        textureObj.image = imageAsset;
        const sf = new SpriteFrame();
        sf.texture = textureObj;
        sprite.spriteFrame = sf;
        sprite.color = color(0, 0, 0, 200);
        this._bgNode.addComponent(UIOpacity);
        this._bgNode.active = false;

        this._textNode = new Node('Text');
        this._textNode.layer = Layers.Enum.UI_2D;
        const uiTransform = this._textNode.addComponent(UITransform);
        uiTransform.width = this._node.getComponent(UITransform)!.width;
        const label = this._textNode.addComponent(Label);
        label.horizontalAlign = Label.HorizontalAlign.CENTER;
        label.verticalAlign = Label.VerticalAlign.CENTER;
        this._textSize = 20;
        this._textNode.parent = this._bgNode;

        this._bgNode.parent = this._node;
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
        toast.setText(text);
        toast.setTime(time);
        return toast;
    }

    /**
     * 显示吐司
     */
    show() {
        this.setOverFlow();
        this._bgNode.active = true;
        const uiOpacity = this._bgNode.getComponent(UIOpacity);
        tween(uiOpacity)
            .delay(this._time)
            .to(0.3, { opacity: 0 })
            .call(() => {
                this._bgNode.destroy();
            })
            .start();
    }

    /**
     * 设置文字
     * @param text 文字
     * @returns 
     */
    setText(text: string): Toast {
        this._text = text;
        let label = this._textNode.getComponent(Label)!;
        label.string = this._text;
        return this;
    }

    /**
     * 设置文字大小
     * @param textSize 文字大小
     * @returns 
     */
    setFontSize(textSize: number): Toast {
        this._textSize = textSize;
        let label = this._textNode.getComponent(Label)!;
        label.fontSize = this._textSize;
        return this;
    }

    /**
     * 设置时间
     * @param time 时间 
     * @returns 
     */
    setTime(time: number) {
        this._time = time;
        return this;
    }

    /**
     * 设置位置
     * @param gravity 位置
     * @returns 
     */
    setGravity(gravity: Gravity): Toast {
        this._gravity = gravity;
        return this;
    }

    private setPosition() {
        let uiTransform = this._node.getComponent(UITransform)!;
        let bgUITransform = this._bgNode.getComponent(UITransform)!;
        if (Gravity.BOTTOM === this._gravity) {
            let y = -uiTransform.height / 2 + bgUITransform.height / 2 + 64;
            this._bgNode.position = v3(0, y, 0);
        }
    }

    private setOverFlow() {
        let maxLength = this._node.getComponent(UITransform)!.width / 2;
        let label = this._textNode.getComponent(Label)!;
        let fontLength = this._text.length * label.fontSize;
        let uiTransform = this._textNode.getComponent(UITransform)!;
        if (fontLength > maxLength) {
            uiTransform.width = maxLength;
            label.overflow = Label.Overflow.RESIZE_HEIGHT;
        } else {
            uiTransform.width = fontLength;
            label.overflow = Label.Overflow.NONE;
        }
        let bgUITransform = this._bgNode.getComponent(UITransform)!;
        bgUITransform.width = uiTransform.width + label.fontSize * 4;
        bgUITransform.height = uiTransform.height;
        this.setPosition();
    }

    private getPNode(): Node {
        if (null == Toast.pNode || !Toast.pNode.isValid) {
            Toast.pNode = new Node('Toast');
            let transform = Toast.pNode.addComponent(UITransform);
            Toast.pNode.layer = Layers.Enum.UI_2D;
            rootNode.addChild(Toast.pNode);
            Toast.pNode.zIndex = 100;
            let size = view.getVisibleSize();
            transform.contentSize = size;
            transform.width = size.width;
            transform.height = size.height;

        }
        return Toast.pNode;
    }

}