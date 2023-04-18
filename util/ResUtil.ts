/**
 *
 * @file ResUtil.ts
 * @author dream
 * @description Cocos方法整合，如果Cocos版本升级，造成API修改，仅需修改此处
 *
 */

import { Asset, assetManager, AssetManager, resources } from "cc";

export type Constructor<T extends Asset> = new () => T;

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
}