//マイクラのブロック,色,画像リスト（仮）
const minecraftBlocks = [
    { name: "White Wool", color: [249, 255, 255] },
    { name: "Black Wool", color: [25, 25, 25] },
    { name: "Red Wool", color: [154, 48, 47] },
    { name: "Green Wool", color: [88, 140, 65] },
    { name: "Blue Wool", color: [60, 68, 170] },
    { name: "Yellow Wool", color: [241, 175, 21] },
    { name: "Brown Wool", color: [112, 71, 36] }
];


//最も近いマイクラブロックを探す関数
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


//プレビュー表示
let img;
let aspect_rate;

document.getElementById('uploaded_image').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        img = new Image();
        img.onload = function() {
            //canvas取得
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            
            //canvasの比率を(横幅の大きさは固定で)画像の比率に合わせる
            aspect_rate = img.height/img.width;
            canvas.width = 256/aspect_rate;
            canvas.height = 256;
            
            // 画像をCanvasに描画
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
});


//数字取得＆dot画像に変換
let img_width = 128;
document.getElementById('submitButton').addEventListener('click', function() {
    img_size = document.getElementById('numberInput').value;
    if (img_size === "") {
        document.getElementById('result').textContent = "数値を入力してください";
        document.getElementById('result').style.color = "red";
    }
    else {
        document.getElementById('result').textContent = undefined;
    }

    
    const canvas = document.getElementById('dotCanvas');
    const ctx = canvas.getContext('2d'); 

    // Canvasサイズをnxnに設定
    canvas.width = img_size;
    canvas.height = img_size*aspect_rate;

    // 画像をリサイズして描画
    ctx.drawImage(img, 0, 0, img_size, img_size*aspect_rate);

    // ピクセル情報を取得
    const imageData = ctx.getImageData(0, 0, img_size, img_size*aspect_rate); //元の画像のRGB
    const data = imageData.data;

    // 新しいCanvasでマイクラ風ドット絵を作成
    const pixelSize = 1; 
    const dotCanvas = document.getElementById('dotCanvas');
    const dotCtx = dotCanvas.getContext('2d');
    dotCanvas.width = img_size;
    dotCanvas.height = img_size*aspect_rate;

    // 各ピクセルをマイクラブロックに変換
    for (let y = 0; y < dotCanvas.height; y += pixelSize) {
        for (let x = 0; x < dotCanvas.width; x += pixelSize) {
            const index = (y * img_size + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];

            const closestBlock = findClosestMinecraftBlock(r, g, b);// 最も近いマイクラブロックを探す
            dotCtx.fillStyle = `rgb(${closestBlock.color[0]}, ${closestBlock.color[1]}, ${closestBlock.color[2]})`;
            dotCtx.fillRect(x, y, pixelSize, pixelSize);
        }
    };
});


//変換後のドット画像つきポップアップの表示
function openPopup() {
    document.getElementById('popup').style.display = 'flex';
}
function closePopup() {
    document.getElementById('popup').style.display = 'none';
}
function outsideClick(event) {
    if (event.target.id === 'popup') {
        closePopup();
    }
}


// ドット絵を次のページに渡す
document.getElementById('editButton').addEventListener('click', function() {
    let canvas = document.getElementById("dotCanvas");
    let ctx = canvas.getContext("2d");
    let dotRGBdata = ctx.getImageData(0, 0, canvas.width, canvas.height); //ドット絵のピクセルデータ
    sessionStorage.setItem("dotRGBdata", JSON.stringify(Array.from(dotRGBdata.data)));
    sessionStorage.setItem("img_width",img_size);
    sessionStorage.setItem("aspect_rate",aspect_rate);
  });
