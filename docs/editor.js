//ドット絵を次のページで受け取る
const compressed_pixel_data = sessionStorage.getItem("compressed_pixel_data");
const img_width = sessionStorage.getItem('img_width');
const aspect_rate = sessionStorage.getItem('aspect_rate');

//マイクラのブロック,色,画像リストをjsonから引っ張ってくる関数
async function loadMinecraftBlocks() {
    const response = await fetch('minecraftBlocks.json');
    const minecraftBlocks_list = await response.json();
    return minecraftBlocks_list;
}

async function fetchAndStoreMinecraftBlocks() {
    minecraftBlocks = await loadMinecraftBlocks();
}

let minecraftBlocks;
const blockImages = {}; // 画像キャッシュ用オブジェクト
fetchAndStoreMinecraftBlocks().then(() => {
    //画像をプリロードし、完了後に描画を開始
    preloadImages(minecraftBlocks,blockImages).then(() => {
        renderCanvas(compressed_pixel_data.split(",").map(Number)); // 画像がロードされた後に描画
    })
})

//関数の用意
//すべての画像を事前ロードする関数
function preloadImages(blockList,blockImages) {
    return Promise.all(blockList.map(block => {
        return new Promise(resolve => {
            let img = new Image();
            img.src = `./block_img/${block.name}`;
            img.onload = () => {
                blockImages[block.number] = img;
                resolve();
            };
        });
    }));
}

//minecraftBlocksのnameからnumberへ変換する関数
function getBlockNumberByName(name) {
    const block = minecraftBlocks.find(block => block.name === name);
    return block ? block.number : 32; // 見つからなかった場合は本棚の値を返す
}

//minecraftBlocksのnumberからnameへ変換する関数
function getBlockNameByNumber(number) {
    //if (!Array.isArray(minecraftBlocks)) return "Bookshelf"; // 配列が未定義の場合の対策
    const block = minecraftBlocks.find(block => block.number === number);
    return block ? block.name : "Bookshelf.png"; // 見つからなかった場合は本棚を返す
}

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

//tmpcanvasにブロックでドット化した画像を写す関数
let block_name_list = []; //コマンド生成のためのblocknameが入ったリスト生成
function renderCanvas(array, blockSize = 16, imgwidth = Number(img_width)) {
    let sum_block = 0;

    for (let num = 0; num < array.length; num += 2) {
        const img_num = array[num];
        const block_len = array[num + 1];
        const img2 = blockImages[img_num]; // 画像キャッシュを取得

        if (img2) {
            let end_block = sum_block + block_len;
            for (let i = sum_block; i < end_block; i++) {
                let x = i % imgwidth;
                let y = (i / imgwidth) | 0; // Math.floor(i / imgwidth) より高速

                // y 行目の配列がなければ作成
                if (!block_name_list[y]) {
                    block_name_list[y] = [];
                }

                tmpCtx.drawImage(img2, x * blockSize, y * blockSize, blockSize, blockSize); //画像を描画
                block_name_list[y].push(getBlockNameByNumber(img_num)); //各yごとの配列にブロック名を追加
            }
        }
        sum_block += block_len;
    }
    display();
    // console.log(block_name_list);
}

//tmpcanvasにブロックでドット化した画像を写す関数2
function renderCanvas2(array2, blockSize = 16){
    let temp = tmpCanvas.width;
    tmpCanvas.width = tmpCanvas.height;
    tmpCanvas.height = temp;
    for (let y = 0; y < array2.length; y ++) {
        for (let x = 0; x <  array2[y].length; x ++) {
            const img2 = blockImages[getBlockNumberByName(array2[y][x])]; // 画像キャッシュを取得
            tmpCtx.drawImage(img2, x * blockSize, y * blockSize, blockSize, blockSize); //画像を描画
        }
    }
    display();
}

//tmpcanvasにブロックでドット化した画像を写す関数3
function renderCanvas3(array3, blockSize = 16){
    for (let y = 0; y < array3.length; y ++) {
        for (let x = 0; x <  array3[y].length; x ++) {
            const img2 = blockImages[getBlockNumberByName(array3[y][x])]; // 画像キャッシュを取得
            tmpCtx.drawImage(img2, x * blockSize, y * blockSize, blockSize, blockSize); //画像を描画
        }
    }
    display();
}

//配列をランレングス圧縮する関数
function compressArray(arr) {
    let compressed = [];
    let count = 1;
    
    for (let i = 1; i <= arr.length; i++) {
        if (arr[i] === arr[i - 1]) {
            count++;
        } else {
            compressed.push(arr[i - 1], count);
            count = 1;
        }
    }
    return compressed;
}

// 2次元配列を左に90度回転させる関数
function rot_left(array) {
    const ROW = array.length;
    const COL = array[0].length;
    const col = COL-1;
    const a = [];//new Array(COL);
    for (let c=0; c<COL; c++) {
      a[c] = [];//new Array(ROW);
      for (let r=0; r<ROW; r++) {
        a[c][r] = array[r][col-c];
      }
    }
    return a;
}

//二次元配列を左右反転させる関数
function mirror(array) {
    return array.map(row => row.reverse());
}

// 2次元配列を右に90度回転させる関数
function rot_right(array) {
    const ROW = array.length;
    const COL = array[0].length;
    const row = ROW-1;
    const a = [];//new Array(COL);
    for (let c=0; c<COL; c++) {
      a[c] = [];//new Array(ROW);
      for (let r=0; r<ROW; r++) {
        a[c][r] = array[row-r][c];
      }
    }
    return a;
}

//圧縮されたブロックの配置listをマイクラのコマンドに書き換える関数(xz面,原点左下)
function toCommand(array, X = 0, Y = 64, Z = 0) {
    let command_list = [];
    let compressed_list = [];
    // 圧縮処理
    for (let x = array.length-1; x >= 0; x--) {
        compressed_list.push(compressArray(array[x]));
    }

    for (let x = compressed_list.length-1; x >= 0; x--) {
        let start = 0;
        let end = 0;

        for (let z = 0; z < compressed_list[x].length; z += 2) {
            let block_name = compressed_list[x][z];
            let block_len = compressed_list[x][z+1];

            end = start + block_len - 1;
            command_list.push(`fill ${x + X} ${Y} ${start + Z} ${x + X} ${Y} ${end + Z} minecraft:${block_name.replace(/\.png$/, "")}`);

            start += block_len;
        }
    }
    return command_list;
}
//command.txtダウンロード関数
async function saveCommandsToFile(command_list) {
    const zip = new JSZip();

    // フォルダを作成（階層構造）
    const dot = zip.folder("dot");
    const data = dot.folder("data");
    const dot_command_function = data.folder("dot_command_functions");
    const functions = dot_command_function.folder("function");
    const jsonData = {
        "pack": {
          "pack_format": 55,
          "description": "datapack"
        }
      };
    // 配列の各要素を改行で結合
    let text = command_list.join("\n");

    // Blob を作成
    dot.file("pack.mcmeta", JSON.stringify(jsonData, null, 2));
    functions.file("command.mcfunction",text);

    // ZIPを生成してダウンロード
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "nested_folders.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url); // メモリ解放
}


//キャンバスの用意
const canvas = document.getElementById('dotCanvas')
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
//tmpCanvasの用意
const tmpCanvas = document.createElement('canvas');
const tmpCtx = tmpCanvas.getContext("2d");
tmpCanvas.width = img_width*16;
tmpCanvas.height = Math.round(img_width*aspect_rate)*16;

//ドット絵関係の初期設定
//拡大縮小要素
let scale = 512/tmpCanvas.width;
const scaleFactor = 1.1;
const minscale = 0.01, maxscale = 10;

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
//移動or描画
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


//編集・消去処理（draw / erase モード用）
blockSize = 16;
function drawOrErase(event) {
    const x = Math.floor((event.offsetX-imgX)/scale/16);
    const y = Math.floor((event.offsetY-imgY)/scale/16);
    if (0 <= x && x < tmpCanvas.width/16 && 0 <= y && y < tmpCanvas.height/16){
        if (mode === "erase") {
            //airの画像をクリックした座標に置く(tmpctxの書き換え)(保存も)
            img2 = blockImages[999];
            tmpCtx.drawImage(img2, x * blockSize, y * blockSize, blockSize, blockSize);
            block_name_list[y][x] = "bookshelf.png";
            display();
        } 
        else if (mode === "draw") {
            //選択しているブロックの画像をくりっくした座標に置く(tmpctxの置き換え)
            img2 = blockImages[block_number];
            tmpCtx.drawImage(img2, x * blockSize, y * blockSize, blockSize, blockSize);
            block_name_list[y][x] = block_name;
            display();
        }
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
        block_number = getBlockNumberByName(block_name);
    });
});

//左回転ボタンが押されたときにblock_name_listとプレビューを回転させる関数
document.getElementById("rot_left").addEventListener("click",function(){
    block_name_list = rot_left(block_name_list);
    renderCanvas2(block_name_list);
});

//左右反転ボタンが押されたときにblock_name_listとプレビューを左右反転させる関数
document.getElementById("mirror").addEventListener("click",function(){
    block_name_list = mirror(block_name_list);
    renderCanvas3(block_name_list);
});

//右回転ボタンが押されたときにblock_name_listとプレビューを回転させる関数
document.getElementById("rot_right").addEventListener("click",function(){
    block_name_list = rot_right(block_name_list);
    renderCanvas2(block_name_list);
});

//コマンド生成ボタンが押されたときにコマンドを生成する関数
document.getElementById("commandButton").addEventListener("click",function(){
    // let block_num_list = block_name_list.flat().map(name => getBlockNumberByName(name));
    // let compressed_edit_data = compressArray(block_num_list).join(',');
    command_list = toCommand(block_name_list,-64,-2,192);
    saveCommandsToFile(command_list);
});