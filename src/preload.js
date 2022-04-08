const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const cv = require('../lib/opencv4.5.5');

const MAX_THRESHOLD = 0.971; // しきい値
const WAIT_TIME = 500; // 更新間隔
const IS_SAVE_CAPTURE_IMAGE = true; // キャプチャ時の画像を`tmp/images/`に保存するか
const TEMPLATE_IMAGE = './resources/images/template2.png'; // 参考画像


ipcRenderer.on('noita-screen-id', async (event, sourceId) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: sourceId,
          minWidth: 1000,
          maxWidth: 4000,
          minHeight: 600,
          maxHeight: 4000
        }
      }
    });
    console.log("⭕画面のキャプチャに成功しました");
    handleStream(stream);
  } catch (e) {
    console.error(Date.now());
    console.error("❌画面のキャプチャに失敗しました");
    handleError(e);
  }
});

function handleStream(stream) {

  const video = document.createElement('video');
  video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

  video.onloadedmetadata = (event) => {
    video.style.height = this.videoHeight + 'px';
    video.style.width = this.videoWidth + 'px';
    executeWandsCapture(event, video);
  }

  video.srcObject = stream;
  document.body.appendChild(video);
}

function handleError(e) {
  console.log(e);
}

async function executeWandsCapture(event, video) {
  const templateImage = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = 'data:image/png;base64,' + fs.readFileSync(TEMPLATE_IMAGE).toString('base64');
  });

  video.play();

  await subscribe(() => {
    const templateCanvas = createCanvas(templateImage);
    const templateMat = cv.imread(templateCanvas);
    const srcCanvas = createCanvas(video, video.videoWidth, video.videoHeight);
    const srcMat = cv.imread(srcCanvas);
    let dst = new cv.Mat();
    let mask = new cv.Mat();

    const deleteMats = (...mats) => mats.forEach(mat => mat.delete());

    try {
      cv.matchTemplate(srcMat, templateMat, dst, cv.TM_CCORR_NORMED, mask);
    } catch (e) {
      console.error("opencvの比較でエラーが発生しました。判定をスキップします。");
      console.error(e);
      deleteMats(dst, mask, templateMat, srcMat);
      return { isSuccess: false };
    }
    const minMax = cv.minMaxLoc(dst, mask);
    deleteMats(dst, mask, templateMat, srcMat);
    return { isSuccess: true, minMax: minMax, srcCanvas: srcCanvas };
  });
}


async function subscribe(callback) {
  try {
    const result = await new Promise((resolve, reject) => {
      setTimeout(() => {
        const result = callback();
        if (!result.isSuccess) {
          return reject("OpenCVの画像比較でエラーが発生しました。");
        }

        console.table(result.minMax);
        if (MAX_THRESHOLD < result.minMax.maxVal) {
          return resolve({ isWandsScene: true, srcCanvas: result.srcCanvas })
        } else {
          return resolve({ isWandsScene: false, srcCanvas: result.srcCanvas })
        }
      }, WAIT_TIME);
    });

    if (result.isWandsScene) {
      refreshDisplay(result.srcCanvas);
      saveCanvasImage(result.srcCanvas);
      await subscribe(callback);
    } else {
      await subscribe(callback);
    }
  } catch (err) {
    console.error("想定外のエラーが発生しました、一秒後再実行します");
    console.error(err);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await subscribe(callback);
  };
}


function createCanvas(source, width = null, height = null) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (width != null && height != null) {
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.drawImage(source, 0, 0);
  }
  return canvas;
}


function refreshDisplay(canvas) {
  const previewAreaElement = document.getElementById("wands-preview-area");
  previewAreaElement.setAttribute("src", canvas.toDataURL('image/png'));
}

function saveCanvasImage(canvas) {
  if (IS_SAVE_CAPTURE_IMAGE) {
    const imageFilePath = path.join(process.cwd(), '/tmp/images/', Date.now() + '.png');
    const base64Data = canvas.toDataURL().split(',')[1];
    fs.writeFile(imageFilePath, base64Data, "base64", function (err) {
      if (err) {
        return console.error("error: " + err);
      }
    });
  }
}



  // TODO: ポーズボタンが押された時
  // video.pause();

  // TODO: 停止ボタンが押されたときに実装する
  // try {
  //   // Destroy connect to stream
  //   stream.getTracks()[0].stop();
  // } catch (e) { }
