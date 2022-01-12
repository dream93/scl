export module RandomUtil {

    /**
     * 生成[0, max)的随机数
     * @param max 
     * @returns 
     */
    export function random(min: number, max?: number) {
        if (!max) {
            min = 0;
            max = min;
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