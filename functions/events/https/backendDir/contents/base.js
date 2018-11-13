export class Base {

    constructor() {

        /* target next */

        this.targetItemSelector = '.target_item'
        this.targetNext()

        /* notice */
        this.notice = document.querySelector('.notice')
        this.noticeTitle = document.querySelector('.notice-title')
        this.noticeMessages = document.querySelector('.notice-messages')
        this.noticeClose = document.querySelector('.notice-close')
        this.noticeClose.addEventListener('click', event => {
            this.closeNotice()
        })

        this.noticeTimer;
    }

    static init() {
        return new Base()
    }

    /* terget next */
    targetNext(selector = null) {

        selector = selector != null ? selector : this.targetItemSelector
        const targetItems = document.querySelectorAll(selector)
        console.log(targetItems)
        Object.keys(targetItems).forEach(key => {

            const element = targetItems[key]

            element.addEventListener('keyup', event => {
                event.target.classList.remove('_modified', '__warning', '__success')

                /* if change valeu add _modified class */
                if (event.target.dataset.default != event.target.value) {
                    event.target.classList.remove('__warning', '__success')
                    event.target.classList.add('_modified')
                } else {
                    event.target.classList.remove('_modified')
                }

                /* if enter key up then next one focused */
                if (event.keyCode === 13) {

                    let nextItem = targetItems[0]
                    if ((targetItems.length - 1) > key) {
                        nextItem = targetItems[Number(key) + 1]
                    }

                    nextItem.focus()

                    if (nextItem.tagName !== 'BUTTON') {
                        nextItem.setSelectionRange(-1, -1)
                    }
                }
            })
        })
    }

    /* nitice */
    setNotice(type, messages, title = null, timeout = 6000) {
        this.clearNotice()

        clearTimeout(this.noticeTimer);

        title = title != null ? title : type.toUpperCase()
        this.noticeTitle.textContent = title

        messages.forEach(message => {
            const list = document.createElement('li');
            list.textContent = message
            this.noticeMessages.insertAdjacentElement('beforeend', list)
        });

        this.notice.classList.add(`__${type}`, '_active')

        this.noticeTimer = setTimeout(_ => {
            this.closeNotice()

            // clear success class
            this.removeSuccessModifier()

            setTimeout(_ => {
                this.clearNotice()
            }, 100);

        }, timeout);
    }

    clearNotice() {
        this.notice.classList.remove('__info', '__success', '__warning', '__error')
        this.noticeTitle.textContent = null
        this.noticeMessages.textContent = null
    }

    closeNotice() {
        this.notice.classList.remove('_active')
    }

    removeSuccessModifier() {
        document.querySelectorAll('.__success').forEach(element => {
            element.classList.remove('__success')
        })
    }

    /* fetche */
    fetchSignIn(email, passwoard, url, csrfToken) {

    }

    fetchServer(url, body = {}, addHeader = {}) {

        // default headers
        const defaultHeaders = {
            // 'Access-Control-Allow-Credentials': 'true',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }

        // merge defaultHeaders and addHeader
        const headers = Object.assign(defaultHeaders, addHeader)

        return new Promise((resolve, reject) => {
            fetch(url, {
                method: 'post',
                mode: 'cors',
                credentials: 'include',
                cache: 'no-cache',
                headers: headers,
                body: JSON.stringify(body)
            })
                .then(data => {
                    return data.json()
                })
                .then(json => {
                    resolve(json)
                })
                .catch(err => {
                    reject({
                        status: true,
                        message: "network err."
                    })
                })
        })
    }
}