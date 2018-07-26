// firebase
const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

const wavebar = require('../modules/wavebar')
const signWare = require('../middleWare/signWare')

const express = require('express')
const router = express.Router()

router.get('/*', (req, res, next) => {
        // パスを分解
        let pathString = req.baseUrl.trims('/')
        req.vessel.paths = pathString.split('/')

        // IDをチェッしてあれば取得
        const numberReg = /^\d*$/
        let pathNumber = ''

        // pathsを退避
        let paths = req.vessel.paths.slice(0)

        // firstpathをチェック
        req.vessel.firstPath = paths[0]

        // 最後を取得
        let pathUnique = paths.pop() || req.vessel.frontendUnique

        // 最後のパスが数字の場合
        if (numberReg.test(pathUnique)) {
            pathNumber = pathUnique
            pathUnique = paths.pop() || frontendUnique
        }
        
        req.vessel.pathUnique = pathUnique
        req.vessel.pathNumber = pathNumber

        // パスの組み立て
        req.vessel.thingUnique = pathNumber ? `${pathUnique}/${pathNumber}` : pathUnique
        next()
    }
)

module.exports = router