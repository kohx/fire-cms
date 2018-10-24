export class Base {

    constructor() {
        this.name = 'kohei'
    }

    static init() {
        return new Base()
    }

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