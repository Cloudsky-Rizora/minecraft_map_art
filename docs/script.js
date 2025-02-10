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

// 🎨 マイクラのブロック色リスト（仮）
const minecraftBlocks = [
    { name: "White Wool", color: [249, 255, 255] },
    { name: "Black Wool", color: [25, 25, 25] },
    { name: "Red Wool", color: [154, 48, 47] },
    { name: "Green Wool", color: [88, 140, 65] },
    { name: "Blue Wool", color: [60, 68, 170] },
    { name: "Yellow Wool", color: [241, 175, 21] },
    { name: "Brown Wool", color: [112, 71, 36] }
];

// 📌 最も近いマイクラブロックを探す関数
function findClosestMinecraftBlock(r, g, b) {
    let closestBlock = null;
    let minDistance = Infinity;

    minecraftBlocks.forEach(block => {
        const [br, bg, bb] = block.color;
        const distance = Math.sqrt((r - br) ** 2 + (g - bg) ** 2 + (b - bb) ** 2);

        if (distance < minDistance) {
            minDistance = distance;
            closestBlock = block;
        }
    });

    return closestBlock;
}

// 🖼 画像アップロード処理
document.getElementById('imageUpload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            // Canvasサイズを128x128に設定
            canvas.width = 128;
            canvas.height = 128;

            // 画像をリサイズして描画
            ctx.drawImage(img, 0, 0, 128, 128);

            // ピクセル情報を取得
            const imageData = ctx.getImageData(0, 0, 128, 128);
            const data = imageData.data;

            // 🏗 新しいCanvasでマイクラ風ドット絵を作成
            const pixelSize = 8; // 8x8 のブロック単位で描画
            const blockCanvas = document.createElement('canvas');
            const blockCtx = blockCanvas.getContext('2d');
            blockCanvas.width = 128;
            blockCanvas.height = 128;
            document.body.appendChild(blockCanvas);

            // 各ピクセルをマイクラブロックに変換
            for (let y = 0; y < 128; y += pixelSize) {
                for (let x = 0; x < 128; x += pixelSize) {
                    const index = (y * 128 + x) * 4;
                    const r = data[index];
                    const g = data[index + 1];
                    const b = data[index + 2];

                    // 最も近いマイクラブロックを探す
                    const closestBlock = findClosestMinecraftBlock(r, g, b);
                    blockCtx.fillStyle = `rgb(${closestBlock.color[0]}, ${closestBlock.color[1]}, ${closestBlock.color[2]})`;
                    blockCtx.fillRect(x, y, pixelSize, pixelSize);
                }
            }
        };
        img.src = e.target.result;
        document.getElementById('preview').src = e.target.result; // プレビュー表示
    };
    reader.readAsDataURL(file);
});
