import React from 'react'

function renameFile (originalFile) {
  const newName = `${dateString()}${originalFile.name.slice(
    originalFile.name.lastIndexOf('.'))}`

  return new File([originalFile], newName, {
    type: originalFile.type,
    lastModified: originalFile.lastModified
  })
}

const dateString = () => {
  const date = new Date()

  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  const seconds = `${date.getSeconds()}`.padStart(2, '0')
  const milliseconds = `${date.getMilliseconds()}`.padStart(2, '0')

  return `image_${month}${day}${hour}${minute}${seconds}${milliseconds}`
}

export default function useImagePreview () {

  const [imagePreview, setImagePreview] = React.useState('')
  const imageFile = React.useRef(null)

  const setImageFile = React.useCallback((inputFile) => {
    if (inputFile === null) {
      if(imageFile.current === null) return

      imageFile.current = null
      setImagePreview('')
      return
    }

    inputFile = renameFile(inputFile)
    imageFile.current = inputFile

    let reader = new FileReader()
    reader.onload = e => setImagePreview(e.target.result)
    reader.readAsDataURL(inputFile)
  }, [setImagePreview])

  return [imagePreview, imageFile.current, setImageFile]
}