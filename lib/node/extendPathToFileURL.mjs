// fork from https://github.com/nodejs/node/blob/cc725a653af24bce6302a60c3f96a58ab3f4ee5b/lib/internal/url.js
// original license: https://github.com/nodejs/node/blob/cc725a653af24bce6302a60c3f96a58ab3f4ee5b/LICENSE
import path from 'node:path';
import url from 'node:url';

// The following characters are percent-encoded when converting from file path
// to URL:
// - %: The percent character is the only character not encoded by the
//        `pathname` setter.
// - \: Backslash is encoded on non-windows platforms since it's a valid
//      character but the `pathname` setters replaces it by a forward slash.
// - LF: The newline character is stripped out by the `pathname` setter.
//       (See whatwg/url#419)
// - CR: The carriage return character is also stripped out by the `pathname`
//       setter.
// - TAB: The tab character is also stripped out by the `pathname` setter.

/**
 * @param {string} filepath 
 * @param {boolean} [isWindows]
 * @return {string}
 */
function encodePathChars(filepath, isWindows) {
	return filepath
		.replace(/%/g, '%25')
		// In posix, backslash is a valid character in paths:
		.replace(/\\/g, () => isWindows ? '\\' : '%5C')
		.replace(/\n/g, () => isWindows ? '\\' : '%0A')
		.replace(/\r/g, () => isWindows ? '\\' : '%0D')
		.replace(/\t/g, () => isWindows ? '\\' : '%09')
}

/**
 * @param {string} filepath
 * @param {boolean} [isWindows]
 */
export default function extendPathToFileURL(filepath, isWindows = false) {
	if (isWindows && filepath.startsWith('\\\\')) {
		const outURL = new URL('file://');
		// UNC path format: \\server\share\resource
		const hostnameEndIndex = filepath.indexOf('\\', 2);
		if (hostnameEndIndex === -1) {
			throw new Error(
				'ERR_INVALID_ARG_VALUE: Missing UNC resource path: path ' + JSON.stringify(filepath),
			);
		}
		if (hostnameEndIndex === 2) {
			throw new Error(
				'ERR_INVALID_ARG_VALUE: Empty UNC servername: path ' + JSON.stringify(filepath),
			);
		}
		const hostname = filepath.slice(2, hostnameEndIndex);
		outURL.hostname = url.domainToASCII(hostname);
		outURL.pathname = encodePathChars(filepath.slice(hostnameEndIndex).replace(/\\/g, '/'));
		return outURL;
	}
	let resolved = path.resolve(filepath);
	// path.resolve strips trailing slashes so we must add them back
	const filePathLast = filepath.charAt(filepath.length - 1);
	if (
		(filePathLast === '/' || (isWindows && filePathLast === '\\')) &&
		resolved[resolved.length - 1] !== path.sep
	) {
		resolved += '/';
	}

	// Call encodePathChars first to avoid encoding % again for ? and #.
	resolved = encodePathChars(resolved);

	// Question and hash character should be included in pathname.
	// Therefore, encoding is required to eliminate parsing them in different states.
	// This is done as an optimization to not creating a URL instance and
	// later triggering pathname setter, which impacts performance
	resolved = resolved
		.replace(/\?/g, '%3F')
		.replace(/#/g, '%23');
	return new URL(`file://${resolved}`);
}
