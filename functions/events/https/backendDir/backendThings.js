const debug = require('../../../modules/debug').debug

module.exports.get = (unique) => {

    const backendThings = {
        'index': {
            unique: 'index',
            name: 'index',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: false
            },
            contentType: 'html',
            contentFile: 'index.html'
        },
        /* sign */
        'signin': {
            unique: 'signin',
            name: 'signin',
            roles: {},
            contentType: 'html',
            contentFile: 'sign/in.html'
        },
        'sign-in': {
            unique: 'sign-in',
            roles: {},
            contentType: 'json',
        },
        'sign-out': {
            unique: 'sign-out',
            roles: {},
            contentType: 'json',
        },
        'signin.js': {
            unique: 'signin.js',
            name: 'signin.js',
            roles: {},
            contentType: 'js',
            contentFile: 'sign/in.js'
        },
        /* settings */
        'settings': {
            unique: 'settings',
            name: 'settings',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: false,
                writer: false,
                user: false
            },
            contentType: 'html',
            contentFile: 'setting/index.html'
        },
        'setting-update': {
            unique: 'setting-update',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: false,
                user: false
            },
            contentType: 'json',
        },
        /* users */
        'users': {
            unique: 'users',
            name: 'users',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: false,
                writer: false,
                user: false
            },
            contentType: 'html',
            contentFile: 'user/index.html'
        },
        'user': {
            unique: 'user',
            name: 'user',
            parents: ['users'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: false,
                writer: false,
                user: false
            },
            contentType: 'html',
            contentFile: 'user/edit.html'
        },
        'user-add': {
            unique: 'user-add',
            name: 'user-add',
            parents: ['users'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: false,
                writer: false,
                user: false
            },
            contentType: 'html',
            contentFile: 'user/add.html'
        },
        'user-create': {
            unique: 'user-create',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
        },
        'user-update': {
            unique: 'user-update',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'json',
        },
        'user-delete': {
            unique: 'thing-delete',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'json',
        },
        /* divisions */
        'divisions': {
            unique: 'divisions',
            name: 'divisions',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'division/index.html'
        },
        'division': {
            unique: 'division',
            name: 'division',
            parents: ['divisions'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'division/edit.html'
        },
        'division-add': {
            unique: 'division-add',
            name: 'division-add',
            parents: ['divisions'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'division/add.html'
        },
        'division-create': {
            unique: 'division-create',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
        },
        'division-update': {
            unique: 'division-update',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'json',
        },
        'division-delete': {
            unique: 'division-delete',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'json',
        },
        /* template */
        'templates': {
            unique: 'templates',
            name: 'templates',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'template/index.html'
        },
        'template': {
            unique: 'template',
            name: 'template',
            parents: ['templates'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'template/edit.html'
        },
        'template-add': {
            unique: 'template-add',
            name: 'template-add',
            parents: ['templates'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'template/add.html'
        },
        'template-create': {
            unique: 'template-create',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'json',
        },
        'template-update': {
            unique: 'template-update',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'json',
        },
        'template-delete': {
            unique: 'template-delete',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'json',
        },
        /* assets */
        'assets': {
            unique: 'assets',
            name: 'assets',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            // contentFile: 'asset/index.html'
            contentFile: 'asset/assets.html'
        },
        'asset': {
            unique: 'asset',
            name: 'asset',
            parents: ['assets'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'asset/edit.html'
        },
        /* thing */
        'things': {
            unique: 'things',
            name: 'things',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'thing/index.html'
        },
        'thing': {
            unique: 'thing',
            name: 'thing',
            parents: ['things'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'thing/edit.html'
        },
        'thing-add': {
            unique: 'thing-add',
            name: 'thing-add',
            parents: ['things'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'thing/add.html'
        },
        'thing-content': {
            unique: 'thing-content',
            name: 'thing-content',
            parents: ['things'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'thing/content.html'
        },
        'thing-assets': {
            unique: 'thing-assets',
            name: 'thing-assets',
            parents: ['things'],
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'thing/assets.html'
        },
        'thing-create': {
            unique: 'thing-create',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
        },
        'thing-update': {
            unique: 'thing-update',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'json',
        },
        'thing-delete': {
            unique: 'thing-delete',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'json',
        },
        /* css */
        'reset.css': {
            unique: 'reset.css',
            roles: {},
            contentType: 'css',
            contentFile: 'css/reset.css'
        },
        'base.css': {
            unique: 'base.css',
            roles: {},
            contentType: 'css',
            contentFile: 'css/base.css'
        },
        'std-grid.css': {
            unique: 'std-grid.css',
            roles: {},
            contentType: 'css',
            contentFile: 'css/std-grid.css'
        },
        'std-grid-mq.css': {
            unique: 'std-grid-mq.css',
            roles: {},
            contentType: 'css',
            contentFile: 'css/std-grid-mq.css'
        },
        /* js */
        'base.js': {
            unique: 'base.js',
            name: 'base.js',
            roles: {},
            contentType: 'js',
            contentFile: 'base.js'
        }
    }

    return backendThings[unique] != null ? backendThings[unique] : false
}