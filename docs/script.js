document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            // Canvasサイズを画像サイズに設定
            canvas.width = 128;
            canvas.height = 128;

            // 画像をCanvasに描画（128x128にリサイズ）
            ctx.drawImage(img, 0, 0, 128, 128);

            // ピクセル情報を取得
            const imageData = ctx.getImageData(0, 0, 128, 128);
            console.log(imageData.data); // RGBAのピクセルデータが取得できる
        };
        img.src = e.target.result;
        document.getElementById('preview').src = e.target.result; // プレビュー表示
    };
    reader.readAsDataURL(file);
});
