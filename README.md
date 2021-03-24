# SCL

SCL是一套基于CocosCreator的极简(Simple)、基于组件(Component)以及类库(Libs)的开源框架，主要服务于休闲类游戏的快速开发。

## 弹框管理使用

1. 在弹框之前初始化
```
PopupManager.instance.init();
```
2. 将弹框制作成prefab,并挂在继承`PopupBase`的脚本组件
```
    /**
     * 是否设置点击拦截
     */
    @property(CCBoolean)
    blockInput: boolean = true;

    /**
     * 是否显示弹框动画
     */
    @property(CCBoolean)
    anim: boolean = true;

    /**
     * 弹框动画类型
     */
    @property({
        type: Enum(AnimType),
        visible() {
            return (this as any).anim;
        }
    })
    animType: AnimType = AnimType.SCALE;
```
3. 显示弹框
```
PopupManager.instance.show(option: { name?: string, prefab?: Prefab, path?: string, priority?: number, params?: any, keep?: boolean });
```

|参数|类型|默认值|说明
|-|-|-|-|
|name|string|null|自定义弹框名字|
|prefab|Prefab|null|Prefab|
|path|string|null|动态加载的路径|
|priority|number|0|层级|
|params|any|null|传递的参数|
|keep|boolean|false|是否保留当前弹框|

4. 隐藏弹框
```
PopupManager.instance.hide(name:string);
// 隐藏所有
PopupManager.instance.hideAll();
```
5. 销毁弹框
```
PopupManager.instance.remove(name:string)
// 销毁所有
PopupManager.instance.removeAll();
```
6. 获取当前弹框
```
// 弹框Node，如果当前没有弹框，返回null
PopupManager.instance.getCurrentPopup():Node|null;
// 弹框名字，如果当前没有弹框，则返回null
PopupManager.instance.getCurrentName(): string | null;
```
7. 获取某个弹框
```
PopupManager.instance.getPopup(name: string): Node | null;
```

## 本地化存储

`API`

1. 初始化密钥
```
SqlUtil.init(key: string, iv: string);
```

2. 存储
```
SqlUtil.set(key: string, value: any);
```

3. 取出
```
SqlUtil.get(key: string, defaultValue?: any);
```

4. 移除
```
SqlUtil.remove(key: string);
```

5. 清空
```
SqlUtil.clear();
```

