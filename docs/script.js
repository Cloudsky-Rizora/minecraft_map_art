//プレビュー表示
let img;
document.getElementById('uploaded_image').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        img = new Image();
        img.onload = function() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');

            // Canvasサイズを画像サイズに設定
            canvas.width = 256;
            canvas.height = 256;

            // 画像をCanvasに描画（nxnにリサイズ）
            ctx.drawImage(img, 0, 0, 256, 256);

            // ピクセル情報を取得
            const imageData = ctx.getImageData(0, 0, 256, 256);
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

//数字取得＆dot変換
let num = 128;
document.getElementById('submitButton').addEventListener('click', function() {
    num = document.getElementById('numberInput').value;
    if (num === "") {
        document.getElementById('result').textContent = "数値を入力してください";
        document.getElementById('result').style.color = "red";
    }
    else {
        document.getElementById('test_text').textContent = num;
    }

    
    const canvas = document.getElementById('dotCanvas');
    const ctx = canvas.getContext('2d'); 

    // Canvasサイズを256x256に設定
    canvas.width = num;
    canvas.height = num;

    // 画像をリサイズして描画
    ctx.drawImage(img, 0, 0, num, num);

    // ピクセル情報を取得
    const imageData = ctx.getImageData(0, 0, num, num);
    const data = imageData.data;

    // 🏗 新しいCanvasでマイクラ風ドット絵を作成
    const pixelSize = 1; // nxn のブロック単位で描画
    const dotCanvas = document.getElementById('dotCanvas');
    const dotCtx = dotCanvas.getContext('2d');
    dotCanvas.width = num;
    dotCanvas.height = num;

    // 各ピクセルをマイクラブロックに変換
    for (let y = 0; y < num; y += pixelSize) {
        for (let x = 0; x < num; x += pixelSize) {
            const index = (y * num + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            // 最も近いマイクラブロックを探す
            const closestBlock = findClosestMinecraftBlock(r, g, b);
            dotCtx.fillStyle = `rgb(${closestBlock.color[0]}, ${closestBlock.color[1]}, ${closestBlock.color[2]})`;
            dotCtx.fillRect(x, y, pixelSize, pixelSize);
        }
    };
});
