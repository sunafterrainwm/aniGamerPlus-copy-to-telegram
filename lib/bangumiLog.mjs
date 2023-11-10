import fs from 'node:fs';
import path from 'node:path';

import config from './config.mjs';

export const bangumiLogPath = path.join(config.rootPath, 'uploadedBangumi.log');

/** @type {[number, number][]} */
let bangumiLog;

async function readLog() {
	bangumiLog = /** @type {[number, number][]} */((await fs.promises.readFile(bangumiLogPath, {
		encoding: 'utf-8'
	}))
		.split(/\r?\n/)
		.map((v, l) => {
			const split = String(v.split('#')[0]).trim().split('|');
			if (split.length !== 2) {
				if (split.length === 1 && split[0] === '') {
					return null;
				}
				throw new Error(`Bad line at "${bangumiLogPath}" line ${l + 1}.`);
			}
			let bangumiId = Number.parseInt(String(split[0]), 10);
			let episode = Number.parseInt(String(split[1]), 10);
			if (Number.isNaN(episode) || episode <= 0) {
				throw new Error(`Bad line at "${bangumiLogPath}" line ${l + 1}.`);
			}
			return [bangumiId, episode];
		})
		.filter(v => v !== null));
}

async function writeLog() {
	await fs.promises.writeFile(bangumiLogPath, bangumiLog.map(v => v.join('|')).sort().join('\n'), {
		encoding: 'utf-8'
	});
}

/**
 * @param {import('./config.mjs').TBangumi} bangumi
 * @param {number} episode 
 */
export function bangumiExist(bangumi, episode) {
	return bangumiLog.some(([xBangumiId, xEpisode]) => xBangumiId === bangumi.sn && xEpisode === episode);
}

/**
 * @param {import('./config.mjs').TBangumi} bangumi
 * @param {number} episode 
 */
export async function logDownloadedBangumi(bangumi, episode) {
	if (bangumiExist(bangumi, episode)) {
		return;
	}
	bangumiLog.push([bangumi.sn, episode]);
	await writeLog();
}

await readLog();
