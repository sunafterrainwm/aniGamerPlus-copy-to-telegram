/** @type {import('./lib/config.mjs').TConfig} */
export default {
	// 自建 Bot API 伺服器網址，不包含尾隨的 /
	// ※ 自建 Bot API 必須開啟 --local 選項
	// ※ 不要用官方的 https://api.telegram.org
	//    因為絕大多數的番都不可能小於 20MB
	apiRoot: 'http://localhost:12345',

	// 機器人的 Token
	botToken: '12345:67890',

	// 向 Bot API 伺服器發出請求的最大秒數，預設500秒，如果所在網路環境太糟糕可能需要加長
	// timeout: 500,
	
	bangumiMap: [
		{
			sn: 35761, // 動畫瘋上的 sn id
			name: '超超超超超喜歡你的 100 個女朋友', // 動畫瘋使用的劇集名字
			alias: [
				// alias 用於指定下載時可能因為空格差異
				// 或是在 sn_list.txt 指定了覆蓋名字
				// 導致無法用 name 匹配到的情況
				'超超超超超喜歡你的100個女朋友'
			],
			season: '第一季', // 季度，通常填上：第1季、劇場版、OVA1、OAD1 etc.
			target: '@bangumi_baha_35761' // 目標頻道，如果要省略的話請參考 defaultTarget
		},
	],

	// 對於沒有指定目標頻道的影片全部同步到這個頻道
	// 填上 null 則會拒絕一切沒有目標頻道的同步也會同時導致進程崩潰
	defaultTarget: null,

	// 下載下來的番放的位置
	// 如果是在虛擬環境如 Docker、wsl 執行的話要改成該環境的路徑表示法
	rootPath: 'D:\\aniGamerPlus\\bangumis',

	// 如果自建 Bot API 伺服器和這個程式所在的環境的路徑表示法不一樣
	// 填寫這個參數 Bot API 伺服器才能正確傳送影片
	// ※ wsl 環境下跑 telegram-bot-api.exe 的話請以 Windows 環境下的目錄填寫
	// reMapPath: '',
	// 自建 Bot API 伺服器所在環境是否是 Windows 環境
	// 指定錯誤的話... 自己試試 path.win32.normal('/root') 和 path.posix.normal('/root') 的差異
	// reMapPathTargetIsWindows: false,

	// 對應 customized_video_filename_prefix
	videoFilenamePrefix: '【動畫瘋】',
	// 對應 customized_bangumi_name_suffix
	bangumiNameSuffix: '',
	// 對應 customized_video_filename_suffix
	videoFilenameSuffix: '',
	// 對應 video_filename_extension
	// 此項不填的話低概率匹配到不正確的檔案（可能匹配到 .mp4, .mkv, .ts, .mov 任一一副檔名的檔案）
	videoExtension: 'mp4',

	// 是否在 config.mjs 產生變化時自動重新載入
	// 僅能重載入 bangumiMap 和 defaultTarget 兩個選項
	autoReload: true,
}
