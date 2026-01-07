document.addEventListener('DOMContentLoaded', () => {
    // 初期表示に合わせてボタンの状態を更新
    updateActiveButtons('page1');

    // 全てのボタンにクリックイベントを設定
    document.querySelectorAll('button').forEach(button => {
        button.addEventListener('click', () => {
            // クラス名からターゲットとなるページIDを取得 (例: to-page2 -> page2)
            const targetClass = Array.from(button.classList).find(cls => cls.startsWith('to-page'));
            if (!targetClass) return;
            
            const targetId = targetClass.replace('to-', '');
            
            // View Transition API が使える場合はアニメーション付きで遷移
            if (document.startViewTransition) {
                document.startViewTransition(() => switchPage(targetId));
            } else {
                switchPage(targetId);
            }
        });
    });

    function switchPage(pageId) {
        // 全ページの表示・非表示を切り替え
        ['page1', 'page2', 'page3'].forEach(id => {
            const el = document.getElementById(id);
            if (id === pageId) {
                el.removeAttribute('hidden');
            } else {
                el.setAttribute('hidden', '');
            }
        });
        // ボタンのアクティブ状態を更新
        updateActiveButtons(pageId);
    }

    function updateActiveButtons(activePageId) {
        // 該当するページへのボタン全てに active クラスを付与
        document.querySelectorAll('.nav-buttons button').forEach(btn => {
            if (btn.classList.contains(`to-${activePageId}`)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
});