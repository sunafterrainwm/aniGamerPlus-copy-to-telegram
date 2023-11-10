# 安裝先決條件
Nodejs 16+（編寫環境是 v20.8.1，如果出現語法錯誤或內建函數找不到請自己升級吧...）
pnpm，可以用 Nodejs 帶的 ```corepack enable pnpm``` 安裝 
https://github.com/miyouzi/aniGamerPlus
https://github.com/tdlib/telegram-bot-api 需要自己編譯可執行檔

# 使用方法
1. pnpm install --prod # 如果沒有 --prod 的話會下載一個十幾 MB 的 typescript
2. 將 config.example.mjs 複製成 config.mjs 並按照註釋修改
3. 執行 node bin/watch.mjs

# 注意事項
1. aniGamerPlus 配置不能沒有集數，但可以接受沒有解析度
2. 會自動在番劇的儲存目錄下建立一個名為 uploadedBangumi.log 的文字檔記錄已上傳的番組，請確保該檔案可以被讀寫
3. 如果 watch.mjs 一直掃描不到的話可以嘗試設置環境變數 CHOKIDAR_USEPOLLING=1，具體請參考 https://www.npmjs.com/package/chokidar#performance
4. 其他未列到的遇到請隨意發問但本人不一定答得出來
   
## uploadedBangumi.log 的格式
```
snId|集數
snId|集數
snId|集數
snId|集數
snId|集數
```