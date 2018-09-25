
builded = ''
builded += '<!DOCTYPE html>\n<html>\n\n<head>\n    <meta charset="utf-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1">\n    <title>'
if(isExist("name", params)){
builded += entityify(name);
} else {
builded += '[ "name" is not defined! ]'
}
builded += '</title>\n    <link rel="apple-touch-icon" href="./images/favicon.png">\n    <script src="/__/firebase/5.5.1/firebase-app.js"></script>\n    <script src="/__/firebase/5.5.1/firebase-auth.js"></script>\n    <script src="/__/firebase/5.5.1/firebase-firestore.js"></script>\n    <script src="/__/firebase/5.5.1/firebase-storage.js"></script>\n    <script src="/__/firebase/5.5.1/firebase-messaging.js"></script>\n    <script src="/__/firebase/5.5.1/firebase-functions.js"></script>\n    <script src="/__/firebase/init.js"></script>\n    <script>\n        const firestore = firebase.firestore();\n        const settings = {\n            timestampsInSnapshots: true\n        };\n        firestore.settings(settings);\n    </script>\n</head>\n\n<body>\n    \n<header>\n<div>backend</div>\n<div>signin: '
if(isExist("sign.status", params)){
builded += entityify(sign.status);
} else {
builded += '[ "sign.status" is not defined! ]'
}
builded += ' '
if(isExist("sign.user.uid", params)){
builded += entityify(sign.user.uid);
} else {
builded += '[ "sign.user.uid" is not defined! ]'
}
builded += '</div>\n    <hr>\n</header>\n\n<h1>sign in</h1>\n<input type="email" id="email" placeholder="email" value="">\n<input type="password" id="password" placeholder="password" value="SSSS">\n<button id="signin">sign in</button>\n<button id="signout">sign out</button>\n<div id="csrfToken">'
if(isExist("csrfToken", params)){
builded += entityify(csrfToken);
} else {
builded += '[ "csrfToken" is not defined! ]'
}
builded += '</div>\n<p id="signin_message"></p>\n\n<footer>\n    <hr>\n    &copy; fire cms\n</footer>\n\n<script>  

builded += '\n    \n    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);   \n\n    /* サインアウト */\n    const signout = event => {\n        firebase.auth().signOut()\n\n        return fetchServerSignout()\n            .then(result => {\n                console.log(result)\n                document.querySelector('#signin').disabled = false\n                document.querySelector('#signout').disabled = true\n            })\n            .catch(err => {\n                console.log(err)\n            })\n    }\n\n    /* イベント */\n    const signinBtn = document.querySelector('#signin')\n    if (signinBtn) {\n        signinBtn.addEventListener('click', signin)\n    }\n    const signoutBtn = document.querySelector('#signout')\n    if (signoutBtn) {\n        signoutBtn.addEventListener('click', signout)\n    }\n</script>\n</body>\n\n</html>'