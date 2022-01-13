
/**
 * Predefined variables
 * Name = RandomUtil
 * DateTime = Thu Jan 13 2022 22:20:53 GMT+0800 (中国标准时间)
 * Author = dream93
 * FileBasename = RandomUtil.ts
 * FileBasenameNoExtension = RandomUtil
 * URL = db://assets/libs/util/RandomUtil.ts
 * ManualUrl = https://docs.cocos.com/creator/3.4/manual/zh/
 *
 */

export module RandomUtil {

    /**
     * 生成[0, max)的随机数
     * @param max 
     * @returns 
     */
    export function random(min: number, max?: number) {
        if (!max) {
            max = min;
            min = 0;
        }
        return min + Math.random() * (max - min);
    }

    /**
     * 生成[0, max)的随机整数
     * @param max 
     * @returns 
     */
    export function randomInt(min: number, max?: number) {
        return Math.floor(random(min, max));
    }
}