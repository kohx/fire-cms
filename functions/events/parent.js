const functions = require('firebase-functions')
const admin = require('firebase-admin')
admin.initializeApp()

// firebase-admin 5.13.0 なら動く！
// https://stackoverflow.com/questions/51412652/i-dont-know-how-to-set-firebase-firestore-settings-at-case-admin-firestore
const firestoreSettings = {
    timestampsInSnapshots: true
}
admin.firestore().settings(firestoreSettings)

/* create stack */
Object.defineProperty(global, '__stack', {
    get: function () {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function (_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
})

/* create line */
Object.defineProperty(global, '__line', {
    get: function () {
        return __stack[1].getLineNumber();
    }
})

/* trim char */
String.prototype.trims = function (char) {
    let str = this
    str = str.endsWith(char) ? str.substr(0, str.length - char.length) : str
    str = str.startsWith(char) ? str.substr(char.length) : str
    return str;
}

/* exports */
module.exports.functions = functions
module.exports.admin = admin
module.exports.system = (() => {
    return {
        cache: true
    }
})()

function decodedTokenFromIdToken(idToken) {
    return new Promise((resolve, reject) => {
        admin.auth().verifyIdToken(idToken)
            .then(decodedToken => {
                // console.log('decodedToken', decodedToken)
                resolve(decodedToken)
            })
            .catch(error => reject(error))
    })
}

function userRecordByDecodedToken(decodedToken) {
    return new Promise((resolve, reject) => {
        admin.auth().getUser(decodedToken.uid)
            .then(userRecord => {
                // console.log('userRecord', userRecord)
                resolve(userRecord)
            })
            .catch(error => reject(error))
    })
}

module.exports.getUser = (idToken) => {
    return Promise.resolve()
        .then(() => {
            return decodedTokenFromIdToken(idToken)
        })
        .then(decodedToken => {
            return userRecordByDecodedToken(decodedToken)
        })
        .then(user => {
            // console.log(user)
            return user
        })
        .catch(error => reject(error))
}