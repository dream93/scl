/**
 *
 * @file ResUtil.ts
 * @author dream
 * @description Cocos方法整合，如果Cocos版本升级，造成API修改，仅需修改此处
 *
 */

import { Asset, assetManager, AssetManager, ImageAsset, resources, Texture2D } from "cc";

export type Constructor<T extends Asset> = new () => T;

export const headImgExt = ".head";

export module ResUtil {

    /**
     * @description 原生加载资源
     * @param object {url: 远程地址 option: 参数类型}
     * @returns 
     */
    export function loadRemote<T extends Asset>(object: { url: string, option?: any }) {
        if (null == object.option) {
            object.option = {};
        }
        const { url, option } = object;
        return new Promise((resolve, reject) => {
            assetManager.loadRemote(url, option, (err: Error | null, asset: T) => {
                resolve && resolve(err ? null : asset);
            });
        });

    }

    /**
     * 加载bundle
     * @param bundleName 
     * @returns 
     */
    export function loadBundle(bundleName: string) {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                resolve && resolve(err ? null : bundle);
            });
        });
    }

    function getBundle(bundleName?: string, bundle?: AssetManager.Bundle) {
        if (!bundle) {
            if (null == bundleName || '' === bundleName) {
                bundle = resources;
            } else {
                bundle = assetManager.getBundle(bundleName)!;
            }
        }
        return bundle;
    }

    /**
     * 加载资源
     * @param option 
     * @returns 
     */
    export function loadAsset<T extends Asset>(option: { path: string, bundleName?: string, bundle?: AssetManager.Bundle, type: Constructor<T> }) {
        const bundle = getBundle(option.bundleName, option.bundle);
        const asset = bundle.get(option.path, option.type);
        if (null != asset) {
            return Promise.resolve(asset);
        }
        return new Promise((resolve, reject) => {
            bundle.load(option.path, option.type, (err, asset: T) => {
                resolve(err ? null : asset);
            });
        });
    }

    /**
     * 自定义头像加载流程
     * 加载头像使用 ResUtil.loadRemote({url, option:{ext:headImgExt}})
     */
    export function registerHeadImgLoader() {
        assetManager.downloader.register(headImgExt, (content, options, onComplete) => {
            onComplete(null, content);
        });
        assetManager.parser.register(headImgExt, downloadDomImage);
        assetManager.factory.register(headImgExt, createTexture);
    }

    function createTexture(id: string, data: any, options: any, onComplete: Function) {
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

    function downloadDomImage(url: string, options: any, onComplete: Function) {
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