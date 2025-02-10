document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0]; // ユーザーが選択したファイルを取得
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('preview').src = e.target.result; // プレビュー表示
    };
    reader.readAsDataURL(file); // 画像をBase64形式で読み込む
});
