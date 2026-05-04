import type { Area } from 'react-easy-crop'

async function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener('load', () => resolve(img))
    img.addEventListener('error', reject)
    img.setAttribute('crossOrigin', 'anonymous')
    img.src = url
  })
}

export async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation: number,
): Promise<Blob> {
  const image = await createImage(imageSrc)

  const rad = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const bW = image.width * cos + image.height * sin
  const bH = image.width * sin + image.height * cos

  const offscreen = document.createElement('canvas')
  offscreen.width = bW
  offscreen.height = bH
  const offCtx = offscreen.getContext('2d')!
  offCtx.translate(bW / 2, bH / 2)
  offCtx.rotate(rad)
  offCtx.drawImage(image, -image.width / 2, -image.height / 2)

  const canvas = document.createElement('canvas')
  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(offscreen, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height)

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas toBlob failed'))),
      'image/webp',
      0.92,
    ),
  )
}
