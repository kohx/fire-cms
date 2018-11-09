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
    setNotice(type, messages, title = null, timeout = 4000) {
        this.clearNotice()
        title = title != null ? title : type.toUpperCase()
        this.noticeTitle.textContent = title
        messages.forEach(message => {
            const list = document.createElement('li');
            list.textContent = message
            this.noticeMessages.insertAdjacentElement('beforeend', list)
        });
        this.notice.classList.add(`__${type}`, '_active')
        setTimeout(_ => {
            this.closeNotice()
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