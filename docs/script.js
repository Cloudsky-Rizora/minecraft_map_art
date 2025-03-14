sessionStorage.clear(); // すべてのデータを削除

//マイクラのブロック,色,画像リスト（仮）
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

function removeAlphaFromRGBA(rgbaArray) {
    let rgbArray = [];
    for (let i = 0; i < rgbaArray.length; i += 4) {
        rgbArray.push(rgbaArray[i]);     // R
        rgbArray.push(rgbaArray[i + 1]); // G
        rgbArray.push(rgbaArray[i + 2]); // B
        // rgbaArray[i + 3] (A) は追加しない
    }
    return rgbArray;
}

//数字取得＆dot画像に変換
let img_width = 128;
document.getElementById('submitButton').addEventListener('click', function() {
    img_width = document.getElementById('numberInput').value;
    //入力が何もなかったら警告文を返す
    if (img_width === "") {
        document.getElementById('result').textContent = "数値を入力してください";
        document.getElementById('result').style.color = "red";
    }
    else {
        document.getElementById('result').textContent = undefined;
    }
    //rgbaデータの取得(後にドット化)
    pixel_data = get_pixel_data(img_width,aspect_rate);
    //透明度Aの情報を削除し、RGBのリストへ変換
    pixel_data = removeAlphaFromRGBA(pixel_data);

    // 新しいCanvasでドット絵を作成
    //下10行程度は調整用 後で関数化
    //dotcanvasを取得
    const dotCanvas = document.getElementById('dotCanvas');
    const dotCtx = dotCanvas.getContext('2d');
    //dotcanvasのwidth,heightを設定
    dotCanvas.width = img_width*16;
    dotCanvas.height =Math.round(img_width*aspect_rate)*16;
    //dotcanvasの表示width,表示heightを設定
    dotCanvas.style.width = "50vw";
    dotCanvas.style.height = `${50*aspect_rate}vw`;
    //popupの大きさを設定
    const popup_content = document.getElementsByClassName('popup-content');
    popup_content[0].style.width = "50vw";
    popup_content[0].style.height = `${60*aspect_rate}vw`;
    

    //近い色のブロックの画像を置く
    //canvasの初期設定
    const tmpCanvas = document.createElement('canvas');
    const tmpCtx = tmpCanvas.getContext("2d");
    tmpCanvas.width = dotCanvas.width;
    tmpCanvas.height = dotCanvas.height;

    const blockImages = {}; // 画像キャッシュ用オブジェクト
    const blockList = minecraftBlocks; // すべてのマイクラブロックのリストを取得

    //画像をプリロードし、完了後に描画を開始
    preloadImages(blockList,blockImages).then(() => {
        renderCanvas(); // 画像がロードされた後に描画
    });
    
    //描画処理関数
    const blockSize = 16;
    function renderCanvas() {
        for (let y = 0; y < img_width*aspect_rate; y++) {
            for (let x = 0; x < img_width; x++) {
                const index = (y * img_width + x) * 3;
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
    sessionStorage.setItem("pixel_data",pixel_data);
    sessionStorage.setItem("img_width",img_width);
    sessionStorage.setItem("aspect_rate",aspect_rate);
});