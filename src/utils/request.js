import errors from '../errors.js';

const handleResponse = async (resp) => {
    if (!resp.ok) {
        throw new errors.RequestError(resp.status, resp.statusText);
    }
    const json = await resp.json();
    if (json.code !== 0) {
        throw new errors.ApiError(json.code, json.msg);
    }
    return json.data;
}

const get = async (path, params) => {
    let url = path;
    if (params) {
        url += '?' + new URLSearchParams(params);
    }
    const resp = await fetch(url);
    return handleResponse(resp);
}

const post = async (url, body) => {
    const resp = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-type': 'application/json',
            'Accept': 'application/json'
        }
    })
    return handleResponse(resp);
}

const postForm = async (url, body) => {
    const resp = await fetch(url, {
        method: 'POST',
        body: body,
    })
    return handleResponse(resp);
}

const request = { get, post, postForm };

export default request;