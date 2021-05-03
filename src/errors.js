class RequestError extends Error {
    constructor(code, statusText) {
        super();
        this.code = code;
        this.status = statusText;
        this.message = `request error ${this.code} ${this.status}`
    }
}

class ApiError extends Error {
    constructor(code, msg) {
        super();
        this.code = code;
        this.message = msg;
    }
}

const errors = { RequestError, ApiError };

export default errors;