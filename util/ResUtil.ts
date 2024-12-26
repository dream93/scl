import { Asset, AssetManager, ImageAsset, JsonAsset, SpriteAtlas, SpriteFrame, Texture2D, assetManager, path, rect, resources, size } from "cc";

export type TypeConstructor<T = unknown> = new (...args: any[]) => T;

export class ResUtil {

    /**
     * @description 原生加载资源
     * @param object {url: 远程地址 option: 参数类型}
     * @returns 
     */
    static loadRemote<T extends Asset>(object: { url: string, option?: any }): Promise<T>;
    static loadRemote<T extends Asset>(object: { url: string, option?: any, success: Function, fail?: FailFunction, complete?: Function }): void;
    static loadRemote<T extends Asset>(object: { url: string, option?: any, success?: Function, fail?: FailFunction, complete?: Function }): Promise<T> | void {
        if (null == object.option) {
            object.option = {};
        }
        const { url, option, success, fail, complete } = object;
        if (success) {
            this._loadRemote(url, option, success, fail, complete);
        } else {
            return new Promise((resolve, reject) => {
                this._loadRemote(url, option, resolve, reject);
            });
        }
    }

    private static _loadRemote<T extends Asset>(url: string, option: any, success: Function, fail?: FailFunction, complete?: Function) {
        assetManager.loadRemote(url, option, (err, asset: T) => {
            if (err) {
                if (!option.ignoreNull) {
                    console.error('远程资源加载失败:', url, 'err:', err);
                }
                fail?.({ errCode: -1, errMsg: err.message });
            } else {
                success?.(asset);
            }
            complete?.();
        });

    }


    /**
     * @description 加载多个资源
     * @param option 
     * @returns 
     */
    static loadAssetAny(option: { requests: { bundleName?: string, bundle?: AssetManager.Bundle, path: string, type: typeof Asset }[], success?: Function, fail?: FailFunction, complete?: Function }) {
        const all = [];
        for (let i = 0; i < option.requests.length; i++) {
            all.push(this.loadAsset(option.requests[i]));
        }
        return Promise.all(all);
    }

    /**
     * 预加载资源
     * @param option 
     */
    static preload(option: {
        bundleName?: string,
        bundle?: AssetManager.Bundle,
        paths: string | string[],
        type: typeof Asset,
        success?: (data: AssetManager.RequestItem[]) => void,
        fail?: FailFunction,
        complete?: Function
    }) {
        this.loadBundle({
            bundle: option.bundle,
            bundleName: option.bundleName
        }).then((bundle) => {
            bundle.preload(option.paths, option.type, (err, data) => {
                if (err) {
                    option.fail?.({ errCode: -1, errMsg: err.message });
                } else {
                    option.success?.(data);
                }
                option.complete?.();
            });
        }).catch(() => { });
    }

    static loadAssetSync<T extends Asset>(paths: string, type: TypeConstructor<T>, bundleName?: string): T | null {
        let bundle: AssetManager.Bundle | null;
        if (null != bundleName) {
            bundle = assetManager.getBundle(bundleName!);
        } else {
            bundle = resources;
        }
        if (!bundle) {
            return null;
        }
        return bundle.get(paths, type);
    }


    /**
     * 加载资源
     * @param option 
     * @returns 
     */
    static loadAsset<T extends Asset>(option: { bundleName?: string, bundle?: AssetManager.Bundle, path: string, type: TypeConstructor<T>, ignoreNull?: boolean }): Promise<T>;
    static loadAsset<T extends Asset>(option: { bundleName?: string, bundle?: AssetManager.Bundle, path: string, type: TypeConstructor<T>, ignoreNull?: boolean, success?: (asset: T) => void, fail?: FailFunction, complete?: Function }): void;
    static loadAsset<T extends Asset>(option: {
        bundleName?: string,
        bundle?: AssetManager.Bundle,
        path: string,
        type: TypeConstructor<T>,
        ignoreNull?: boolean,
        success?: (asset: T) => void,
        fail?: FailFunction,
        complete?: Function
    }): Promise<T> | void {
        if (option.success) {
            this._loadAsset(option.path, option.type, option.bundle, option.bundleName, option.ignoreNull, option.success, option.fail, option.complete);
            return;
        }
        return new Promise((resolve, reject) => {
            this._loadAsset(option.path, option.type, option.bundle, option.bundleName, option.ignoreNull, resolve as any, reject);
        });

    }

    private static _loadAsset<T extends Asset>(path: string, type: TypeConstructor<T>, bundle?: AssetManager.Bundle, bundleName?: string, ignoreNull = false, success?: (asset: T) => void, fail?: FailFunction, complete?: Function) {
        this.loadBundle({
            bundle: bundle,
            bundleName: bundleName,
            success: (bundle: AssetManager.Bundle) => {
                const asset: T | null = bundle.get(path, type);
                if (null != asset) {
                    success?.(asset)
                    complete?.();
                    return;
                }
                bundle.load(path, type, (err, asset: T) => {
                    if (err) {
                        if (!ignoreNull) {
                            console.error(err);
                        }
                        fail?.({ errCode: -1, errMsg: err.message });
                        complete?.();
                        return;
                    }
                    success?.(asset)
                    complete?.();
                });
            },
            fail: (err: CustomError) => {
                if (!ignoreNull) {
                    console.error('动态资源加载失败:', path, 'err:', err);
                }
                fail?.(err);
                complete?.();
            }
        });
    }

    /**
     * 加载bundle
     * @param name 
     * @returns 
     */
    static loadBundle(option: { bundle?: AssetManager.Bundle, bundleName?: string }): Promise<AssetManager.Bundle>;
    static loadBundle(option: { bundle?: AssetManager.Bundle, bundleName?: string, success: (bundle: AssetManager.Bundle) => void, fail?: FailFunction, complete?: Function }): void;
    static loadBundle(option: {
        bundle?: AssetManager.Bundle, bundleName?: string, success?: (bundle: AssetManager.Bundle) => void, fail?: FailFunction, complete?: Function
    }): Promise<AssetManager.Bundle> | void {
        if (option.success) {
            this._loadBundle(option.bundle, option.bundleName, option.success, option.fail, option.complete);
            return;
        }
        return new Promise((resolve, reject) => {
            this._loadBundle(option.bundle, option.bundleName, resolve, reject);
        });
    }

    private static _loadBundle(bundle?: AssetManager.Bundle | null, bundleName?: string, success?: (bundle: AssetManager.Bundle) => void, fail?: FailFunction, complete?: Function) {
        if (!bundle) {
            if (null == bundleName) {
                bundle = resources;
            } else {
                bundle = assetManager.getBundle(bundleName!);
            }
        }
        if (bundle) {
            success?.(bundle);
            complete?.();
            return
        }
        assetManager.loadBundle(bundleName!, (err, bundle) => {
            if (err) {
                fail?.({ errCode: -1, errMsg: err.message });
                complete?.();
                return;
            }
            success?.(bundle);
            complete?.();
        });
    }

    /**
     * 预加载目录
     * @param option 
     * @returns 
    */
    static preloadDir<T extends Asset>(option: { dir: string, type?: TypeConstructor<T>, bundleName?: string, bundle?: AssetManager.Bundle }) {
        this.loadBundle({
            bundle: option.bundle,
            bundleName: option.bundleName
        }).then((bundle) => {
            bundle.preloadDir(option.dir, option.type || null);
        });
    }

    /**
     * 加载目录
     * @param option 
     * @returns 
     */
    static loadDir<T extends Asset>(option: { dir: string, bundleName?: string, bundle?: AssetManager.Bundle, type?: TypeConstructor<T> }): Promise<T[]>;
    static loadDir<T extends Asset>(option: { dir: string, bundleName?: string, bundle?: AssetManager.Bundle, type?: TypeConstructor<T>, success: (assets: T[]) => void, fail?: FailFunction, complete?: Function }): void;
    static loadDir<T extends Asset>(option: { dir: string, bundleName?: string, bundle?: AssetManager.Bundle, type?: TypeConstructor<T>, success?: (assets: T[]) => void, fail?: FailFunction, complete?: Function }): Promise<Asset[]> | void {
        if (option.success) {
            this._loadDir(option.dir, option.bundle, option.bundleName, option.type, option.success, option.fail, option.complete);
            return;
        }
        return new Promise((resolve, reject) => {
            this._loadDir(option.dir, option.bundle, option.bundleName, option.type, resolve, reject);
        });
    }

    private static _loadDir<T extends Asset>(dir: string, bundle?: AssetManager.Bundle, bundleName?: string, type?: TypeConstructor<T>, success?: (assets: T[]) => void, fail?: FailFunction, complete?: Function) {
        this.loadBundle({
            bundle: bundle,
            bundleName: bundleName,
            success: (bundle: AssetManager.Bundle) => {
                if (type) {
                    bundle.loadDir(dir, type, (err, assets) => {
                        if (err) {
                            fail?.({ errCode: -1, errMsg: err.message });
                            complete?.();
                            return;
                        }
                        success?.(assets)
                        complete?.();
                    });
                } else {
                    bundle.loadDir(dir, (err, assets) => {
                        if (err) {
                            fail?.({ errCode: -1, errMsg: err.message });
                            complete?.();
                            return;
                        }
                        // @ts-expect-error
                        success?.(assets)
                        complete?.();
                    });
                }
            },
            fail: (err: CustomError) => {
                fail?.(err);
                complete?.();
            }
        });
    }

    /**
     * 加载远程图集
     * @param url 
     * @returns 
     */
    static loadPlist(url: string): Promise<SpriteAtlas> {
        return new Promise((resolve, reject) => {
            this.loadRemote<JsonAsset>({
                url
            }).then((plist: JsonAsset) => {
                const asset = plist._nativeAsset;
                let texture = asset.metadata.realTextureFileName || asset.metadata.textureFileName;
                texture = path.join(path.dirname(url), texture);
                this.loadRemote<ImageAsset>({
                    url: texture
                }).then((image: ImageAsset) => {
                    const texture = new Texture2D();
                    const sa = new SpriteAtlas();
                    texture.image = image;
                    const frames = asset.frames;
                    const sfs = sa.spriteFrames;
                    const plistRegex = /[,{}\s]+/;
                    const tmpRect = rect();
                    const tmpSize = size();
                    for (const key in frames) {
                        const sf = new SpriteFrame();
                        const frame = frames[key];
                        sf.texture = texture;
                        let tmp: string[] = frame.frame.split(plistRegex, 5);
                        sf.rect = tmpRect.set(parseInt(tmp[1]), parseInt(tmp[2]), parseInt(tmp[3]), parseInt(tmp[4]));
                        tmp = frame.offset.split(plistRegex, 3);
                        sf.offset = tmpRect.set(parseInt(tmp[1]), parseInt(tmp[2]));
                        tmp = frame.sourceSize.split(plistRegex, 3);
                        sf.originalSize = tmpSize.set(parseInt(tmp[1]), parseInt(tmp[2]));
                        sf.rotated = frame.rotated;
                        sfs[key.slice(0, -4)] = sf; //key需要去掉后缀.png
                    }
                    resolve(sa);
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }
}
