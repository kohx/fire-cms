const parent = require('../../parent')
const functions = parent.functions
const admin = parent.admin
const system = parent.system

module.exports.notFound = (req, res, next) => {
  let err = new Error('Not Found.')
  err.status = 404
  next(err)
}

module.exports.internalServerError = (err, req, res, next) => {

  console.log('last: ', err)
  res.send(`
  ${err.name}${err.message}<br>${err.name}<br>${err.stack}
  `)

  // const status = err.status || 500
  // res.status(status)
  // admin.firestore().collection('things').doc(String(status)).get()
  //   .then(doc => {
  //     const thing = doc.data()
  //     if (doc.exists && thing.content) {
  //       const content = (thing.content != null) ? thing.content : ''
  //       delete thing.content
  //       const data = {
  //         content: content,
  //         params: thing,
  //         parts: req.vessel.parts,
  //         wraps: req.vessel.wraps,
  //         sign: req.vessel.sign,
  //       }
  //       data.params.errStatus = err.status
  //       data.params.errMessage = err.message
  //       data.params.errStack = err.stack
  //       res.wbRender(data)
  //       console.log('<-----------------------------', 'error from things!')
  //     } else {
  //       res.send(`<!doctype html>
  //                             <head>
  //                             <title>${err.status || 500}</title>
  //                             </head>
  //                             <body>
  //                             <h1>${err.status || 500} not from template!</h1>
  //                             <p>${err.message}</p>
  //                             <p>${err.stack}</p>
  //                             </body>
  //                         </html>`)
  //       console.log('<-----------------------------', 'error from err!')
  //     }
  //   })
  //   .catch(err => {
  //     res.send(`<!doctype html>
  //                             <head>
  //                             <title>500</title>
  //                             </head>
  //                             <body>
  //                             <h1>500 from error!</h1>
  //                             <p>${err.message}</p>
  //                             <p>${err.stack}</p>
  //                             </body>
  //                         </html>`)
  //     console.log('<-----------------------------', 'error from chatch err!')
  //   })
}