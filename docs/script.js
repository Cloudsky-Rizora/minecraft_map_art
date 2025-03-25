sessionStorage.clear(); // すべてのデータを削除

//マイクラのブロック,色,画像リストをjsonから引っ張ってくる関数
function loadMinecraftBlocks() {
    return fetch('minecraftBlocks.json')
        .then(response => response.json())
        .then(minecraftBlocks_list => minecraftBlocks_list);
}

//jsonから引っ張ってきたら結果をjsonに存在する形で受け取る関数
let minecraftBlocks;
let blocks = loadMinecraftBlocks();
blocks.then(result => {
    minecraftBlocks = result;
});

//名前から、名前などすべてを含むリストを取得
function getBlockByName(minecraftBlocks, targetName) {
    return minecraftBlocks.find(block => block.name === targetName);
}

//光ってるブロックを使用ブロックリストに入れる関数
function loadGlowblock(){
    let blockname_list = [];
    //現在光っている要素（glow クラスがついている img）を取得
    const glowingImages = document.querySelectorAll(".block_image.glow");

    //glowingImages から src のみ取得（Setを使って重複を除去）
    const glowingSrcSet = new Set([...glowingImages].map(img => img.src));

    //glowingSrcSetから該当するブロックの名前を取得
    const blockname = [...glowingSrcSet].map(url => url.split('/').pop());

    for (let i = 0; i < blockname.length; i++){
        blockname_list.push(getBlockByName(minecraftBlocks, blockname[i]));
    }
    return blockname_list;
};


//最も近い色のマイクラブロックを探す関数
function findClosestMinecraftBlock(glowBlock_list,r, g, b) {
    let closestBlock = { name: "bookshelf.png", color: [0,0,0], number:32};
    let minDistance = Infinity;
    
    glowBlock_list.forEach(block => {
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
    const imageData = ctx.getImageData(0, 0, img_width, Math.round(img_width*aspect_rate)); //元の画像のRGB
    const data = imageData.data;
    return data;
};

//RGBAのAを消す関数
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

//数字取得＆dot画像に変換 横幅が大きいと表示されないバグ
let img_width = 128;
let glowMinecraftBlocks;
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
    //選択したブロックのみを使用する
    glowMinecraftBlocks = loadGlowblock();

    let block_number_list =[];
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
    dotCanvas.height = Math.round(img_width*aspect_rate)*16;
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

    //画像をプリロードし、完了後に描画を開始
    preloadImages(minecraftBlocks,blockImages).then(() => {
        renderCanvas(); // 画像がロードされた後に描画
    });
    
    //描画処理関数
    const blockSize = 16;
    function renderCanvas() {
        for (let y = 0; y < Math.round(img_width*aspect_rate); y++) {
            for (let x = 0; x < img_width; x++) {
                const index = (y * img_width + x) * 3;
                const r = pixel_data[index];
                const g = pixel_data[index + 1];
                const b = pixel_data[index + 2];

                const closestBlock = findClosestMinecraftBlock(glowMinecraftBlocks,r, g, b); // 近い色のブロックを取得
                block_number_list.push(closestBlock.number);
                const img2 = blockImages[closestBlock.name]; // キャッシュから画像を取得
                if (img2) {
                    tmpCtx.drawImage(img2, x * blockSize, y * blockSize, blockSize, blockSize); 
                }
            }
        }
        //block_number_listをランレングス変換
        let compressed_block_number_list = compressArray(block_number_list);
        sessionStorage.setItem("compressed_pixel_data",compressed_block_number_list);
        
        // 最後に描画
        dotCtx.drawImage(tmpCanvas, 0, 0);
        console.log("draw_complete");
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

//ブロックボタンを押したときに押されたブロックの使用をon,offする
document.querySelectorAll(".block_image").forEach(img => {
    img.addEventListener("click", function() {
        img.classList.toggle("glow");
    });
});

document.querySelectorAll("input[type='checkbox']").forEach(checkbox => {
    checkbox.addEventListener("change", function() {
        // チェックボックスの親要素（div）内の画像を取得
        const images = this.parentElement.querySelectorAll(".block_image");

        // チェックの状態に応じて glow クラスを追加または削除
        images.forEach(img => {
            this.checked ? img.classList.add("glow") : img.classList.remove("glow");
        });
    });
});

// ドット絵を次のページに渡す
document.getElementById('editButton').addEventListener('click', function() {
    sessionStorage.setItem("img_width",img_width);
    sessionStorage.setItem("aspect_rate",aspect_rate);
});