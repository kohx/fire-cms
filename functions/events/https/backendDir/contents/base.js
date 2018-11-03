export class Base {

    constructor() {
        this.name = 'kohei'
        this.notice = document.querySelector('.notice')
        this.noticeTitle = document.querySelector('.notice-title')
        this.noticeMessages = document.querySelector('.notice-messages')

        /* notice */
        this.noticeClose = document.querySelector('.notice-close')
        this.noticeClose.addEventListener('click', event => {
            this.closeNotice()
        })
    }

    static init() {
        return new Base()
    }

    /* nitice */
    setNotice(type, messages, timeout = 4000) {
        this.clearNotice()
        this.noticeTitle.textContent = type.toUpperCase()
        Object.keys(messages).forEach(key => {
            const list = document.createElement('li');
            list.textContent = messages[key]
            this.noticeMessages.insertAdjacentElement('beforeend', list)
        });
        this.notice.classList.add(`__${type}`, '_active')
        setTimeout(_ => {
            this.closeNotice()
        }, timeout);
    }

    clearNotice() {
        this.notice.classList.remove('__info')
        this.notice.classList.remove('__success')
        this.notice.classList.remove('__warning')
        this.notice.classList.remove('__error')
        this.noticeTitle.textContent = null
        this.noticeMessages.textContent = null
    }

    closeNotice(){
        this.notice.classList.remove('_active')
        setTimeout(_ => {
            this.clearNotice()
        }, 10000);
    }


    /* fetche */
    fetchPost(url, body = {}) {

        const headers = {
            // 'Access-Control-Allow-Credentials': 'true',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }

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