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

exports.deleteAsset = functions.storage.object().onDelete(object => {
  console.log('on delete!!!')
  return 0
})