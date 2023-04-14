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
     * 加载bundle
     * @param bundleName 
     * @returns 
     */
    export function loadBundle(bundleName: string) {
        return new Promise((resolve, reject) => {
            assetManager.loadBundle(bundleName, (err, bundle) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(bundle);
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
    export function loadAsset<T extends Asset>(option: { path: string, bundleName?: string, bundle?: AssetManager.Bundle, type: Constructor<T> }): Promise<T> {
        const bundle = getBundle(option.bundleName, option.bundle);
        const asset = bundle.get(option.path, option.type);
        if (null != asset) {
            return Promise.resolve(asset);
        }
        return new Promise((resolve, reject) => {
            bundle.load(option.path, option.type, (err, asset: T) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(asset);
                return;
            });
        });
    }
}