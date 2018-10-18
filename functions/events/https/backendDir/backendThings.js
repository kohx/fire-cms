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
                user: true
            },
            contentType: 'html',
            contentFile: 'index.html'
        },
        'signin': {
            unique: 'signin',
            name: 'signin',
            roles: {
                owner: false,
                direct: false,
                admin: false,
                editor: false,
                writer: false,
                user: false
            },
            contentType: 'html',
            contentFile: 'signin.html'
        },
        'signin.js': {
            unique: 'signin.js',
            name: 'signin.js',
            roles: {
                owner: false,
                direct: false,
                admin: false,
                editor: false,
                writer: false,
                user: false
            },
            contentType: 'js',
            contentFile: 'signin.js'
        },
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
            contentFile: 'settings.html'
        },
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
            contentFile: 'users.html'
        },
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
            contentFile: 'divisions.html'
        },
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
            contentFile: 'assets.html'
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
        'template-add': {
            unique: 'template-add',
            name: 'template-add',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'template-add.html'
        },
        'template': {
            unique: 'template-edit',
            name: 'template-edit',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'template-edit.html'
        },
        'template-content': {
            unique: 'template-content',
            name: 'template-content',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'html',
            contentFile: 'template/content.html'
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
        /* css */
        'reset.css': {
            unique: 'reset.css',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'css',
            contentFile: 'css/reset.css'
        },
        'base.css': {
            unique: 'base.css',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'css',
            contentFile: 'css/base.css'
        },
        'std-grid.css': {
            unique: 'std-grid.css',
            roles: {
                owner: true,
                direct: true,
                admin: true,
                editor: true,
                writer: true,
                user: true
            },
            contentType: 'css',
            contentFile: 'css/std-grid.css'
        }
    }

    return backendThings[unique] != null ? backendThings[unique] : false
}