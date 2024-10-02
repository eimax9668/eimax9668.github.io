var IsError = 0;

async function fetchLatestDate() {
  try {
    const response = await fetch('blog/archive.txt');
    const text = await response.text();
    const dates = text.split('\n'); // 改行で分割して配列にする

    // 日付を年、月、日に分割する関数
    function splitDate(dateString) {
      const year = parseInt(dateString.slice(0, 4));
      const month = parseInt(dateString.slice(4, 6));
      const day = parseInt(dateString.slice(6
      ));
      return { year, month, day };
    }

    // 日付の配列をオブジェクトに変換し、年、月、日で比較
    const datesWithObjects = dates.map(splitDate);
    const latestDateObj = datesWithObjects.reduce((prev, current) => {
      if (
        current.year > prev.year ||
        (current.year === prev.year && current.month > prev.month) ||
        (current.year === prev.year && current.month === prev.month && current.day > prev.day)
      ) {
        return current;
      }
      return prev;
    });

    // 最新の日付を元の形式に戻す
    const latestDate = `${latestDateObj.year}${latestDateObj.month.toString().padStart(2, '0')}${latestDateObj.day.toString().padStart(2, '0')}`;

    console.log('最新の日付:', latestDate);
    return latestDate;
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 上記の関数を呼び出す
fetchLatestDate()
  .then(result => {
    const latestDate = result;
    console.log('変数に代入された最新の日付:', latestDate);
    show(`blog/${latestDate}.txt`);


    const urlParams = new URLSearchParams(window.location.search);
    // クエリが存在する場合のみ処理を実行
    if (urlParams.toString() !== '') {
      // ここに、クエリを取得して処理するコードを書く
      console.log('Blogクエリが存在します');
      const BlogNumber = urlParams.get('blog');
      show(`blog/${BlogNumber}.txt`);
    }
  });

function show(url) {
  IsError = 0;
  fetch(`${url}`)
    .then(response => {
      if (!response.ok) {
        if (response.status === 404) {
          console.error('エラー', response.status);
          IsError = 1;
        } else {
          console.error('エラー:', response.status);
        }
        IsError = 1;
      }
      return response.text();
    })
    .then(data => {
          document.getElementById('blog').innerHTML = data;
          if (IsError == 1){
            document.getElementById('blog').innerHTML = "<h1>エラー</h1>";
          }
        }
    )
    .catch(error => {
      console.error('エラーが発生しました:', error);
    });
}