let allPosts = [];
let accessJwt = '';
let did = '';

function log(msg) {
  const el = document.getElementById('log');
  el.innerHTML += msg + '<br>';
  el.scrollTop = el.scrollHeight;
}

function openPost(uri) {
  // bsky.appのURL形式に変換: at://did:plc:xxx/app.bsky.feed.post/rkey -> https://bsky.app/profile/did/post/rkey
  const parts = uri.replace('at://', '').split('/');
  const url = `https://bsky.app/profile/${parts[0]}/post/${parts[2]}`;
  window.open(url, '_blank');
}

function setProgress(pct, text) {
  document.getElementById('progressBar').style.width = pct + '%';
  document.getElementById('statusText').textContent = text;
}

async function startFetch() {
  const handle = document.getElementById('handle').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!handle || !password) { alert('ハンドルとApp Passwordを入力してください'); return; }

  document.getElementById('fetchBtn').disabled = true;
  document.getElementById('progressCard').style.display = 'block';
  setProgress(5, 'ログイン中...');

  try {
    // Login
    const loginRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: handle, password })
    });
    if (!loginRes.ok) throw new Error('ログイン失敗: ' + (await loginRes.text()));
    const loginData = await loginRes.json();
    accessJwt = loginData.accessJwt;
    did = loginData.did;
    log('✅ ログイン成功: ' + loginData.handle);
    setProgress(15, '投稿を取得中...');

    // Fetch all posts
    allPosts = [];
    let cursor = null;
    let page = 0;
    while (true) {
      const url = new URL('https://bsky.social/xrpc/app.bsky.feed.getAuthorFeed');
      url.searchParams.set('actor', did);
      url.searchParams.set('limit', '100');
      url.searchParams.set('filter', 'posts_no_replies');
      if (cursor) url.searchParams.set('cursor', cursor);

      const feedRes = await fetch(url, { headers: { 'Authorization': 'Bearer ' + accessJwt } });
      if (!feedRes.ok) break;
      const feedData = await feedRes.json();

      const items = (feedData.feed || []).filter(item => item.post.author.did === did);
      for (const item of items) {
        const post = item.post;
        const record = post.record;
        const text = record.text || '';
        const createdAt = new Date(record.createdAt);
        const embed = record.embed;
        const hasImage = embed && (embed.$type === 'app.bsky.embed.images' || (embed.$type === 'app.bsky.embed.external'));
        const hasLink = /https?:\/\//.test(text);
        const hasHashtag = /#\S+/.test(text);
        const hasMention = /@\S+/.test(text);

        allPosts.push({
          uri: post.uri,
          cid: post.cid,
          text,
          createdAt: record.createdAt,
          date: createdAt.toLocaleDateString('ja-JP'),
          hour: createdAt.getHours(),
          dow: createdAt.getDay(),
          charLen: text.length,
          likeCount: post.likeCount || 0,
          repostCount: post.repostCount || 0,
          replyCount: post.replyCount || 0,
          hasImage: hasImage ? 1 : 0,
          hasLink: hasLink ? 1 : 0,
          hasHashtag: hasHashtag ? 1 : 0,
          hasMention: hasMention ? 1 : 0,
        });
      }

      page++;
      cursor = feedData.cursor;
      setProgress(Math.min(15 + page * 5, 85), `取得中... ${allPosts.length} 件`);
      log(`ページ ${page}: ${allPosts.length} 件取得`);

      if (!cursor || items.length === 0) break;
      await new Promise(r => setTimeout(r, 200));
    }

    log(`✅ 取得完了: 合計 ${allPosts.length} 件`);
    setProgress(100, `完了！ ${allPosts.length} 件取得しました`);

    setTimeout(renderResults, 500);
  } catch (e) {
    setProgress(0, 'エラー: ' + e.message);
    log('❌ ' + e.message);
    document.getElementById('fetchBtn').disabled = false;
  }
}

function avg(arr) { return arr.length ? arr.reduce((a,b) => a+b, 0) / arr.length : 0; }

function renderResults() {
  if (allPosts.length === 0) { alert('投稿が見つかりませんでした'); return; }

  const totalLikes = allPosts.reduce((a,b) => a + b.likeCount, 0);
  const totalReposts = allPosts.reduce((a,b) => a + b.repostCount, 0);
  const avgLikes = avg(allPosts.map(p => p.likeCount)).toFixed(1);
  const maxLikes = Math.max(...allPosts.map(p => p.likeCount));

  // Summary
  document.getElementById('statsGrid').innerHTML = [
    [allPosts.length, '総投稿数', false],
    [totalLikes, '総いいね数', false],
    [avgLikes, '平均いいね数', true],
    [maxLikes, '最大いいね数', false],
    [totalReposts, '総リポスト数', false],
    [allPosts.filter(p=>p.hasImage).length, '画像付き投稿', false],
  ].map(([n,l,isFloat]) => `<div class="stat-card"><div class="stat-num" data-target="${n}" data-float="${isFloat}">0</div><div class="stat-label">${l}</div></div>`).join('');
  document.getElementById('summaryCard').style.display = 'block';
  animateNumbers();

  // Insights
  const insights = generateInsights();
  document.getElementById('insightList').innerHTML = insights.map(i => `<div class="insight"><span class="emoji">${i.emoji}</span>${i.text}</div>`).join('');
  document.getElementById('insightCard').style.display = 'block';

  // Hour chart
  renderBarChart('hourChart', calcGroupAvg('hour', 24, i => i.toString() + '時'), 'いいね');
  document.getElementById('hourCard').style.display = 'block';

  // DOW chart
  const dowNames = ['日','月','火','水','木','金','土'];
  renderBarChart('dowChart', calcGroupAvgLabeled('dow', dowNames), 'いいね');
  document.getElementById('dowCard').style.display = 'block';

  // Length chart
  const lenGroups = [
    {label:'〜30文字', posts: allPosts.filter(p => p.charLen <= 30)},
    {label:'31〜100文字', posts: allPosts.filter(p => p.charLen > 30 && p.charLen <= 100)},
    {label:'101〜200文字', posts: allPosts.filter(p => p.charLen > 100 && p.charLen <= 200)},
    {label:'201文字〜', posts: allPosts.filter(p => p.charLen > 200)},
  ];
  const lenData = lenGroups.map(g => ({ label: g.label, value: avg(g.posts.map(p=>p.likeCount)), count: g.posts.length }));
  renderBarChart('lenChart', lenData, 'いいね');
  document.getElementById('lenCard').style.display = 'block';

  // グラフのアニメーション監視
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          const bar = entry.target;
          bar.style.width = bar.dataset.width;
        }, 200);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.chart-bar-inner').forEach(bar => observer.observe(bar));

  // TOP10
  const top10 = [...allPosts].sort((a,b) => b.likeCount - a.likeCount).slice(0, 10);
  document.getElementById('topTable').innerHTML = `<div style="overflow-x:auto"><table>
    <tr><th>#</th><th>投稿日</th><th>いいね</th><th>リポスト</th><th>返信</th><th>内容（抜粋）</th></tr>
    ${top10.map((p,i) => `<tr class="clickable-row" onclick="openPost('${p.uri}')" title="Blueskyで開く">
      <td><strong>${i+1}</strong></td>
      <td>${p.date}</td>
      <td>❤️ ${p.likeCount}</td>
      <td>🔁 ${p.repostCount}</td>
      <td>💬 ${p.replyCount}</td>
      <td>${p.text.slice(0,80)}${p.text.length>80?'...':''}</td>
    </tr>`).join('')}
  </table></div>`;
  document.getElementById('topCard').style.display = 'block';
}

function calcGroupAvg(field, size, labelFn) {
  return Array.from({length: size}, (_,i) => {
    const posts = allPosts.filter(p => p[field] === i);
    return { label: labelFn(i), value: avg(posts.map(p=>p.likeCount)), count: posts.length };
  });
}

function calcGroupAvgLabeled(field, labels) {
  return labels.map((label, i) => {
    const posts = allPosts.filter(p => p[field] === i);
    return { label, value: avg(posts.map(p=>p.likeCount)), count: posts.length };
  });
}

function renderBarChart(containerId, data, unit) {
  const maxVal = Math.max(...data.map(d=>d.value), 1);
  document.getElementById(containerId).innerHTML = data.map(d => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <div style="width:80px;font-size:12px;color:#aaa;text-align:right">${d.label}</div>
      <div style="flex:1">
        <div class="chart-bar-outer">
          <div class="chart-bar-inner" data-width="${(d.value/maxVal*100).toFixed(1)}%"></div>
        </div>
      </div>
      <div style="width:100px;font-size:10px;color:#0085ff">${d.value.toFixed(1)} ${unit} (${d.count}件)</div>
    </div>
  `).join('');
}

function animateNumbers() {
  document.querySelectorAll('.stat-num').forEach(el => {
    const target = parseFloat(el.dataset.target);
    const isFloat = el.dataset.float === 'true';
    const duration = 1500;
    const startTime = performance.now();

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = target * easeOut;
      
      el.textContent = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString();

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = isFloat ? target.toFixed(1) : target.toLocaleString();
      }
    }
    requestAnimationFrame(update);
  });
}

function generateInsights() {
  const insights = [];

  // Best hour
  const hourAvgs = Array.from({length:24}, (_,i) => {
    const ps = allPosts.filter(p=>p.hour===i);
    return { hour: i, avg: avg(ps.map(p=>p.likeCount)), count: ps.length };
  }).filter(h=>h.count>=2).sort((a,b)=>b.avg-a.avg);
  if (hourAvgs[0]) insights.push({ emoji:'⏰', text:`<strong>${hourAvgs[0].hour}時台</strong>の投稿が最も平均いいね数が高い（平均 ${hourAvgs[0].avg.toFixed(1)} いいね）。` });

  // Image effect
  const withImg = allPosts.filter(p=>p.hasImage);
  const noImg = allPosts.filter(p=>!p.hasImage);
  if (withImg.length >= 2 && noImg.length >= 2) {
    const diff = avg(withImg.map(p=>p.likeCount)) - avg(noImg.map(p=>p.likeCount));
    if (Math.abs(diff) > 0.5) insights.push({ emoji:'🖼️', text:`画像付き投稿は画像なし投稿より平均 <strong>${diff>0?'+':''}${diff.toFixed(1)}</strong> いいね。${diff>0?'画像は効果的！':'テキストのみの方が響く傾向あり。'}` });
  }

  // Best length
  const lenGroups = [
    {label:'短文（〜30文字）', posts: allPosts.filter(p=>p.charLen<=30)},
    {label:'中文（31〜100文字）', posts: allPosts.filter(p=>p.charLen>30&&p.charLen<=100)},
    {label:'長文（101〜200文字）', posts: allPosts.filter(p=>p.charLen>100&&p.charLen<=200)},
    {label:'超長文（201文字〜）', posts: allPosts.filter(p=>p.charLen>200)},
  ].filter(g=>g.posts.length>=2).map(g=>({...g, avg: avg(g.posts.map(p=>p.likeCount))})).sort((a,b)=>b.avg-a.avg);
  if (lenGroups[0]) insights.push({ emoji:'✍️', text:`<strong>${lenGroups[0].label}</strong>が最もいいねを集めやすい（平均 ${lenGroups[0].avg.toFixed(1)} いいね）。` });

  // Hashtag effect
  const withTag = allPosts.filter(p=>p.hasHashtag);
  const noTag = allPosts.filter(p=>!p.hasHashtag);
  if (withTag.length >= 2 && noTag.length >= 2) {
    const diff = avg(withTag.map(p=>p.likeCount)) - avg(noTag.map(p=>p.likeCount));
    insights.push({ emoji:'#️⃣', text:`ハッシュタグ付き投稿は平均 <strong>${diff>0?'+':''}${diff.toFixed(1)}</strong> いいね差。${diff>0?'ハッシュタグは拡散に効果的！':'ハッシュタグなしの方がナチュラルに伸びる傾向。'}` });
  }

  // Best DOW
  const dowNames = ['日','月','火','水','木','金','土'];
  const dowAvgs = dowNames.map((label,i) => {
    const ps = allPosts.filter(p=>p.dow===i);
    return { label, avg: avg(ps.map(p=>p.likeCount)), count: ps.length };
  }).filter(d=>d.count>=2).sort((a,b)=>b.avg-a.avg);
  if (dowAvgs[0]) insights.push({ emoji:'📅', text:`<strong>${dowAvgs[0].label}曜日</strong>の投稿が最も注目を浴びやすい（平均 ${dowAvgs[0].avg.toFixed(1)} いいね）。` });

  // Top post analysis
  const top20pct = [...allPosts].sort((a,b)=>b.likeCount-a.likeCount).slice(0, Math.max(1, Math.floor(allPosts.length*0.2)));
  const top20AvgLen = avg(top20pct.map(p=>p.charLen)).toFixed(0);
  insights.push({ emoji:'🏆', text:`上位20%の注目を浴びた投稿の平均文字数は <strong>${top20AvgLen}文字</strong>。` });

  return insights;
}

function showAllPosts(sortBy = 'likeCount') {
  const sorted = [...allPosts].sort((a, b) => {
    if (sortBy === 'date') return new Date(b.createdAt) - new Date(a.createdAt);
    return b[sortBy] - a[sortBy];
  });

  document.getElementById('allTable').innerHTML = `
    <tr>
      <th onclick="showAllPosts('date')" style="cursor:pointer">投稿日 ↕️</th>
      <th onclick="showAllPosts('likeCount')" style="cursor:pointer">❤️ ↕️</th>
      <th onclick="showAllPosts('repostCount')" style="cursor:pointer">🔁 ↕️</th>
      <th onclick="showAllPosts('replyCount')" style="cursor:pointer">💬 ↕️</th>
      <th onclick="showAllPosts('charLen')" style="cursor:pointer">文字数 ↕️</th>
      <th>画像</th><th>ハッシュタグ</th><th>内容</th>
    </tr>
    ${sorted.map(p=>`<tr class="clickable-row" onclick="openPost('${p.uri}')" title="Blueskyで開く">
      <td style="white-space:nowrap">${p.date}</td>
      <td>${p.likeCount}</td>
      <td>${p.repostCount}</td>
      <td>${p.replyCount}</td>
      <td>${p.charLen}</td>
      <td>${p.hasImage?'✅':'-'}</td>
      <td>${p.hasHashtag?'✅':'-'}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${p.text}</td>
    </tr>`).join('')}
  `;
  document.getElementById('allCard').style.display = 'block';
  document.getElementById('allCard').scrollIntoView({ behavior: 'smooth' });
}

function downloadCSV() {
  const headers = ['投稿日時','日付','時間','曜日','いいね数','リポスト数','返信数','文字数','画像あり','リンクあり','ハッシュタグあり','メンションあり','テキスト'];
  const dowNames = ['日','月','火','水','木','金','土'];
  const rows = allPosts.map(p => [
    p.createdAt, p.date, p.hour, dowNames[p.dow],
    p.likeCount, p.repostCount, p.replyCount, p.charLen,
    p.hasImage, p.hasLink, p.hasHashtag, p.hasMention,
    '"' + p.text.replace(/"/g, '""').replace(/\n/g, ' ') + '"'
  ].join(','));
  const csv = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bluesky_posts_' + new Date().toISOString().slice(0,10) + '.csv';
  a.click();
}