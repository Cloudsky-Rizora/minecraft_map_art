//ドット絵を次のページで受け取る
const pixel_data = sessionStorage.getItem('pixel_data').split(',').map(Number); //RGBAのただの配列
const img_width = sessionStorage.getItem('img_width');
const aspect_rate = sessionStorage.getItem('aspect_rate');

//マイクラのブロックの用意
const minecraftBlocks = [
    { name: "black_concrete.png", color: [8,10,15] },
    { name: "blue_concrete.png", color: [44,46,142] },
    { name: "brown_concrete.png", color: [94,55,25] },
    { name: "cyan_concrete.png", color: [21,118,134] },
    { name: "gray_concrete.png", color: [54,57,61] },
    { name: "green_concrete.png", color: [72,90,36] },
    { name: "light_blue_concrete.png", color: [32,137,199] },
    { name: "light_gray_concrete.png", color: [126,126,116] },
    { name: "lime_concrete.png", color: [92,166,24] },
    { name: "magenta_concrete.png", color: [168,43,158] },
    { name: "orange_concrete.png", color: [222,98,2] },
    { name: "pink_concrete.png", color: [209,99,139] },
    { name: "purple_concrete.png", color: [100,32,155] },
    { name: "red_concrete.png", color: [141,33,33] },
    { name: "white_concrete.png", color: [205,210,211] },
    { name: "yellow_concrete.png", color: [239,176,13] },


    { name: "black_wool.png", color: [12,14,18] },
    { name: "blue_wool.png", color: [47,50,148] },
    { name: "brown_wool.png", color: [103,64,35] },
    { name: "cyan_wool.png", color: [21,126,139] },
    { name: "gray_wool.png", color: [51,61,65] },
    { name: "green_wool.png", color: [77,99,32] },
    { name: "light_blue_wool.png", color: [44,155,207] },
    { name: "light_gray_wool.png", color: [132,132,123] },
    { name: "lime_wool.png", color: [101,175,24] },
    { name: "magenta_wool.png", color: [177,56,167] },
    { name: "orange_wool.png", color: [232,104,7] },
    { name: "pink_wool.png", color: [229,117,155] },
    { name: "purple_wool.png", color: [108,35,162] },
    { name: "red_wool.png", color: [149,34,33] },
    { name: "white_wool.png", color: [218,223,224] },
    { name: "yellow_wool.png", color: [245,185,28] },
    
    
    { name: "bookshelf.png", color: [999,999,999] },
];

//関数の用意
//最も近い色のマイクラブロックを探す関数
function findClosestMinecraftBlock(r, g, b) {
    let closestBlock = { name: "bookshelf.png", color: [0,0,0] };
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

//画像のpixeldata(rgba)を取得する関数
function get_pixel_data(img_width,aspect_rate){
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Canvasサイズを設定
    canvas.width = img_width;
    canvas.height = img_width*aspect_rate;

    // 画像をリサイズして描画
    ctx.drawImage(img, 0, 0, img_width, img_width*aspect_rate);

    // ピクセル情報を取得
    const imageData = ctx.getImageData(0, 0, img_width, img_width*aspect_rate); //元の画像のRGB
    const data = imageData.data;
    return data;
};

//すべての画像を事前ロードする関数
function preloadImages(blockList,blockImages) {
    return Promise.all(blockList.map(block => {
        return new Promise(resolve => {
            let img = new Image();
            img.src = `./block_img/${block.name}`;
            img.onload = () => {
                blockImages[block.name] = img;
                resolve();
            };
        });
    }));
};

//キャンバスの用意
const canvas = document.getElementById('dotCanvas')
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
const tmpCanvas = document.createElement('canvas');
const tmpCtx = tmpCanvas.getContext("2d");

tmpCanvas.width = img_width*16;
tmpCanvas.height = Math.round(img_width*aspect_rate)*16;

const blockImages = {}; // 画像キャッシュ用オブジェクト
const blockList = minecraftBlocks; // すべてのマイクラブロックのリストを取得

//コマンド生成のためのblocknameが入ったリスト生成
let block_name_list = [];

//画像をプリロードし、完了後に描画を開始
preloadImages(blockList,blockImages).then(() => {
    renderCanvas(); // 画像がロードされた後に描画
});

//tmpcanvasにブロックでドット化した画像を写す
const blockSize = 16;
function renderCanvas() {
    for (let y = 0; y < Math.round(img_width*aspect_rate); y++) {
        for (let x = 0; x < img_width; x++) {
            const index = (y * img_width + x) * 3;
            const r = pixel_data[index];
            const g = pixel_data[index + 1];
            const b = pixel_data[index + 2];

            const closestBlock = findClosestMinecraftBlock(r, g, b); // 近い色のブロックを取得
            const img2 = blockImages[closestBlock.name]; // キャッシュから画像を取得
            if (img2) {
                tmpCtx.drawImage(img2, x * blockSize, y * blockSize, blockSize, blockSize);
                block_name_list.splice(y * img_width + x,0,closestBlock.name);
            }
        }
    }
    display();
};
console.log(block_name_list);

//ドット絵関係の初期設定
let scale = 512/tmpCanvas.width;//拡大縮小要素
const scaleFactor = 1.1;//拡大縮小要素
const minscale = 0.03, maxscale = 10;
let imgX = 0, imgY = 0; //画像のオフセット
let mouseX = canvas.width/2,mouseY = canvas.height/2;

//ドット絵のデータ処理＆描画

//モード切替初期設定
let mode = "move"; // 初期モード（"move", "erase", "draw"）
let isDragging = false;
let lastX, lastY;
let pixelSize = 16; // ピクセルサイズ（加筆・消去時）

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

canvas.addEventListener("click", (event) => {
	if (mode === "move" && isDragging) {
		dragImage(event);
	} else if (mode === "erase" || mode === "draw") {
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
function display() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // マウス位置を基準に拡大縮小
    ctx.translate(imgX, imgY);
    ctx.scale(scale, scale);

    // 一時キャンバスをメインキャンバスに描画（スケール・トランスレート適用）
    ctx.drawImage(tmpCanvas, 0,0, tmpCanvas.width, tmpCanvas.height);
    ctx.restore();
}

// クリックした時の座標をconsole.log
canvas.addEventListener("click", function(event) {
	//根幹
    console.log(Math.floor((event.offsetX-imgX)/scale/16),Math.floor((event.offsetY-imgY)/scale/16));
    //console.log()
});


// ピクセル加筆・消去処理（draw / erase モード用）
function drawOrErase(event) {
    const x = Math.floor((event.offsetX-imgX)/scale/16);
    const y = Math.floor((event.offsetY-imgY)/scale/16);

    if (mode === "erase") {
        //airの画像をクリックした座標に置く(tmpctxの書き換え)(保存も)

    } 
    else if (mode === "draw") {
        //選択しているブロックの画像をくりっくした座標に置く(tmpctxの置き換え)
        img2 = blockImages[block_name];
        tmpCtx.drawImage(img2, x * blockSize, y * blockSize, blockSize, blockSize);
        display();
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
  const imgWidth = img_width * scale;
  const imgHeight = img_width * scale;
  
  const minX = -canvas.width / 2 - imgWidth / 2;
  const maxX = canvas.width / 2 + imgWidth / 2;
  const minY = -canvas.height / 2 - imgHeight / 2;
  const maxY = canvas.height / 2 + imgHeight / 2;

  // 画像が範囲外に行かないように制限
  imgX = Math.max(minX, Math.min(maxX, imgX));
  imgY = Math.max(minY, Math.min(maxY, imgY));
}

//ブロックボタンを押したときに押されたブロックを反映する関数
document.querySelectorAll(".block_image").forEach(image => {
    image.addEventListener("click", function() {
        block_name = this.getAttribute("src").slice(10);
        console.log(block_name);
    });
});


//どの座標にどのブロックが置かれているか記録する配列が必要。