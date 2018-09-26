
builded = ``
builded += `<header>\n<div>backend</div>\n<div>signin: `
if(isExist("sign.status", params)){
builded += entityify(sign.status);
} else {
builded += `[ "sign.status" is not defined! ]`
}
builded += ` `
if(isExist("sign.user.uid", params)){
builded += entityify(sign.user.uid);
} else {
builded += `[ "sign.user.uid" is not defined! ]`
}
builded += `</div>\n    <hr>\n</header>\n\n<h1>sign in</h1>\n<input type="email" id="email" placeholder="email" value="">\n<input type="password" id="password" placeholder="password" value="SSSS">\n<button id="signin">sign in</button>\n<button id="signout">sign out</button>\n<div id="csrfToken">`
if(isExist("csrfToken", params)){
builded += entityify(csrfToken);
} else {
builded += `[ "csrfToken" is not defined! ]`
}
builded += `</div>\n<p id="signin_message"></p>\n\n<footer>\n    <hr>\n    &copy; fire cms\n</footer>\n\n<script>\n            const url = \`${location.origin}/signEndPoint/in\`\n\n</script>`
builded += 'const url = `${location.origin}/signEndPoint/in`\n\n</script>'
builded += 'const url = \`${location.origin}\`/signEndPoint/in'
builded += `const url = \`${location.origin}/signEndPoint/in\`\n\n</script>`