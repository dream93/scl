import { assetManager, ImageAsset, Texture2D } from "cc";

/**
 * 引擎的一些扩展
 */
export class EngineEx {

    static AVATAR_EXT = ".head";

    /**
     * 自定义头像加载流程
     * 加载头像使用 ResUtil.loadRemote({url, option:{ext:headImgExt}})
     * 用该方式小游戏平台不需要加入白名单
     * 但是也不会缓存在本地，适合头像文件
     */
    static registerHeadImgLoader() {
        assetManager.downloader.register(this.AVATAR_EXT, (content, options, onComplete) => {
            onComplete(null, content);
        });
        assetManager.parser.register(this.AVATAR_EXT, this._downloadDomImage);
        assetManager.factory.register(this.AVATAR_EXT, this._createTexture);
    }

    private static _createTexture(id: string, data: any, options: any, onComplete: Function) {
        let out: Texture2D | null = null;
        let err: Error | null = null;
        try {
            out = new Texture2D();
            const imageAsset = new ImageAsset(data);
            out.image = imageAsset;
        } catch (e) {
            err = e as any as Error;
        }
        onComplete && onComplete(err, out);
    }

    private static _downloadDomImage(url: string, options: any, onComplete: Function) {
        const img = new Image();
        if (window.location.protocol !== 'file:') {
            img.crossOrigin = 'anonymous';
        }
        function loadCallback() {
            img.removeEventListener('load', loadCallback);
            img.removeEventListener('error', errorCallback);
            if (onComplete) {
                onComplete(null, img);
            }
        }

        function errorCallback() {
            img.removeEventListener('load', loadCallback);
            img.removeEventListener('error', errorCallback);
            if (onComplete) {
                onComplete(new Error(url));
            }
        }

        img.addEventListener('load', loadCallback);
        img.addEventListener('error', errorCallback);
        img.src = url;
        return img;
    }


}