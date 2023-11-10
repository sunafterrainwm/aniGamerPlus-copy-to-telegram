#!/usr/bin/env node

import path from 'path';
import matchBangumi from '../lib/matchBangumi.mjs';
import sendToTelegram, { sendToTelegramGetOpt } from '../lib/sendToTelegram.mjs';
import { bangumiExist, logDownloadedBangumi } from '../lib/bangumiLog.mjs';
import log from '../lib/log.mjs';

/**
 * @param {boolean} [isHelp]
 * @return {never}
 */
function printHelp(isHelp = false) {
	console.log('Usage: node manualCopy.mjs /path/to/bangumi [options] [-f/--ignore-exist-bangumi]');
	console.log('');
	console.log('Options:');
	console.log('  -d, --dry-run               跳過上傳 Telegram 伺服器此一動作');
	console.log('  -f, --ignore-exist-bangumi  無視目標番組曾經上傳過，強制重新上傳');
	console.log('  -n, --do-not-log-bangumi    不記錄這次上傳');
	console.log('  -h, --help                  顯示這個說明');
	process.exit(isHelp ? 0 : 1);
}

const args = process.argv.slice(2);
if (!args.length) {
	printHelp();
}

/** @type {string?} */
let videoPath = null;
let dryRun = false;
let ignoreExistBangumi = false;
let doNotLogBangumi = false;
for (const arg of args) {
	switch (arg) {
		case '-d':
		case '--dry-run':
			dryRun = true;
			break;

		case '-f':
		case '--ignore-exist-bangumi':
			ignoreExistBangumi = true;
			break;
	
		case '-n':
		case '--do-not-log-bangumi':
			doNotLogBangumi = true;
			break;

		case '-h':
		case '--help':
			printHelp(true);

		default:
			if (videoPath || (arg.startsWith('-') && path.extname(arg) === arg)) {
				printHelp();
			}
			videoPath = arg;
			break;
	}
}
if (!videoPath) {
	printHelp();
}
const matchResult = matchBangumi(videoPath);
if (matchResult === null) {
	console.log('不是有效的番組。');
	process.exit(1);
} else if (matchResult === false) {
	console.log('此番組未被記載。');
	process.exit(1);
}
log('info', '匹配結果：%s (%d) 第%d集', matchResult.bangumi.name, matchResult.bangumi.sn, matchResult.episode);

if (bangumiExist(matchResult.bangumi, matchResult.episode)) {
	if (ignoreExistBangumi) {
		log('warn', '雖然此集曾被上傳過，但由於指定了 --ignore-exist-bangumi，依然繼續上傳。');
	} else {
		log('warn', '此集曾被上傳過，退出。');
		process.exit(1);
	}
}

if (dryRun) {
	const res = await sendToTelegramGetOpt(
		videoPath,
		matchResult.bangumi,
		matchResult.episode
	);
	delete res.thumbnail; // hack
	console.log('%s\n', JSON.stringify(res, null, '\t'));
	process.exit(0);
}

log('info', '開始傳送檔案......');
const res = await sendToTelegram(
	videoPath,
	matchResult.bangumi,
	matchResult.episode
);
console.log('%s\n', JSON.stringify(res, null, '\t'));
if (!doNotLogBangumi) {
	logDownloadedBangumi(matchResult.bangumi, matchResult.episode);
	console.log('已記錄這次上傳。');
}
process.exit(0);
