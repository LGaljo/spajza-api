import * as Jimp from 'jimp';

export async function cropImage(file) {
  const image = await Jimp.read(file.buffer);
  console.log(image.getWidth(), image.getHeight());
  // image.crop();
  image.resize(800, Jimp.AUTO, Jimp.RESIZE_NEAREST_NEIGHBOR).quality(80);
  return image;
}
