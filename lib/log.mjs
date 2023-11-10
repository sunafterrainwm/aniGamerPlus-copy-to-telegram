import util from 'node:util';

import chalk from 'chalk';

/**
 * @param {'debug' | 'info' | 'warn' | 'error'} type
 * @param {string} pattern
 * @param {unknown[]} args
 */
export default function log(type, pattern, ...args) {
	pattern = `[%s] ${pattern}`;
	switch (type) {
		case 'info':
			chalk.blue(pattern);
			break;

		case 'warn':
			chalk.yellow(pattern);
			break;

		case 'error':
			chalk.red(pattern);
			break;

		default:
			break;
	}
	args.unshift(new Date().toISOString());
	console[type](util.format(pattern, ...args));
}
