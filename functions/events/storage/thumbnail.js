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

exports.generateThumbnail = functions.storage.object()
  .onFinalize(object => {
    console.log('-----> storage')
    console.log('object@ ', object)

    // これでもバケット名が取れる
    const adminBaket = admin.storage().bucket();
    console.log('adminBaket@ ', adminBaket)
    console.log('adminBaket.name: ', adminBaket.name)

    // ファイルを含むStorage bucket
    const fileBucket = object.bucket
    console.log('fileBucket: ', fileBucket)
    // バケットを取得
    const bucket = gcs.bucket(fileBucket)
    console.log('bucket: ', fileBucket)
    // バケット内のファイルパス
    const filePath = object.name
    console.log('filePath: ', filePath)
    // ファイルのコンテントタイプ
    const contentType = object.contentType
    console.log('contentType: ', contentType)
    // メタデータが生成された回数
    // 新しいオブジェクトの値は1
    const metageneration = object.metageneration
    console.log('metageneration', metageneration)

    // ファイル名を取得
    const fileName = path.basename(filePath)
    console.log('fileName: ', fileName)

    const extName = path.extname(filePath)
    console.log('extName: ', extName)


    // firestoreに保存
    admin.firestore().collection('assets')
      .add({
        extName,
        filePath,
        downloadUrl: `https://firebasestorage.googleapis.com/v0/b/${fileBucket}/o/${encodeURIComponent(filePath)}?alt=media`,
      })
      .then(() => console.log('Done'))
      .catch(err => console.log(err))






    // イメージではないファイルは終了
    if (!contentType.startsWith('image/')) {
      console.log('<----- This is not an image.')
      return 0
    }

    // サムネイルイメージがすでにある場合は終了
    if (fileName.startsWith('thumb_')) {
      console.log('<----- Already a Thumbnail.')
      return 0
    }

    // テンプファイルのパスを作成
    const tempFilePath = path.join(os.tmpdir(), fileName)

    const metadata = {
      contentType: contentType,
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
        return spawn('convert', [tempFilePath, '-thumbnail', '200x200>', tempFilePath])
      })
      .then(() => {
        console.log('-----> Thumbnail created at', tempFilePath)

        // We add a 'thumb_' prefix to thumbnails file name. That's where we'll upload the thumbnail.
        const thumbFileName = `thumb_${fileName}`
        const thumbFilePath = path.join(path.dirname(filePath), thumbFileName)

        // Uploading the thumbnail.
        return bucket.upload(tempFilePath, {
          destination: thumbFilePath,
          metadata: metadata,
        })
      })
      .then(() => {
        // Once the thumbnail has been uploaded delete the local file to free up disk space.
        fs.unlinkSync(tempFilePath)
      })
  })