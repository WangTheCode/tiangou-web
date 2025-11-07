// import { compressAccurately } from 'image-conversion'

// 文件类型常量
const FileType = {
  Image: 'Image',
  Word: 'Word',
  Excel: 'Excel',
  PPT: 'PPT',
  PDF: 'PDF',
  ZIP: 'ZIP',
  RAR: 'RAR',
}

export default class FileHelper {
  // 图片文件的后缀名
  static imgExt = ['.png', '.jpg', '.jpeg', '.bmp', '.gif']
  // word文件的后缀名
  static docExt = ['.doc', '.docx']
  // excel文件的后缀名
  static xlsExt = ['.xls', '.xlsx']

  static getFileExt(fileName) {
    const i = fileName.lastIndexOf('.')
    if (i !== -1) {
      const ext = fileName.substring(i).toLowerCase()
      return ext
    }
    return ''
  }
  // 获取文件类型
  static getFileType(fileName) {
    const i = fileName.lastIndexOf('.')
    if (i !== -1) {
      const ext = fileName.substring(i).toLowerCase()
      if (this.contain(ext, this.imgExt)) {
        return FileType.Image
      }
      if (this.contain(ext, this.docExt)) {
        return FileType.Word
      }
      if (this.contain(ext, this.xlsExt)) {
        return FileType.Excel
      }
      if (ext === '.ppt') {
        return FileType.PPT
      }
      if (ext === '.pdf') {
        return FileType.PDF
      }
      if (ext === '.zip') {
        return FileType.ZIP
      }
      if (ext === '.rar') {
        return FileType.RAR
      }
    }
  }
  static contain(obj, array) {
    for (var i = 0; i < array.length; i++) {
      if (array[i] === obj) return true
    }
    return false
  }
  // 获取文件icon信息
  static getFileIconInfo(fileName) {
    if (!fileName) {
      return null
    }
    const fileType = this.getFileType(fileName)
    let fileIcon = 'file.png'
    let fileBgColor = 'rgb(255, 182, 24)'
    if (fileType === FileType.Word) {
      fileIcon = 'word.png'
      fileBgColor = 'rgb(73, 126, 247)'
    } else if (fileType === FileType.Excel) {
      fileIcon = 'excel.png'
      fileBgColor = 'rgb(39, 204, 163)'
    } else if (fileType === FileType.PPT) {
      fileIcon = 'ppt.png'
      fileBgColor = 'rgb(255, 182, 24)'
    } else if (fileType === FileType.PDF) {
      fileIcon = 'pdf.png'
      fileBgColor = 'rgb(255, 91, 16)'
    } else if (fileType === FileType.ZIP) {
      fileIcon = 'zip.png'
      fileBgColor = 'rgb(234, 156, 112)'
    } else if (fileType === FileType.RAR) {
      fileIcon = 'rar.png'
      fileBgColor = 'rgb(245, 180, 80)'
    }
    return { icon: `/images/files/${fileIcon}`, color: fileBgColor }
  }
  // 格式化文件大小
  static getFileSizeFormat(size) {
    if (size < 1024) {
      return `${size} B`
    }
    if (size > 1024 && size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`
    }
    if (size > 1024 * 1024 && size < 1024 * 1024 * 1024) {
      return `${(size / 1024 / 1024).toFixed(2)} M`
    }
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)}G`
  }

  static compressUploadImage(file, maxSize = 1024) {
    return new Promise((resolve, reject) => {
      // const imageLimit = maxSize > 200 ? maxSize - 100 : maxSize
      // if (file.size > maxSize * 1024) {
      //   compressAccurately(file, imageLimit)
      //     .then((blob) => {
      //       const newFile = new window.File([blob], file.name, {
      //         type: file.type,
      //       })
      //       resolve(newFile)
      //     })
      //     .catch(() => {
      //       reject()
      //     })
      // } else {
      resolve(file)
      // }
    })
  }

  static getFileBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result)
      reader.onerror = (error) => reject(error)
    })
  }
}
