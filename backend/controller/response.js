module.exports = {
    json: (data) => { return {code: 0, msg: 'ok', data: data} },
    ok: {code: 0, msg: 'ok'},
    noAuth: {code: 1, msg: 'need login'},
    invalidParams: {code: 100001, msg: 'invalid request params'},
    internalError: {code: 200000, msg: 'internal error'},
}