import path from 'node:path';
import { pathToFileURL as buildInPathToFileURL } from 'node:url';
import util from 'node:util';

import Ffmpeg from 'fluent-ffmpeg';
import { Bot } from 'grammy';

import config from './config.mjs';
import extendPathToFileURL from './node/extendPathToFileURL.mjs';

const bot = new Bot(config.botToken, {
	client: {
		apiRoot: config.apiRoot,
		timeoutSeconds: config.timeout
	}
});

/**
 * @param {string} pathname
 * @param {boolean} isWindows
 */
function pathToFileURL(pathname, isWindows) {
	if (process.platform === 'win32' && isWindows || process.platform !== 'win32' && !isWindows) {
		return buildInPathToFileURL(pathname);
	}
	return extendPathToFileURL(pathname, isWindows);
}

/**
 * @param {string} origPath
 */
function toApiServerUrl(origPath) {
	origPath = path.normalize(origPath);
	const relativePath = path.relative(config.rootPath, origPath);
	if (relativePath.match(/^\.+[\/\\]/)) {
		throw new Error('Can\' covert ' + JSON.stringify(origPath) + ' to ApiServerUrl.');
	}
	return config.reMapPath
		? pathToFileURL(
			path[config.reMapPathTargetIsWindows ? 'win32' : 'posix'].join(config.reMapPath, relativePath),
			config.reMapPathTargetIsWindows
		)
		: buildInPathToFileURL(origPath);
}

/**
 * 
 * @param {string} videoPath 
 * @param {import('./config.mjs').TBangumi} bangumi 
 * @param {number} episode
 * @return {Promise<Parameters<import('grammy').RawApi['sendVideo']>[0]>}
 */
export async function sendToTelegramGetOpt(videoPath, bangumi, episode) {
	/** @type {Ffmpeg.FfprobeData} */
	const mediaInfo = await util.promisify(Ffmpeg.ffprobe)(videoPath);
	const duration = mediaInfo.format.duration;
	if (!duration) {
		throw new Error('Can\'t get duration for ' + JSON.stringify(videoPath) + ' .');
	}
	const { width, height } = mediaInfo.streams.filter(v => v.codec_type === 'video')[0] || {};
	if (!width || !height) {
		throw new Error('Can\'t get resolution for ' + JSON.stringify(videoPath) + ' .');
	}
	const apiServerVideoPathPath = toApiServerUrl(videoPath).href;
	if (bangumi.target) {
		return {
			chat_id: bangumi.target,
			video: apiServerVideoPathPath,
			duration: duration,
			height: height,
			width: width,
			caption: `#${bangumi.season} ${String(episode).padStart(2, '0')}`,
			supports_streaming: true
		};
	} else if (config.defaultTarget) {
		return {
			chat_id: config.defaultTarget,
			video: apiServerVideoPathPath,
			duration: duration,
			height: height,
			width: width,
			caption: `${bangumi.name} ${String(episode).padStart(2, '0')}`,
			supports_streaming: true
		};
	}
	throw new Error(
		util.format(
			'Can\'t send "%s" (%d) Episode %s to Telegram: No target.',
			bangumi.sn,
			bangumi.name,
			String(episode).padStart(2, '0')
		)
	);
}

/**
 * 
 * @param {string} videoPath 
 * @param {import('./config.mjs').TBangumi} bangumi 
 * @param {number} episode
 */
export default async function sendToTelegram(videoPath, bangumi, episode) {
	return bot.api.raw.sendVideo(await sendToTelegramGetOpt(videoPath, bangumi, episode));
}
