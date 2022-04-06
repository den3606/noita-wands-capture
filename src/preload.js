const { executionAsyncResource } = require('async_hooks')
const { ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')
const cv = require('../lib/opencv4.5.5')

const MIN_THRESHOLD = 0.70 // しきい値
const MAX_THRESHOLD = 0.97 // しきい値
const REFRESH_RATE = 500 // 更新頻度(ms)
const IS_SAVE_CAPTURE_IMAGE = false // キャプチャ時の画像を`tmp/images/`に保存するか
const TEMPLATE_IMAGE = './resources/images/template2.png' // 参考画像


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
    })
    handleStream(stream)
  } catch (e) {
    handleError(e)
  }
})

function handleStream(stream) {
  // Create hidden video tag
  const video = document.createElement('video');
  video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

  // Event connected to stream
  video.onloadedmetadata = function (e) {
    // Set video ORIGINAL height (screenshot)
    video.style.height = this.videoHeight + 'px'; // videoHeight
    video.style.width = this.videoWidth + 'px'; // videoWidth

    video.play();

    const execute = async () => {
      srcCanvas = document.createElement('canvas');
      srcCanvas.width = this.videoWidth;
      srcCanvas.height = this.videoHeight;

      const srcCtx = srcCanvas.getContext('2d');

      const templateCanvas = document.createElement('canvas')
      const templateCtx = templateCanvas.getContext('2d');

      const img = await new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = (e) => reject(e)
        const nativeImg = fs.readFileSync(TEMPLATE_IMAGE)
        img.src = 'data:image/png;base64,' + nativeImg.toString('base64')
      })

      templateCtx.drawImage(img, 0, 0);
      const templateMat = cv.imread(templateCanvas);

      const previewAreaElement = document.getElementById("wands-preview-area")
      // 初期チェック
      refresh(previewAreaElement, srcCanvas)

      const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
      (async () => {
        let errorCount = 0;
        while (true) {
          await sleep(REFRESH_RATE);
          try {
            srcCtx.drawImage(video, 0, 0, srcCanvas.width, srcCanvas.height);

            const srcMat = cv.imread(srcCanvas);

            let dst = new cv.Mat();
            let mask = new cv.Mat();
            cv.matchTemplate(srcMat, templateMat, dst, cv.TM_CCORR_NORMED, mask);
            let result = cv.minMaxLoc(dst, mask);
            console.table(result)
            if (MIN_THRESHOLD < result.minVal && MAX_THRESHOLD < result.maxVal) {
              refresh(previewAreaElement, srcCanvas)
            }

          } catch (e) {
            console.log(e)
            console.log(errorCount)
            errorCount++
            if (errorCount > 3) {
              break
            }
          }
        }
        execute();
      })();
    }

    execute();

    // TODO: ポーズボタンが押された時
    // video.pause();

    // TODO: 停止ボタンが押されたときに実装する
    // try {
    //   // Destroy connect to stream
    //   stream.getTracks()[0].stop();
    // } catch (e) { }
  }

  video.srcObject = stream;
  document.body.appendChild(video);
}

function refresh(previewAreaElement, srcCanvas) {
  previewAreaElement.setAttribute("src", srcCanvas.toDataURL('image/png'));

  if (IS_SAVE_CAPTURE_IMAGE) {
    const imageFilePath = path.join(process.cwd(), '/tmp/images/', Date.now() + '.png');
    const base64Data = srcCanvas.toDataURL().split(',')[1];
    fs.writeFile(imageFilePath, base64Data, "base64", function (err) {
      if (err) {
        return console.log("error: " + err)
      }
    });
  }
}


function handleError(e) {
  console.log(e)
}
