
import path from 'node:path';
import { setTimeout as pSetTimeout } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';

import chokidar from 'chokidar';

import { bangumiExist, logDownloadedBangumi } from '../lib/bangumiLog.mjs';
import config from '../lib/config.mjs';
import matchBangumi from '../lib/matchBangumi.mjs';
import sendToTelegram from '../lib/sendToTelegram.mjs';
import log from '../lib/log.mjs';

const configPath = path.join(fileURLToPath(import.meta.url), '..', '..', 'config.mjs');

/** @type {{videoPath: string; bangumi: import('../lib/config.mjs').TBangumi; episode: number}[]} */
const pendingToUploadList = [];

chokidar.watch(config.rootPath, {
	usePolling: true,
	ignoreInitial: true,
	disableGlobbing: true,
	awaitWriteFinish: true
})
	.on('add', (filepath) => {
		filepath = path.resolve(config.rootPath, filepath);
		const matchResult = matchBangumi(filepath);
		if (matchResult === null) {
			log('debug', '偵測到新加入了 %s，但好像根本不是番組', filepath);
			return;
		} else if (matchResult === false) {
			log('debug', '偵測到新加入了 %s，但在已知番組列表中未能尋獲此番組', filepath);
			return;
		} else if (bangumiExist(matchResult.bangumi, matchResult.episode)) {
			log('info', '偵測到新加入了 %s，但本集似乎已經上傳過了，如有需要重覆上傳可以用 manualCopy.mjs 強制重新上傳', filepath);
			return;
		}
		log(
			'info',
			'偵測到新加入的 %s，解析結果 %s (%d) 第%d集',
			filepath,
			matchResult.bangumi.name,
			matchResult.bangumi.sn,
			matchResult.episode
		);
		pendingToUploadList.push({ videoPath: filepath, ...matchResult });
	});

chokidar.watch(configPath, {
	usePolling: true,
	ignoreInitial: true,
	disableGlobbing: true
})
	.on('change', (path) => {
		if (path === configPath && config.autoReload) {
			config.reload()
				.then(
					() => {
						log('info', '已重新載入 config.mjs');
					},
					(error) => {
						log('error', '重新載入 config.mjs 失敗：', error);
					}
				);
		}
	});

log('info', 'aniGamerPlus-copy-to-Telegram watch.mjs 已啟動。');

(async () => {
	/** @type {typeof pendingToUploadList[number]|undefined} */
	let current;
	while (true) {
		current = pendingToUploadList.shift();
		if (current) {
			log('info', '開始傳送檔案 %s (%d) 第%d集', current.bangumi.name, current.bangumi.sn, current.episode);
			let success = true;
			try {
				await sendToTelegram(
					current.videoPath,
					current.bangumi,
					current.episode
				);
				try {
					logDownloadedBangumi(current.bangumi, current.episode);
				} catch (error) {
					log('error', '記錄上傳 %s (%d) 第%d集時發生錯誤：', current.bangumi.name, current.bangumi.sn, current.episode, error);
				}
			} catch (error) {
				success = false;
				log('error', '上傳 %s (%d) 第%d集時發生錯誤：', current.bangumi.name, current.bangumi.sn, current.episode, error);
			}
			if (success) {
				log('info', '已上傳 %s (%d) 第%d集', current.bangumi.name, current.bangumi.sn, current.episode);
			}
		}
		await pSetTimeout(10 * 1000);
	}
})();