import path from 'node:path';

/**
 * @typedef {Object} TBangumi
 * @property {number} sn
 * sn id
 * @property {string} name
 * 標準名字
 * @property {string[]} alias
 * 因為空格等等不可抗力因素產生的別名
 * - 例如「超超超超超喜歡你的 100 個女友」可能需要別名「超超超超超喜歡你的100個女友」才能確保匹配
 * @property {string} season
 * 季度
 * @property {string|number} [target]
 * 目標頻道 ID 或 username
 */

/**
 * @typedef {Object} TConfig
 * @property {string} apiRoot
 * Bot API 伺服器網址，不包含尾隨的 /
 * @property {string} botToken
 * 機器人的 Token
 * @property {number} [timeout]
 * 向 Bot API 伺服器發出請求的最大秒數
 * 預設500秒，如果所在網路環境太糟糕或是常常需要傳接近200GB的檔案的話
 * 可能需要加長
 * @property {TBangumi[]} bangumiMap
 * @property {string|number|null} [defaultTarget]
 * @property {string} rootPath
 * @property {string} [reMapPath]
 * Bot API 伺服器的環境對應的 rootPath
 * 如果一樣請不要填寫以減少資源浪費
 * - wsl 環境下跑 telegram-bot-api.exe 的話請以 Windows 環境下的目錄填寫
 * @property {boolean} [reMapPathTargetIsWindows]
 * Bot API 伺服器的環境是不是 Windows 作業系統
 * 填寫錯誤可能造成伺服器抓不到檔案
 * @property {string} [videoFilenamePrefix]
 * 對應 customized_video_filename_prefix
 * @property {string} [videoFilenameSuffix]
 * 對應 customized_video_filename_suffix
 * @property {string} [bangumiNameSuffix]
 * 對應 customized_bangumi_name_suffix
 * @property {string} [videoExtension]
 * 對應 video_filename_extension
 * @property {boolean} [autoReload]
 * 是否在 config.mjs 產生變化時自動重新載入
 * 僅能重載入 bangumiMap 和 defaultTarget 兩個選項
 */

class Config {
	/** @type {Partial<TConfig>} */
	#config;

	constructor() {
		this.#config = {};
	}

	async load() {
		const config = (await import('../config.mjs')).default;
		this.#config = config;
	}

	async reload() {
		/** @type {TConfig} */
		const config = (await import('../config.mjs?ver=' + Date.now())).default;
		this.#config.bangumiMap = config.bangumiMap;
		if (config.defaultTarget) {
			this.#config.defaultTarget = config.defaultTarget;
		} else {
			this.#config.defaultTarget = null;
		}
	}

	/**
	 * @param {TConfig} config 
	 */
	setConfig(config) {
		this.#config = config;
	}

	/**
	 * @template {keyof TConfig} K
	 * @param {K} key 
	 * @param {TConfig[K]} value 
	 */
	overrideConfig(key, value) {
		this.#config[key] = value;
	}

	get apiRoot() {
		if (!this.#config.apiRoot) {
			throw new Error('apiRoot missing.');
		}
		/** @type {URL} */
		let url;
		try {
			url = new URL(this.#config.apiRoot);
		} catch {
			try {
				url = new URL('//' + this.#config.apiRoot, 'http://localhost/');
			} catch {
				throw new Error('bad apiRoot.');
			}
		}
		return url.origin + url.pathname.replace(/^\/$/, '');
	}

	get botToken() {
		if (!this.#config.botToken) {
			throw new Error('botToken missing.');
		}
		return String(this.#config.botToken);
	}

	get timeout() {
		if (this.#config.timeout) {
			if (typeof this.#config.timeout !== 'number') {
				this.#config.timeout = Number.parseInt(String(this.#config.timeout), 10);
			}
			if (Number.isNaN(this.#config.timeout)) {
				throw new Error('bad timeout.');
			}
		}
		return this.#config.timeout === 0 ? this.#config.timeout : (this.#config.timeout || 500 /** second */);
	}

	get bangumiMap() {
		if (!this.#config.bangumiMap) {
			throw new Error('bangumiMap Missing.');
		} else if (!Array.isArray(this.#config.bangumiMap)) {
			throw new Error('bad bangumiMap.');
		}
		return this.#config.bangumiMap;
	}

	get defaultTarget() {
		return this.#config.defaultTarget;
	}

	/** @type {string?} */
	#rootPath = null;
	get rootPath() {
		this.#rootPath ??= (() => {
			if (!this.#config.rootPath) {
				throw new Error('rootPath Missing.');
			} else if (!path.isAbsolute(this.#config.rootPath)) {
				throw new Error('bad rootPath.');
			}
			return path.normalize(this.#config.rootPath).replace(/[\/]+$/, '');
		})();

		return this.#rootPath;
	}

	/** @type {string|false?} */
	#reMapPath = null;
	get reMapPath() {
		this.#reMapPath ??= (() => {
			const pathObject = this.#config.reMapPathTargetIsWindows ? path.win32 : path.posix;
			if (!this.#config.reMapPath) {
				return false;
			} else if (!pathObject.isAbsolute(this.#config.reMapPath)) {
				throw new Error('bad reMapPath.');
			}
			return pathObject.normalize(this.#config.reMapPath).replace(/[\/]+$/, '');
		})();
		return this.#reMapPath;
	}

	get reMapPathTargetIsWindows() {
		if (!this.#config.reMapPath) {
			return false;
		}

		return !!this.#config.reMapPathTargetIsWindows;
	}

	get prefixSuffixList() {
		return {
			videoFilenamePrefix: this.#config.videoFilenamePrefix || '',
			videoFilenameSuffix: this.#config.videoFilenameSuffix || '',
			bangumiNameSuffix: this.#config.bangumiNameSuffix || '',
			videoExtension: this.#config.videoExtension
		};
	}

	get autoReload() {
		return !!this.#config.autoReload;
	}
}

const config = new Config();
await config.load();
export default config;
