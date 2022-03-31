/**
 *
 * @file CCUtil.ts
 * @author dream
 * @description Cocos方法整合，如果Cocos版本升级，造成API修改，仅需修改此处
 *
 */

import { Asset, assetManager, AssetManager, resources } from "cc";

export type Constructor<T extends Asset> = new () => T;

export module CCUtil {

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

    /**
     * 加载资源
     * @param option 
     * @returns 
     */
    export function loadAssset<T extends Asset>(option: { paths: string, bundle?: AssetManager.Bundle, type: Constructor<T> }): Promise<T> {
        let bundle = option.bundle || resources;
        let assset = bundle.get(option.paths, option.type);
        if (null != assset) {
            return Promise.resolve(assset);
        }
        return new Promise((resolve, reject) => {
            bundle.load(option.paths, option.type, (err, asset: T) => {
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