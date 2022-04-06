const { ipcRenderer } = require('electron')
const fs = require('fs')
const path = require('path')

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
  var video = document.createElement('video');
  video.style.cssText = 'position:absolute;top:-10000px;left:-10000px;';

  // Event connected to stream
  video.onloadedmetadata = function (e) {
    // Set video ORIGINAL height (screenshot)
    video.style.height = this.videoHeight + 'px'; // videoHeight
    video.style.width = this.videoWidth + 'px'; // videoWidth

    video.play();

    canvas = document.createElement('canvas');
    canvas.width = this.videoWidth;
    canvas.height = this.videoHeight;

    const ctx = canvas.getContext('2d');
    const previewAreaElement = document.getElementById("wands-preview-area")

    setInterval(() => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      previewAreaElement.setAttribute("src", canvas.toDataURL('image/png'));

      const imageFilePath = path.join(process.cwd(), '/tmp/images/', Date.now() + '.png');
      const base64Data = canvas.toDataURL().split(',')[1];

      // TODO: 削除オプションを付けたときに有効化する
      // fs.writeFile(imageFilePath, base64Data, "base64", function (err) {
      //   if (err) {
      //     return console.log("error: " + err)
      //   }
      // });
    }, 100)

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


function handleError(e) {
  console.log(e)
}
