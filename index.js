const default_api_address = 'http://127.0.0.1:45869';

// TODO: Implement v13 features
const api_version = 13;

const ENDPOINTS = {

    // Access Management
    API_VERSION: '/api_version',
    SESSION_KEY: '/session_key',
    REQUEST_NEW_PERMISSIONS: '/request_new_permissions',
    VERIFY_ACCESS_KEY: '/verify_access_key',
    // Adding Files
    ADD_FILE: '/add_files/add_file',
    // Adding Tags
    CLEAN_TAGS: '/add_tags/clean_tags',
    GET_TAG_SERVICES: '/add_tags/get_tag_services',
    ADD_TAGS: '/add_tags/add_tags',
    // Adding URLs
    GET_URL_FILES: '/add_urls/get_url_files',
    GET_URL_INFO: '/add_urls/get_url_info',
    ADD_URL: '/add_urls/add_url',
    ASSOCIATE_URL: '/add_urls/associate_url',
    // Managing Cookies
    GET_COOKIES: '/manage_cookies/get_cookies',
    SET_COOKIES: '/manage_cookies/set_cookies',
    // Managing Pages
    GET_PAGES: '/manage_pages/get_pages',
    GET_PAGE_INFO: '/manage_pages/get_page_info',
    FOCUS_PAGE: '/manage_pages/focus_page',
    // Searching and Fetching Files
    SEARCH_FILES: '/get_files/search_files',
    GET_FILE: '/get_files/file',
    GET_THUMBNAIL: '/get_files/thumbnail',
    GET_FILE_METADATA: '/get_files/file_metadata',

};

const FILE_STATUS = {
    NOT_IN_DATABASE: 0,
    SUCCESSFUL: 1,
    ALREADY_IN_DATABASE: 2,
    PREVIOUSLY_DELETED: 3,
    FAILED: 4,
    VETOED: 7,
};

const TAG_ACTIONS = {
    ADD_TO_LOCAL: 0,
    DELETE_FROM_LOCAL: 1,
    PEND_TO_REPOSITORY: 2,
    RESCIND_PEND_FROM_REPOSITORY: 3,
    PETITION_FROM_REPOSITORY: 4,
    RESCIND_A_PETITION_FROM_REPOSITORY: 5
}

const URL_TYPE = {
    POST_URL: 0,
    FILE_URL: 2,
    GALLERY_URL: 3,
    WATCHABLE_URL: 4,
    UNKNOWN_URL: 5,
};

const PERMISSIONS = {
    IMPORT_URLS: 0,
    IMPORT_FILES: 1,
    ADD_TAGS: 2,
    SEARCH_FILES: 3,
    MANAGE_PAGES: 4,
    MANAGE_COOKIES: 5
};

const STATUS_NUMBERS = {
    'Current': 0,
    'Pending': 1,
    'Deleted': 2,
    'Petitioned': 3
}

const PAGE_TYPES = {
    'Gallery downloader': 1,
    'Simple downloader': 2,
    'Hard drive import': 3,
    'Petitions': 5,
    'File search': 6,
    'URL downloader': 7,
    'Duplicates': 8,
    'Thread watcher': 9,
    'Page of pages': 10
}

class GenericApiError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        // Error.captureStackTrace(this, this.constructor);
    }
}

class NotEnoughArgumentsError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        // Error.captureStackTrace(this, this.constructor);
    }
}

class IncorrectArgumentsError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
        // Error.captureStackTrace(this, this.constructor);
    }
}

class ApiVersionMismatchError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class Client {
    constructor(options = {}) {
        this.address = !('address' in options) ? this.default_api_address : options['address'];
        this.access_key = !('key' in options) ? '' : options['key'];
    }

    get default_api_address() {
        return default_api_address;
    }

    get ENDPOINTS() {
        return ENDPOINTS;
    }

    get FILE_STATUS() {
        return FILE_STATUS;
    }

    get TAG_ACTIONS() {
        return TAG_ACTIONS;
    }

    get URL_TYPE() {
        return URL_TYPE;
    }

    get PERMISSIONS() {
        return PERMISSIONS;
    }

    get STATUS_NUMBERS() {
        return STATUS_NUMBERS;
    }

    get PAGE_TYPES() {
        return PAGE_TYPES;
    }

    /**
     * Internal method to package and send a query to the Hydrus Client API.
     * Will throw errors if an HTTP request is not 'OK'
     * 
     * @param {"GET"|"SET"|"PUT"|"POST"|"DELETE"} method 
     * @param {URL} endpoint 
     * @param {*} options 
     */
    async build_call(method, endpoint, options = {}) {
        if (this.access_key !== '') {
            if (!(('headers' in options) && 'Hydrus-Client-API-Access-Key' in options.headers)) {
                if (!('headers' in options))
                    options['headers'] = {};
                options.headers['Hydrus-Client-API-Access-Key'] = this.access_key;
            }
        }

        // Build querystring
        let url = this.address + endpoint;
        if ('queries' in options) {
            url += "?"
            for (const key in options.queries) {
                if (options.queries.hasOwnProperty(key)) {
                    let query_value = options.queries[key];
                    if (typeof query_value === "object") query_value = JSON.stringify(query_value);
                    url += key + "=" + query_value + "&";
                }
            }
            // Remove the last &
            url = url.substr(0, url.length - 1);
        }
        // Encode URI
        url = encodeURI(url);

        // Send request
        const resource = await fetch(url, {
            method: method,
            headers: options.headers,
            body: 'data' in options ? options.data : options.json
        });

        // Test, then parse request
        if (resource.ok) {
            return await resource.json();
        } else {
            throw new GenericApiError(resource.statusText);
        }
    }

    //
    // Access Management

    /**
     * Gets the current API version.
     * always returns json
     * (Does not require header)
     */
    async api_version() {
        return await this.build_call(
            'GET',
            ENDPOINTS.API_VERSION
        );
    }

    /**
     * Checks if the hydrus API version matches this API version
     */
    async api_check() {
        const { version } = await this.api_version();
        if (version > api_version) {
            throw new ApiVersionMismatchError(`You are using an older version of hydrus.js (${api_version}) that may not work with the newer api (${version}). Please check if there is an update available!`);
        } else if (api_version > version) {
            throw new ApiVersionMismatchError(`This version of hydrus.js (${api_version}) is built for a newer version of the api than what your hydrus installation is currently using (${version}). Please update your hydrus.`);
        }
    }

    /**
     * Gets a session key
     * always returns json
     * (Does not require header)
     */
    async session_key() {
        return await this.build_call(
            'GET',
            ENDPOINTS.SESSION_KEY
        );
    }

    /**
     * Register a new external program with the client.
     * This requires the 'add from api request' mini-dialog
     * under services->review services to be open, otherwise it will 403.
     * @param {String} name descriptive name of your access
     * @param {Array<Number>} permissions a list of permission identifiers you want to request
     */
    async request_new_permissions(name, permissions) {
        return await this.build_call(
            'GET',
            ENDPOINTS.REQUEST_NEW_PERMISSIONS,
            {
                queries: {
                    name: name,
                    basic_permissions: JSON.stringify(permissions),
                },
            }
        );
    }

    /**
     * Check if your access key is valid (will check the one you intialized your client with by default)
     * @param {String} key if you wish, you can pass a specific key you want to check
     */
    async verify_access_key(key = '') {
        const options =
            (key !== '') ? { headers: { 'Hydrus-Client-API-Access-Key': key } } : {};
        return await this.build_call(
            'GET',
            ENDPOINTS.VERIFY_ACCESS_KEY,
            options
        );
    }

    //
    // Adding Files

    /**
     * Tell the client to import a file.
     * supply a json with either bytes : *file bytes* 
     * or path: *file path*
     * 
     * TODO: Reimplement
     * @param {String} file path to the file
     */
    async add_file(options) {
        console.warn("add_file is not tested");
        return await this.build_call(
            'POST',
            ENDPOINTS.ADD_FILE,
            'path' in options ? {
                json: {
                    path: options.path,
                },
            } : {
                    headers: {
                        'Content-Type': 'application/octet-stream',
                    },
                    data: options.bytes,
                }
        );
    }

    //
    // Adding Tags

    /**
     * 
     * @param {*} actions (an Object of service names to lists of tags to be 'added' to the files) or an  ( Object of service names to content update actions to lists of tags)
     * @param {String} hash You can use either 'hash' or 'hashes',
     */
    async add_tags(actions, hash) {
        let json = {};
        if (!('service_names_to_tags' in actions || 'service_names_to_actions_to_tags' in actions)) {
            throw new NotEnoughArgumentsError('You must have at least one \'service_names...\' argument');
        } else {
            if (typeof hash === 'object') {
                if (Object.keys(hash).length > 1) {
                    json.hashes = hash;
                } else {
                    json.hash = hash[0];
                }
            } else {
                json.hash = hash;
            }
            if ('service_names_to_tags' in actions) {
                json.service_names_to_tags = actions.service_names_to_tags;
            }
            if ('service_names_to_actions_to_tags' in actions) {
                json.service_names_to_actions_to_tags = actions.service_names_to_actions_to_tags;
            }
            if ('add_siblings_and_parents' in actions) {
                if (typeof actions.add_siblings_and_parents === boolean) {
                    json.add_siblings_and_parents = actions.add_siblings_and_parents;
                } else {
                    throw new IncorrectArgumentsError('value of add_siblings_and_parents is of improper type: expects boolean')
                }
            }
        }

        return await this.build_call(
            'POST',
            ENDPOINTS.ADD_TAGS,
            {
                json,
            }
        );
    }

    /**
     * Ask the client about how it will see certain tags.
     * @param {Array<String>} tags 
     */
    async clean_tags(tags) {
        return await this.build_call(
            'GET',
            ENDPOINTS.CLEAN_TAGS,
            {
                queries: {
                    tags: JSON.stringify(tags),
                },
            }
        );
    }

    /**
     * Ask the client about its tag services
     */
    async get_tag_services() {
        return await this.build_call(
            'GET',
            ENDPOINTS.GET_TAG_SERVICES
        );
    }

    //
    // Adding URLs

    /**
     * Ask the client about a URL's files.
     * @param {URL} url url you want to check
     */
    async get_url_files(url) {
        return await this.build_call(
            'GET',
            ENDPOINTS.GET_URL_FILES,
            {
                queries: {
                    url: url,
                },
            }
        );
    }

    /**
     * Ask the client for information about a URL.
     * @param {URL} url url you want to check
     */
    async get_url_info(url, callback) {
        return await this.build_call(
            'GET',
            ENDPOINTS.GET_URL_INFO,
            {
                queries: {
                    url: url,
                },
            }
        );
    }

    /**
     * Tell the client to 'import' a URL. This triggers the exact same routine as drag-and-dropping a text URL onto the main client window.
     * @param {Object} actions
     */
    async add_url(actions) {
        var json = {}
        if (!('url' in actions)) {
            throw new NotEnoughArgumentsError('You must have a url argument');
        } else {
            json.url = actions.url;
            if ('destination_page_name' in actions) {
                json.destination_page_name = actions.destination_page_name;
            }
            if ('destination_page_key' in actions) {
                json.destination_page_key = actions.destination_page_key;
            }
            if ('show_destination_page' in actions) {
                if (typeof actions.show_destination_page === 'boolean') {
                    json.show_destination_page = actions.show_destination_page;
                } else {
                    throw new IncorrectArgumentsError('value of show_destination_page is of improper type: expects boolean')
                }
            }
            if ('service_names_to_tags' in actions) {
                if (typeof actions.service_names_to_tags === 'object') {
                    json.service_names_to_tags = actions.service_names_to_tags;
                } else {
                    throw new IncorrectArgumentsError('value of service_names_to_tags is of improper type: expects object')
                }
            }
        }
        return await this.build_call(
            'POST',
            ENDPOINTS.ADD_URL,
            {
                json
            }
        );
    }

    /**
     * Manage which URLs the client considers to be associated with which files.
     * @param {Object} actions contains 'to_add' or 'to_delete' actions for urls. can be single urls or list
     * @param {String} hash the hash of the file you want to edit
     */
    async associate_url(actions, hash) {
        let json = {};
        if (!('to_add' in actions || 'to_delete' in actions)) {
            throw new NotEnoughArgumentsError('You must have at least one \'to_delete\' or \'to_add\' argument');
        } else {
            if ('to_add' in actions) {
                if (typeof actions.to_add === 'object') {
                    if (Object.keys(actions.to_add).length > 1) {
                        json.urls_to_add = actions.to_add;
                    } else {
                        json.url_to_add = actions.to_add[0];
                    }
                } else {
                    json.url_to_add = actions.to_add;
                }
            }
            if ('to_delete' in actions) {
                if (typeof actions.to_delete === 'object') {
                    if (Object.keys(actions.to_delete).length > 1) {
                        json.urls_to_delete = actions.to_delete;
                    } else {
                        json.url_to_delete = actions.to_delete[0];
                    }
                } else {
                    json.url_to_delete = actions.to_delete;
                }
            }
            if (typeof hash === 'object') {
                if (Object.keys(hash).length > 1) {
                    json.hashes = hash;
                } else {
                    json.hash = hash[0];
                }
            } else {
                json.hash = hash;
            }
        }
        return await this.build_call(
            'POST',
            ENDPOINTS.ASSOCIATE_URL,
            {
                json
            }
        );
    }



    /**
     * Search for the client's files.
     * @param {Array<string>} tags url you want to check
     */
    async search_files(tags, system_inbox = false, system_archive = false) {
        return await this.build_call(
            'GET',
            ENDPOINTS.SEARCH_FILES,
            {
                queries: {
                    'tags': JSON.stringify(tags),
                    'system_inbox': system_inbox,
                    'system_archive': system_archive
                },
            }
        );
    }

    /**
     * Get a file's metadata
     * @param {*} actions
     */
    async get_file_metadata(actions) {
        let queries = {}
        if (('file_ids' in actions) && ('hashes' in actions)) {
            throw new IncorrectArgumentsError('only one argument is required, choose either file_ids or hashes');
        } else {
            if ('file_ids' in actions) {
                if (typeof actions.file_ids === 'object') {
                    queries.file_ids = JSON.stringify(actions.file_ids);
                } else {
                    throw new IncorrectArgumentsError('value of file_ids is of improper type: expects list')
                }
            }
            if ('hashes' in actions) {
                if (typeof actions.hashes === 'object') {
                    queries.hashes = JSON.stringify(actions.hashes);
                } else {
                    throw new IncorrectArgumentsError('value of hashes is of improper type: expects list')
                }
            }
            if ('only_return_identifiers' in actions) {
                queries.only_return_identifiers = actions.only_return_identifiers;
            }
        }
        console.log(queries);
        return await this.build_call(
            'GET',
            ENDPOINTS.GET_FILE_METADATA,
            {
                queries,
            }
        );
    }

    /**
     * Get a file
     * @param {*} actions
     */
    async get_file(actions) {
        let queries = {}
        if (('file_id' in actions) && ('hash' in actions)) {
            throw new IncorrectArgumentsError('only one argument is required, choose either file_id or hash');
        } else {
            if ('file_id' in actions) {
                queries.file_id = actions.file_id;
            }
            if ('hash' in actions) {
                queries.hash = actions.hash;
            }
        }
        this.build_call(
            'GET',
            ENDPOINTS.GET_FILE,
            {
                queries,
            }
        );
    }

    /**
     * Get a file's thumbnail.
     * @param {*} actions
     */
    async get_thumbnail(actions) {
        let queries = {}
        if (('file_id' in actions) && ('hash' in actions)) {
            throw new IncorrectArgumentsError('only one argument is required, choose either file_id or hash');
        } else {
            if ('file_id' in actions) {
                queries.file_id = actions.file_id;
            }
            if ('hash' in actions) {
                queries.hash = actions.hash;
            }
        }
        return await this.build_call(
            'GET',
            ENDPOINTS.GET_THUMBNAIL,
            {
                queries,
            }
        );
    }

    /**
     * Get the cookies for a particular domain.
     * @param {*} callback returns response
     */
    async get_cookies(domain) {
        return await this.build_call(
            'GET',
            ENDPOINTS.GET_COOKIES,
            {
                queries: {
                    'domain': domain,
                },
            }
        );
    }

    /**
     * Set some new cookies for the client. This makes it easier to 'copy' a login from a web browser or similar to hydrus if hydrus's login system can't handle the site yet.
     * @param {*} json 
     */
    async set_cookies(json) {
        return await this.build_call(
            'POST',
            ENDPOINTS.SET_COOKIES,
            {
                json,
            }
        );
    }

    /**
     * Get the page structure of the current UI session.
     */
    async get_pages() {
        return await this.build_call(
            'GET',
            ENDPOINTS.GET_PAGES
        );
    }

    /**
     * Get information about a specific page.
     * @param {Object} actions 
     */
    async get_page_info(actions) {
        var queries = {}
        if (!('page_key' in actions)) {
            throw new IncorrectArgumentsError('page_key argument required');
        } else {
            queries.page_key = actions.page_key;
            if ('simple' in actions) {
                queries.simple = actions.simple;
            }
        }
        return await this.build_call(
            'GET',
            ENDPOINTS.GET_PAGE_INFO,
            {
                queries
            }
        );
    }

    /**
     * 'Show' a page in the main GUI, making it the current page in view. If it is already the current page, no change is made.
     * @param {*} actions 
     */
    async focus_page(actions) {
        var json = {}
        if ('page_key' in actions) {
            json.page_key = actions.page_key;
        } else {
            throw new IncorrectArgumentsError('page_key argument required');
        }
        return await this.build_call(
            'POST',
            ENDPOINTS.FOCUS_PAGE,
            {
                json,
            }
        );
    }

};