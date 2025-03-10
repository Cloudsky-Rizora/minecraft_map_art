//マイクラのブロック,色,画像リスト（仮）
const minecraftBlocks = [
    // { name: "white_concrete.png", color: [205,210,211] },
    // { name: "light_gray_concrete.png", color: [126,126,116] },
    // { name: "gray_concrete.png", color: [54,57,61] },
    // { name: "black_concrete.png", color: [8,10,15] },
    // { name: "brown_concrete.png", color: [94,55,25] },
    // { name: "red_concrete.png", color: [141,33,33] },
    // { name: "orange_concrete.png", color: [222,98,2] },
    // { name: "yellow_concrete.png", color: [239,176,13] },
    // { name: "lime_concretee.png", color: [92,166,24] },
    // { name: "green_concrete.png", color: [72,90,36] },
    // { name: "cyan_concrete.png", color: [21,118,134] },
    // { name: "light_blue_concrete.png", color: [32,137,199] },
    // { name: "blue_concrete.png", color: [44,46,142] },
    // { name: "purple_concrete.png", color: [100,32,155] },
    // { name: "magenta_concrete.png", color: [168,43,158] },
    // { name: "pink_concrete.png", color: [209,99,139] },
    
    { name: "white_wool.png", color: [205,210,211] },
    { name: "light_gray_wool.png", color: [126,126,116] },
    { name: "gray_wool.png", color: [54,57,61] },
    { name: "black_wool.png", color: [8,10,15] },
    { name: "brown_wool.png", color: [94,55,25] },
    { name: "red_wool.png", color: [141,33,33] },
    { name: "orange_wool.png", color: [222,98,2] },
    { name: "yellow_wool.png", color: [239,176,13] },
    { name: "lime_wool.png", color: [92,166,24] },
    { name: "green_wool.png", color: [72,90,36] },
    { name: "cyan_wool.png", color: [21,118,134] },
    { name: "light_blue_wool.png", color: [32,137,199] },
    { name: "blue_wool.png", color: [44,46,142] },
    { name: "purple_wool.png", color: [100,32,155] },
    { name: "magenta_wool.png", color: [168,43,158] },
    { name: "pink_wool.png", color: [209,99,139] },
    { name: "bookshelf.png", color: [999,999,999] },
];


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
function get_pixel_data(img_size,aspect_rate){
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Canvasサイズを設定
    canvas.width = img_size;
    canvas.height = img_size*aspect_rate;

    // 画像をリサイズして描画
    ctx.drawImage(img, 0, 0, img_size, img_size*aspect_rate);

    // ピクセル情報を取得
    const imageData = ctx.getImageData(0, 0, img_size, img_size*aspect_rate); //元の画像のRGB
    const data = imageData.data;
    return data;
};

//すべての画像を事前ロードする関数
function preloadImages(blockList,blockImages) {
    return Promise.all(blockList.map(block => {
        return new Promise(resolve => {
            let img = new Image();
            //img.crossOrigin = "anonymous"; // クロスオリジン対応
            img.src = `./block_img/${block.name}`;
            img.onload = () => {
                blockImages[block.name] = img;
                resolve();
            };
        });
    }));
};
//プレビュー表示するやつ
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
    //入力が何もなかったら警告文を返す
    if (img_size === "") {
        document.getElementById('result').textContent = "数値を入力してください";
        document.getElementById('result').style.color = "red";
    }
    else {
        document.getElementById('result').textContent = undefined;
    }
    //rgbaデータの取得
    pixel_data = get_pixel_data(img_size,aspect_rate);

    // 新しいCanvasでドット絵を作成
    //下10行程度は調整用
    //dotcanvasを取得
    const dotCanvas = document.getElementById('dotCanvas');
    const dotCtx = dotCanvas.getContext('2d');
    //dotcanvasのwidth,heightを設定
    dotCanvas.width = 512;
    dotCanvas.height = 512 * aspect_rate;
    //dotcanvasの表示width,表示heightを設定
    dotCanvas.style.width = `${dotCanvas.width}px`;
    dotCanvas.style.height = `${dotCanvas.height}px`;
    //popupの大きさを設定
    const popup_content = document.getElementsByClassName('popup-content');
    popup_content[0].style.width = "512px";
    

    //近い色のブロックの画像を置く
    //canvasの初期設定
    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext("2d");
    tmpCanvas.width = dotCanvas.width*16;
    tmpCanvas.height = dotCanvas.height*16;

    const blockImages = {}; // 画像キャッシュ用オブジェクト
    const blockList = minecraftBlocks; // すべてのマイクラブロックのリストを取得
    
    //すべての画像を事前ロード
    preloadImages(blockList,blockImages);
    //画像をプリロードし、完了後に描画を開始
    preloadImages(blockList,blockList).then(() => {
        renderCanvas(); // 画像がロードされた後に描画
    });
    
    //描画処理関数
    const blockSize = dotCanvas.width / img_size;
    function renderCanvas() {
        for (let y = 0; y < img_size*aspect_rate; y++) {
            for (let x = 0; x < img_size; x++) {
                const index = (y * img_size + x) * 4;
                const r = pixel_data[index];
                const g = pixel_data[index + 1];
                const b = pixel_data[index + 2];

                const closestBlock = findClosestMinecraftBlock(r, g, b); // 近い色のブロックを取得
                const img2 = blockImages[closestBlock.name]; // キャッシュから画像を取得

                if (img2) {
                    tmpCtx.drawImage(img2, x * blockSize, y * blockSize, blockSize, blockSize); 
                }
            }
        }

        // 最後に描画
        dotCtx.drawImage(tmpCanvas, 0, 0);
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
    console.log(img_size);
    sessionStorage.setItem("aspect_rate",aspect_rate);
  });