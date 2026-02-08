const fs = require('fs');
const path = require('path');

// パスの設定
const diariesDir = path.join(__dirname, '../diaries');
const outputFile = path.join(diariesDir, 'articles.json');

// HTMLから情報を抽出するための正規表現
const titleRegex = /<h1 class="blog_h1">(.*?)<\/h1>/;
const dateRegex = /<time datetime="(.*?)">(.*?)<\/time>/;

// diary.html 以外の .html ファイルを取得
const files = fs.readdirSync(diariesDir).filter(file => {
    return file.endsWith('.html') && file !== 'diary.html';
});

const articles = files.map(file => {
    const filePath = path.join(diariesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const titleMatch = content.match(titleRegex);
    const dateMatch = content.match(dateRegex);

    if (titleMatch && dateMatch) {
        return {
            filename: file,
            title: titleMatch[1],
            datetime: dateMatch[1], // ソート用 (例: 2026-02-08)
            dateText: dateMatch[2]  // 表示用 (例: 2026年2月8日)
        };
    }
    return null;
}).filter(item => item !== null);

// 日付の新しい順にソート
articles.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

// JSONファイル書き出し
fs.writeFileSync(outputFile, JSON.stringify(articles, null, 2));

console.log(`articles.json を生成しました。記事数: ${articles.length}`);