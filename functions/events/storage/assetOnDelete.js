// firebase
const parent = require('../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

exports.assetOnDelete = functions.storage.object().onDelete(object => {
  console.log('on delete!!!')
  return 0
})