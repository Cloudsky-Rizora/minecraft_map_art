//ドット絵を次のページで受け取る
const dotRGBdata = sessionStorage.getItem('dotRGBdata');
const img_size = sessionStorage.getItem('img_width');
const aspect_rate = sessionStorage.getItem('aspect_rate');
const dot_img_width = sessionStorage.getItem('dot_img_width');
const dot_img_height = sessionStorage.getItem('dot_img_height');

//キャンバスの用意
const canvas = document.getElementById('dotCanvas')
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

//ドット絵関係の初期設定
let scale = 1;//拡大縮小要素
const scaleFactor = 1.1;//拡大縮小要素
const minscale = 0.1, maxscale = 40;
let imgX = 0, imgY = 0; //画像のオフセット
let mouseX = canvas.width/2,mouseY = canvas.height/2;

//ドット絵のデータ処理＆描画
const rawData = JSON.parse(dotRGBdata);
const dotDataArray = new Uint8ClampedArray(rawData);
console.log(dot_img_width,dot_img_height);
const dotData = new ImageData(dotDataArray,dot_img_width,dot_img_height);
console.log(dotData);
//モード切替初期設定
let mode = "move"; // 初期モード（"move", "erase", "draw"）
let isDragging = false;
let lastX, lastY;
let pixelSize = 10; // ピクセルサイズ（加筆・消去時）

// ボタン押下でmodeの切り替え
document.getElementById("drawButton").addEventListener("click", () => mode = "draw");
document.getElementById("eraseButton").addEventListener("click", () => mode = "erase");
document.getElementById("moveButton").addEventListener("click", () => mode = "move");

// マウスダウンイベント（各モードで処理を分ける）
canvas.addEventListener("mousedown", (event) => {
  	if (mode === "move") {
		startDragging(event);
  }
});

// マウスムーブイベント（各モードで処理を分ける）
canvas.addEventListener("mousemove", (event) => {
	if (mode === "move" && isDragging) {
		dragImage(event);
	} else if ((mode === "erase" || mode === "draw") && event.buttons === 1) {
		drawOrErase(event);
	}
});

// マウスアップ・マウスリーブイベント
canvas.addEventListener("mouseup", () => isDragging = false);
canvas.addEventListener("mouseleave", () => isDragging = false);

// 画像移動処理関数（moveモード用）
function startDragging(event) {
	isDragging = true;
	lastX = event.offsetX;
	lastY = event.offsetY;
}

function dragImage(event) {
	const dx = event.offsetX - lastX;
	const dy = event.offsetY - lastY;
	imgX += dx;
	imgY += dy;
	lastX = event.offsetX;
	lastY = event.offsetY;
	display();
}

//ディスプレイ関数 //画像を大きくするとはみ出る為、スケールの調整が必要
display();
function display() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // マウス位置を基準に拡大縮小
    ctx.translate(imgX, imgY);
    ctx.scale(scale, scale);

    // 新しい一時キャンバスを作成してスケールを適用
    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext("2d");
    tmpCanvas.width = img_size;
    tmpCanvas.height = img_size * aspect_rate;

    // ImageData を一時キャンバスに描画
    tmpCtx.putImageData(dotData, 0, 0);

    // 一時キャンバスをメインキャンバスに描画（スケール・トランスレート適用）
    ctx.drawImage(tmpCanvas, (canvas.width - tmpCanvas.width) / 2, (canvas.height - tmpCanvas.height) / 2, tmpCanvas.width, tmpCanvas.height);
    ctx.restore();
}

// クリックイベントリスナーを追加
canvas.addEventListener("click", function(event) {
	//根幹
    console.log(Math.floor((event.offsetX-imgX)/scale),Math.floor((event.offsetY-imgY)/scale));
    //根幹(小数点あり)
    console.log(((event.offsetX-imgX)/scale),((event.offsetY-imgY)/scale));
    //event.offsetの小数点部分
    console.log(event.offsetX/scale-Math.floor(event.offsetX/scale),event.offsetY/scale-Math.floor(event.offsetY/scale));
    //imgXの小数点部分
    console.log((imgX-Math.floor(imgX))/scale,(imgY-Math.floor(imgY))/scale);
    
});


// ピクセル加筆・消去処理（draw / erase モード用）
function drawOrErase(event) {
  const x = Math.floor(event.offsetX / pixelSize) * pixelSize;
  const y = Math.floor(event.offsetY / pixelSize) * pixelSize;
  
  if (mode === "erase") {
      ctx.clearRect(x, y, pixelSize, pixelSize); // ピクセル削除
  } else if (mode === "draw") {
      ctx.fillStyle = "black"; // 描画色
      ctx.fillRect(x, y, pixelSize, pixelSize);
  }
}

// 拡大縮小
canvas.addEventListener("wheel", function(event) {
    event.preventDefault();

    // マウス位置をキャンバス座標系に変換
    const rect = canvas.getBoundingClientRect();
    const mouseCanvasX = event.clientX - rect.left;
    const mouseCanvasY = event.clientY - rect.top;

    // スケール前のマウス位置を取得（画像座標系）
    const beforeX = (mouseCanvasX - imgX) / scale;
    const beforeY = (mouseCanvasY - imgY) / scale;

    // スケール更新（拡大 or 縮小
    let newscale = scale;
    if (event.deltaY < 0) {
        newscale *= scaleFactor; // 拡大
    } else {
        newscale /= scaleFactor; // 縮小
    }

    // 上限・下限を適用
    newscale = Math.min(Math.max(newscale, minscale), maxscale);

    // スケールの変化量を計算
    const scaleChange = newscale / scale;  // 拡大率の変化

    // スケール後のマウス位置を取得（画像座標系）
    const afterX = (mouseCanvasX - imgX) / newscale;
    const afterY = (mouseCanvasY - imgY) / newscale;

    // 画像のオフセットを補正
    imgX += (afterX - beforeX) * newscale;
    imgY += (afterY - beforeY) * newscale;

    // 更新したスケールを適用
    scale = newscale;

    display(); // 再描画
});

// 画像の移動範囲を制限する関数 //使ってない
function limitImagePosition() {
  const imgWidth = img_size * scale;
  const imgHeight = img_size * scale;
  
  const minX = -canvas.width / 2 - imgWidth / 2;
  const maxX = canvas.width / 2 + imgWidth / 2;
  const minY = -canvas.height / 2 - imgHeight / 2;
  const maxY = canvas.height / 2 + imgHeight / 2;

  // 画像が範囲外に行かないように制限
  imgX = Math.max(minX, Math.min(maxX, imgX));
  imgY = Math.max(minY, Math.min(maxY, imgY));
}

// 指定した座標 (x, y) にピクセルを書き込む関数
let width = 256;
let height = 256;
function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= width || y < 0 || y >= height) return; // 範囲外なら無視
    console.log(x,y)
    const index = (y * width + x) * 4; // RGBA の 1D 配列のインデックス
    dotDataArray.data[index] = r;     // 赤
    dotDataArray.data[index + 1] = g; // 緑
    dotDataArray.data[index + 2] = b; // 青
    dotDataArray.data[index + 3] = a; // アルファ（透明度）
}
