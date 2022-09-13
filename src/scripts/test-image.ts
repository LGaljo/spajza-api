import * as path from 'path';
import * as Jimp from 'jimp';

(async () => {
  await Jimp.read(path.join(__dirname, '..', '..', 'image.png'), (err, image) => {
    console.log(image.getWidth(), image.getHeight());
    const h = image.getHeight();
    const w = image.getWidth();
    if (h !== w) {
      image.crop(
        w < h ? 0 : Math.abs(w - h) / 2,
        w < h ? Math.abs(w - h) / 2 : 0,
        Math.min(w, h),
        Math.min(w, h),
      );
    }
    image
      .resize(Math.min(Math.min(w, h), 800), Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR)
      .quality(80);
    image.write('image-crop.' + image.getExtension());
  });

  process.exit();
})().catch(async (err) => {
  console.log(err);
});
