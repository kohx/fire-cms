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
const validator = require('validator');

// validationこんなかんじ
// console.log(validator.isAlphanumeric('foo.jpg'))
// console.log(validator.contains('asdfas!!!dfasdf', '!!!'))
// console.log(validator.isEmpty(''))
// console.log(validator.equals('1234', '1234'))
// console.log(validator.matches('12abc34', /abc/))
// console.log(validator.isEmail('asdf@asdfsd.com'))
// console.log(validator.isURL('http://google.com'))
// console.log(validator.isFQDN('http://google.com'))
// console.log(validator.isAlpha('asdf'))
// console.log(validator.isNumeric('1234'))
// console.log(validator.isLength('asdf', 1, 5))
// console.log(validator.isByteLength('11111', 1000, 100000))
// console.log(validator.isIn('aaa', ['aaa', 'bbb', 'ccc']))
// console.log(validator.escape(`<div>'asdf',"asdf",&</div>`))
// console.log(validator.ltrim(`/sss/`, '/'))
// console.log(validator.rtrim(`/sss/`, '/'))
// console.log(validator.trim(`/sss/`, '/'))

let fileBucket,
  bucket,
  contentType,
  filePath,
  fileName,
  ext,
  unique,
  name,
  tempFilePath,
  fileType

const thumbPrefix = 'thumb_'
const thumbSize = '200x200'

exports.updateAsset = functions.storage.object()
  .onFinalize(object => {
    console.log('-----> storage')

    /* returnの分解 */
    console.log('object@ ', object)

    // ファイルを含むStorage bucket
    fileBucket = object.bucket
    // バケット内のファイルパス
    bucket = gcs.bucket(fileBucket)
    // console.log('bucket1@', bucket)

    // これでもバケット名が取れる
    // bucket = admin.storage().bucket()
    // console.log('bucket2@', bucket)

    // コンテントタイプ
    contentType = object.contentType
    // ファイルタイプ
    fileType = 'file'
    if (contentType.startsWith('image/')) {
      fileType = 'image'
    }
    if (contentType.startsWith('audio/')) {
      fileType = 'audio'
    }
    if (contentType.startsWith('video/') || contentType.startsWith('vide/')) {
      fileType = 'video'
    }
    // アセットネーム
    assetName = object.name           // assets/qwer
    
    unique = filePath.replace(`${parse.dir}/`, '') // assets/qwer
    name = object.metadata.name               // image



    // サムネイルの場合は終了
    if (fileName.startsWith(thumbPrefix)) {
      console.log('<----- Already a Thumbnail.')
      return 0
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
      unique: filePath,
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
  // イメージファイル
  if (contentType.startsWith('image/')) {
    // テンプファイルのパスを作成
    tempFilePath = path.join(os.tmpdir(), fileName)

  } else {

  }



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