import fs from 'node:fs';
import path from 'node:path';

import config from './config.mjs';

const prefixSuffixList = config.prefixSuffixList;

/**
 * @param {string} str
 */
function escapeRegExp(str) {
	return str.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&');
}

function buildMatchReg() {
	return new RegExp(
		'^' +
		escapeRegExp(prefixSuffixList.videoFilenamePrefix) +
		'(.*)' +
		escapeRegExp(prefixSuffixList.bangumiNameSuffix) +
		'\\[(\\d+)\\](?:\\[(360|480|720|1080)P\\])?' +
		escapeRegExp(prefixSuffixList.videoFilenameSuffix) +
		'$'
	);
}
const matchReg = buildMatchReg();

/**
 * @param {string} videoPath
 */
export default function matchBangumi(videoPath) {
	const relativePath = path.relative(config.rootPath, videoPath);
	if (relativePath.match(/^\.+[\/\\]/)) {
		return null;
	}
	if (!fs.existsSync(videoPath)) {
		return null;
	}
	let videoName = path.basename(videoPath);
	if (
		prefixSuffixList.videoExtension
			? path.extname(videoName) !== `.${prefixSuffixList.videoExtension}`
			: !['.mp4', '.mkv', '.ts', '.mov'].includes(path.extname(videoName))
	) {
		return null;
	}

	const match = matchReg.exec(videoName.slice(0, -path.extname(videoName).length));
	if (!match) {
		return null;
	}

	const [, bangumiName, episodeString] = match;
	const episode = Number.parseInt(String(episodeString), 10);
	for (const bangumi of config.bangumiMap) {
		if (bangumi.name === bangumiName || bangumi.alias.includes(String(bangumiName))) {
			return {
				bangumi,
				episode
			};
		}
	}
	return false;
}
