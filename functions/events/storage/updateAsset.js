// firebase
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const spawn = require('child-process-promise').spawn
const gcs = require('@google-cloud/storage')()
const path = require('path')
const os = require('os')
const fs = require('fs')
const crypto = require('crypto');

let fileBucket,
  bucket,
  contentType,
  filePath,
  fileName,
  extName,
  tempFilePath,
  unique

let fileType = 'file'

const thumbPrefix = 'thumb_'
const thumbSize = '200x200'

exports.deleteAsset = functions.storage.object().onDelete(object => {
  console.log('on delete!!!')
  return 0
})

exports.updateAsset = functions.storage.object()
  .onFinalize(object => {
    console.log('-----> storage')

    /* returnの分解 */
    // console.log('object@ ', object)

    // ファイルを含むStorage bucket
    fileBucket = object.bucket
    // バケット内のファイルパス
    bucket = gcs.bucket(fileBucket)
    // console.log('bucket1@', bucket)

    // これでもバケット名が取れる
    // bucket = admin.storage().bucket()
    // console.log('bucket2@', bucket)

    // make params
    contentType = object.contentType
    filePath = object.name
    fileName = path.basename(object.name)
    extName = path.extname(object.name)

    // サムネイルの場合は終了
    if (fileName.startsWith(thumbPrefix)) {
      console.log('<----- Already a Thumbnail.')
      return 0
    }

    unique = filePath.replace('assets/', '')

    if (contentType.startsWith('image/')) {
      fileType = 'image'
    }
    if (contentType.startsWith('audio/')) {
      fileType = 'audio'
    }
    if (contentType.startsWith('video/') || contentType.startsWith('vide/')) {
      fileType = 'video'
    }

    // firestoreに保存
    const doSetStore = setStore()
    // サムネイルを作成
    const doCreateTumb = createTumb()

    return Promise.all([doSetStore, doCreateTumb])
  })

function setStore() {
  return admin.firestore().collection('assets').doc(unique)
    .set({
      unique: filePath.replace('assets/', ''),
      name: '',
      description: '',
      fileType,
      filePath,
      checkUrl: `https://firebasestorage.googleapis.com/v0/b/${fileBucket}/o/${encodeURIComponent(filePath)}?alt=media`,
    })
    .then(result => {
      console.log('<----- setStore done.', filePath)
    })
}

function createTumb() {
  // イメージではないファイルは終了
  if (!contentType.startsWith('image/')) {
    console.log('<----- This is not an image.')
    return 0
  }

  // テンプファイルのパスを作成
  tempFilePath = path.join(os.tmpdir(), fileName)

  // サムネイルを作成して保存
  // まずファイルをテンプフォルダにダウンロード
  return bucket.file(filePath)
    .download({
      destination: tempFilePath,
    })
    .then(() => {
      console.log('-----> Image downloaded locally to', tempFilePath)
      // ImageMagickを使用してサムネイルを生成
      return spawn('convert', [tempFilePath, '-thumbnail', `${thumbSize}>`, tempFilePath])
    })
    .then(() => {
      console.log('-----> Thumbnail created at', tempFilePath)
      // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
      const thumbFileName = `${thumbPrefix}${fileName}`
      const thumbFilePath = path.join(path.dirname(filePath), thumbFileName)

      // Uploading the thumbnail.
      return bucket.upload(tempFilePath, {
        destination: thumbFilePath,
        metadata: {}
      })
    })
    .then(() => {
      // Once the thumbnail has been uploaded delete the local file to free up disk space.
      fs.unlinkSync(tempFilePath)
    })
}