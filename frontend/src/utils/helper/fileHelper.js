import { compressAccurately } from 'image-conversion'

export const compressUploadImage = (file, maxSize = 1024) => {
  return new Promise((resolve, reject) => {
    const imageLimit = maxSize > 200 ? maxSize - 100 : maxSize
    if (file.size > maxSize * 1024) {
      compressAccurately(file, imageLimit)
        .then((blob) => {
          const newFile = new window.File([blob], file.name, {
            type: file.type,
          })
          resolve(newFile)
        })
        .catch(() => {
          reject()
        })
    } else {
      resolve(file)
    }
  })
}

// 获取附件的base64
export const getFileBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = (error) => reject(error)
  })
}
