import { AudioClip, AudioSource } from "cc";
import { rootNode } from "../../SCL";
import { SqlUtil } from "../../util/SqlUtil";
import { ResUtil } from "../../util/ResUtil";

enum AudioState {
    INIT,
    PLAYING,
    PAUSED,
    STOPPED,
}

const KEY_BGM_VOLUME = 'user_bgm_volume';
const KEY_EFFECT_VOLUME = 'user_effect_volume';

class AudioData {

    private _bgmVolume = -1;
    get bgmVolume() {
        if (this._bgmVolume === -1) {
            this._bgmVolume = SqlUtil.getUserData(KEY_BGM_VOLUME, 1);
        }
        return this._bgmVolume;
    }
    set bgmVolume(bgmVolume) {
        this._bgmVolume = bgmVolume;
        SqlUtil.setUserData(KEY_BGM_VOLUME, bgmVolume);
    }

    private _effectVolume = -1;
    get effectVolume() {
        if (this._effectVolume === -1) {
            this._effectVolume = SqlUtil.getUserData(KEY_EFFECT_VOLUME, 1);
        }
        return this._effectVolume;
    }
    set effectVolume(_effectVolume) {
        this._effectVolume = _effectVolume;
        SqlUtil.setUserData(KEY_EFFECT_VOLUME, _effectVolume);
    }

}

export const audioData = new AudioData();


export class AudioManager {

    private static _instance: AudioManager | null = null;
    static get instance() {
        if (null == this._instance) {
            this._instance = new AudioManager();
        }
        return this._instance;
    }

    private constructor() {
        this.initBgm();
    }


    private _bgmAS: AudioSource = null!;
    private _effectAS: AudioSource[] = [];
    private _effectLoading: number[] = [];
    private _effectState: AudioState[] = [];

    private initBgm() {
        this._bgmAS = rootNode.addComponent(AudioSource);
        this._bgmAS.loop = true;
        this._bgmAS.volume = audioData.bgmVolume;
        rootNode.on(AudioSource.EventType.ENDED, this.onAudioEnded, this);
    }

    /**
     * @description 设置背景音乐音量
     * @param volume 0-1
     */
    setBgmVolume(volume: number) {
        audioData.bgmVolume = volume;
        this._bgmAS.volume = volume;
        if (volume === 0) {
            this._bgmAS.pause();
        } else {
            if (!this._bgmAS.playing && this._bgmAS.clip) {
                this._bgmAS.play();
            }
        }
    }


    /**
     * @description 获取音效音量
     */
    getBgmVolume() {
        return audioData.bgmVolume;
    }

    /**
     * @description 播放背景音乐
     * @param object { clip: 音效资源 path: 路径 bundleName: bundle名 url: 远程路径 loop: 是否循环 }
     */
    async playBgm(object: { clip?: AudioClip, path?: string, bundleName?: string, url?: string, loop?: boolean }) {
        let { clip, path, bundleName, url, loop = true } = object;
        if (!clip && path) {
            clip = await ResUtil.loadAsset({ path, bundleName, type: AudioClip }).catch(() => { }) as AudioClip;
        }
        if (!clip && url) {
            clip = await ResUtil.loadRemote({ url }).catch(() => { }) as AudioClip;
        }
        if (!clip) {
            return;
        }
        this._bgmAS.clip = clip;
        this._bgmAS.loop = loop;
        this._bgmAS.currentTime = 0;
        this._bgmAS.play();
    }

    /**
     * @description 背景音乐是否在播放
     */
    isBgmPlaying(): boolean {
        return this._bgmAS.playing;
    }

    /**
     * @description 恢复播放背景音乐
     */
    resumeBgm() {
        this._bgmAS.play();
    }

    /**
     * @description 暂停播放背景音乐
     */
    pauseBgm() {
        this._bgmAS.pause();
    }

    /**
     * @description 停止播放音乐
     */
    stopBgm() {
        this._bgmAS.stop();
    }

    /**
     * @description 设置音效音量
     * @param volume 音量大小
     */
    setEffectVolume(volume: number) {
        audioData.effectVolume = volume;
        this._effectAS.forEach(item => {
            item.volume = volume;
        });
        if (volume === 0) {
            this.stopAllEffect();
        }
    }

    /**
     * @description 获取音效音量
     */
    getEffectVolume() {
        return audioData.effectVolume;
    }

    /**
     * @description 播放音效
     * @param object { clip: 音效资源 path: 路径 bundleName: bundle名 url: 远程路径 volume: 音效大小 loop: 是否循环 }
     *                  传入path则动态加载 传入url则远程加载 优先动态加载
     * @returns 音效id
     */
    playEffect(object: { clip?: AudioClip, path?: string, bundleName?: string, url?: string, volume?: number, loop?: boolean }): number {
        if (audioData.effectVolume === 0) {
            return -1;
        }
        const index = this.getAudioSourceIndex();
        const { clip, path, bundleName, url, volume = audioData.effectVolume, loop = false } = object;
        this.dealEffect(index, volume, loop, clip, path, bundleName, url);
        return index;
    }

    /**
     * @description 暂停音效播放
     * @param effectId 音效id
     */
    pauseEffect(effectId: number) {
        this._effectState[effectId] = AudioState.PAUSED;
        const as = this._effectAS[effectId];
        if (as?.clip) {
            as?.pause();
        }
    }

    /**
     * @description 恢复音效播放
     * @param effectId 音效id
     */
    resumeEffect(effectId: number) {
        this._effectState[effectId] = AudioState.PLAYING;
        const as = this._effectAS[effectId];
        if (as?.clip) {
            as?.play();
        }
    }

    /**
     * @description 是否正在播放(包含准备播放阶段)
     * @param effectId 音效id
     * @returns 是否播放
     */
    isEffectPlaying(effectId: number): boolean {
        return AudioState.PLAYING === this._effectState[effectId];
    }

    /**
     * @description 是否正在播放
     * @param effectId 音效id
     * @returns 是否播放
     */
    isEffectPlaying2(effectId: number): boolean {
        return this._effectAS[effectId].playing;
    }

    /**
     * @description 停止播放音效
     * @param effectId 音效id
     */
    stopEffect(effectId: number) {
        this._effectState[effectId] = AudioState.STOPPED;
        const as = this._effectAS[effectId];
        if (as?.clip) {
            as?.stop();
        }
    }

    /**
     * @description 停止所有音效
     */
    stopAllEffect() {
        this._effectAS.forEach((item) => {
            if (item.playing) {
                item.stop();
            }
        });
        this._effectLoading.length = 0;
    }

    /**
     * @description 同时设置背景音乐和音效音量
     * @param bgmVolume 背景音量大小
     * @param effectVolume 音效音量大小
     */
    setVolume(bgmVolume: number, effectVolume?: number) {
        if (null == effectVolume) {
            effectVolume = bgmVolume;
        }
        this.setBgmVolume(bgmVolume);
        this.setEffectVolume(effectVolume);
    }

    private getAudioSourceIndex(): number {
        for (let i = 0; i < this._effectAS.length; i++) {
            if (AudioState.STOPPED === this._effectState[i]) {
                this._effectAS[i].currentTime = 0;
                this._effectAS[i].clip = null;
                return i;
            }
        }
        const as = rootNode.addComponent(AudioSource);
        this._effectAS.push(as);
        return this._effectAS.length - 1;
    }

    private async dealEffect(index: number, volume: number, loop: boolean, clip?: AudioClip, path?: string, bundleName?: string, url?: string) {
        const loadingId = new Date().getTime() + index;
        this._effectLoading.push(loadingId);
        this._effectState[index] = AudioState.INIT;
        if (!clip && path) {
            clip = await ResUtil.loadAsset({ path, bundleName, type: AudioClip }).catch(() => { }) as AudioClip;
        }
        if (!clip && url) {
            clip = await ResUtil.loadRemote({ url }).catch(() => { }) as AudioClip;
        }
        const loadIdx = this._effectLoading.indexOf(loadingId);
        if (loadIdx === -1) { // 已经停止音效了
            return;
        }
        if (!clip || AudioState.STOPPED === this._effectState[index]) { // 加载失败 或 已停止
            this._effectLoading.splice(loadIdx);
            return;
        }
        const as = this._effectAS[index];
        as.clip = clip;
        as.loop = loop;
        as.volume = volume;
        if (AudioState.PAUSED !== this._effectState[index]) { // 非暂停状态
            this._effectState[index] = AudioState.PLAYING;
            as.play();
        }
    }

    private onAudioEnded(as: AudioSource) {
        for (let i = this._effectAS.length - 1; i >= 0; i--) {
            if (this._effectAS[i] === as) {
                this._effectState[i] = AudioState.STOPPED;
            }
        }
    }
}
