export class Base {

    constructor() {
        this.notice = document.querySelector('.notice')
        this.noticeTitle = document.querySelector('.notice-title')
        this.noticeMessages = document.querySelector('.notice-messages')

        /* notice */
        this.noticeClose = document.querySelector('.notice-close')
        this.noticeClose.addEventListener('click', event => {
            this.closeNotice()
        })

        this.noticeTimer;
    }

    static init() {
        return new Base()
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