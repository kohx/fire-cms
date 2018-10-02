const assetList = document.querySelector('#list')
const assetsStoreRef = firebase.firestore().collection('settings')

assetsStoreRef.doc('config').get()
    .then(doc => {
        console.log(doc)
    })

assetsStoreRef
    // .orderBy('createdAt', 'desc')
    .onSnapshot(docs => {
        console.log(docs)
        // docs.forEach(doc => {
        //         // .then(data => {
        //         //     console.log(data)

        //         //     if (!assetFrame) {
        //         //         const html =
        //         //             `<div id="id_${data.id}">
        //         //                                     <div>id_${data.id}</div>
        //         //                                     <a href="${data.url}">
        //         //                                         <img src="${data.thumb}" height="20">
        //         //                                     </a>
        //         //                                 </div>`
        //         //         assetList.insertAdjacentHTML('beforeend', html)
        //         //     }
        //         // })
        //         // .catch(err => console.log(err))
        // })
    })

function selectFiles(event) {
    // FileList object
    const files = event.target.files
    // files is a FileList of File objects. List some properties.
    Object.keys(files).forEach(key => {
        const file = files[key]
        const uid = assetsStoreRef.doc().id

        // Only process image files.
        if (file.type.startsWith('image/')) {
            // image render
            var reader = new FileReader()
            reader.onload = result => {
                const frame = createFileInput(uid, file, result.target.result)
                fileList.appendChild(frame)
            }
            // Read in the image file as a data URL.
            reader.readAsDataURL(file)
        } else {
            const frame = createFileInput(uid, file, defaultFileImage)
            fileList.appendChild(frame)
        }
        // set this
        selectedFiles[uid] = file
    })
    // input file element clear
    select.value = ''
}

function deleteFiles() {
    Array.from(document.querySelectorAll('.file-frame')).forEach(element => {
        const check = element.querySelector('[type="checkbox"]')
        if (check.checked === true) {
            delete selectedFiles[element.dataset.uid]
            element.parentNode.removeChild(element)
        }
    })
}

function createFileInput(uid, file, imagePath = null) {
    imagePath = imagePath == null ? defaultFileImage : imagePath
    const frame = document.createElement('div')
    frame.classList.add('file-frame')
    frame.dataset.uid = uid
    frame.id = `file_list-id_${uid}`
    const html =
        `<img src="${imagePath}" height="20"></div>
            <div>${uid}</div>
            <div>type: ${file.type || 'n/a'}</div>
            <div>size: ${file.size}</div>
            <div><input class="file-unique" type="text" value="${uid}" placeholder="unique"></div>
            <div><input class="file-name" type="text" value="${file.name}" placeholder="name"></div>
            <div><input class="file-description" type="text" placeholder="description"></div>
            <div><input type="checkbox"></div>
            <div class="file-message"></div>
            <hr>`
    frame.innerHTML = html
    return frame
}

function uploadFiles() {
    const url = `${window.location.origin}/backend/updateAsset`
    Array.from(document.querySelectorAll('.file-frame')).forEach(element => {
        const uid = element.dataset.uid
        console.log(uid)
        const name = element.querySelector('.file-name').value
        const unique = element.querySelector('.file-unique').value
        const description = element.querySelector('.file-description').value
        const messageElement = element.querySelector('.file-message')
        const file = selectedFiles[uid]

        // 
        const reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = event => {
            const content = event.target.result
            document.querySelector('body').insertAdjacentHTML('beforeend',
                `<img src="${content}" height="10">`)
            document.querySelector('body').insertAdjacentHTML('beforeend', `<div>${content}</div>`)
            const type = file.type
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            };
            const body = {
                unique,
                name,
                description,
                content,
                type,
            }
            const options = {
                method: 'POST',
                body: JSON.stringify(body),
                headers: headers,
            }

            fetch(url, options)
                .then(data => {
                    return data.json()
                }).then(json => {
                    console.log(json)
                    if (json.status) {
                        document.querySelector(`#file_list-id_${uid}`).remove()
                    } else {
                        messageElement.innerHTML = json.messages[0]
                    }
                }).catch(err => {
                    messageElement.textContent = err.message
                    console.log(err)
                })
        }
    })
}