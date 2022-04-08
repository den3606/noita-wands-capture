const cv = require('../../lib/opencv4.5.5');

// const data = {
//   srcOffscreen: srcOffscreen,
//   templateOffscreen: templateOffscreen,
//   videoWidth: video.videoWidth,
//   videoHeight: video.videoHeight,
//   srcBase64: createCanvas(video, video.videoWidth, video.videoHeight).toDataURL(),
//   templateBase64: fs.readFileSync(TEMPLATE_IMAGE).toString('base64')
// };

onmessage = async function (event) {
  const message = event.data;
  const srcImage = createImage(message.srsBase64);
  const templateImage = createImage(message.templateBase64);
  const srcCanvas = createCanvas(message.srcOffscreen, srcImage, message.videoWidth, message.videoHeight);
  const templateCanvas = createCanvas(message.templateOffscreen, templateImage);

  const tempBlob = await loadAsBlob('../../resources/images/template2.png')
  const tempImage = await createImageBitmap(imageBlob)
  const imageBlob = await loadAsBlob('../../tmp/images/1649331743612.png')
  const sourceImage = await createImageBitmap(imageBlob)
  ctx.drawImage(sourceImage, 0, 0)
  // const srcMat = cv.imread(srcCanvas);
  // const templateMat = cv.imread(templateCanvas);
  // console.log(srcMat, templateMat);
  // let dst = new cv.Mat();
  // let mask = new cv.Mat();
  try {
    // cv.matchTemplate(srcMat, templateMat, dst, cv.TM_CCORR_NORMED, mask);
    // const minMax = cv.minMaxLoc(dst, mask)
    const minMax = 1;
    postMessage({ isSuccess: true, minMax: minMax });
  } catch (e) {
    console.error(Date.now());
    console.error("opencvの比較でエラーが発生しました。判定をスキップして画面を再読込します");
    postMessage({ isSuccess: false });
  }
}

async function createImage(base64) {
  return await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = base64;
  });
}

function createCanvas(canvas, source, width = null, height = null) {
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
