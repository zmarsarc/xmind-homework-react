const koa = require('koa');
const koaRouter = require('koa-router');
const ledger = require('./ledger.js');
const sinon = require('sinon');
const request = require('supertest');
const expect = require('chai').expect;
const resp = require('./response.js');

class TestServerMaker {
    constructor(fakeUser) {
        this.servers = [];
        this.fakeUser = fakeUser;
    }

    new(router) {
        const app = new koa();
        require('koa-validate')(app);
        app.context.logger = require('log4js').getLogger();
        app.use(require('koa-body')());
        app.use(fakeLogin(this.fakeUser.id, this.fakeUser.name))
        app.use(router);
        
        const server = app.listen();
        this.servers.push(server);
        return server;
    }

    closeAll() {
        for (let s of this.servers) {
            s.close();
        }
    }
}

function fakeLogin(userid, username) {
    return async(ctx, next) => {
        ctx.user = {id: userid, name: username};
        await next();
    }
}

describe('test save ledger item', function() {
    const fakeUser = {id: 1, name: 'admin'};
    const testServer = new TestServerMaker(fakeUser);
    const apiPath = '/ledger/item';

    after(() => { testServer.closeAll() })

    const prepareRouter = () => {
        const backend = sinon.fake();
        const router = new koaRouter();
        router.post(apiPath, ledger.addItem(backend));

        return {backend: backend, router: router};
    }

    it('should check params before call backend', function(done) {
        const env = prepareRouter();

        request(testServer.new(env.router.routes())).post(apiPath).then(res => {
            expect(res.body.code).to.equal(resp.invalidParams.code);
            expect(env.backend.notCalled).to.be.true;
            done();
        })
        .catch(done);
    })

    it('call backend with user id and item', function(done) {
        const env = prepareRouter();

        const requestData = {time: Date.now(), input: 0, type: '123456abcdef', amount: 100.00};
        request(testServer.new(env.router.routes())).post(apiPath)
        .send(requestData)
        .then(res => {
            expect(res.body.code).to.equal(resp.ok.code);
            expect(env.backend.calledOnce).to.be.true;
            expect(env.backend.firstCall.firstArg).to.equal(1);
            expect(env.backend.firstCall.lastArg).to.deep.equal(requestData);
            done();
        })
        .catch(done);
    })
})

describe('test get ledger item by month', function() {
    const fakeUser = {id: 1, name: 'admin'}
    const serverMaker = new TestServerMaker(fakeUser);
    const apiPath = '/ledger/item/month/:month';
    const testData = {name: 'abc'};

    after(() => { serverMaker.closeAll(); })

    const prepareRouter = () => {
        const backend = sinon.fake.resolves(testData);
        const router = new koaRouter();
        router.get(apiPath, ledger.getItemsInMonth(backend));

        return {backendStub: backend, router: router};
    }

    it('should not match url', function(done) {
        const testEnv = prepareRouter();
        
        request(serverMaker.new(testEnv.router.routes()))
        .get('/ledger/item/month')
        .expect(404, done);
    })

    it('should check url params', function(done) {
        const env = prepareRouter();
        request(serverMaker.new(env.router.routes()))
        .get('/ledger/item/month/abc')
        .then(res => {
            expect(res.body.code).to.equal(resp.invalidParams.code);
            done();
        })
        .catch(done);
    })

    it('if ok, should call backend to get item', function(done) {
        const env = prepareRouter();
        request(serverMaker.new(env.router.routes()))
        .get('/ledger/item/month/3')
        .then(res => {
            expect(res.body.code).to.equal(resp.ok.code);
            expect(res.body.data).to.deep.equal(testData);
            expect(env.backendStub.calledOnce).to.be.true;
            expect(env.backendStub.firstCall.firstArg).to.equal(fakeUser.id);
            expect(env.backendStub.firstCall.lastArg).to.equal(3);
            done();
        })
        .catch(done);
    })
})

describe('test category accesss', function() {
    const fakeUser = {id: 1, name: 'admin'}
    const envMaker = new TestServerMaker(fakeUser);
    const testPath = '/api/category';

    after(function() {
        envMaker.closeAll();
    })

    beforeEach(function() {
        const router = new koaRouter();
        const backend = sinon.fake();
        this.backend = backend;
        router.post(testPath, ledger.addCatagory(backend));
        this.server = envMaker.new(router.routes());
    })
    
    const sendRequest = (server, body) => {
        return request(server).post(testPath).send(body);
    }

    describe('should check input params', function() {
       
        describe('should check type value', function() {
            it('should have value', function(done) {
                sendRequest(this.server, {'name': 'abcdefg'}).then(res => {
                    expect(res.body.code).to.equal(resp.invalidParams.code);
                    done();
                })
                .catch(done)
            })
            it('should falied value excceed', function(done) {
                sendRequest(this.server, {name: 'abcd', type: 1000}).then(res => {
                    expect(res.body.code).to.equal(resp.invalidParams.code);
                    done();
                })
                .catch(done);
            })
            it('should ok', function(done) {
                sendRequest(this.server, {name: "abc", type: 1}).then(res => {
                    expect(res.body.code).to.equal(resp.ok.code);
                    done();
                })
                .catch(done);
            })
        })

        describe('should check name', function() {
            it('should have name', function(done) {
                sendRequest(this.server, {type: 0}).then(res => {
                    expect(res.body.code).to.equal(resp.invalidParams.code);
                    done();
                })
                .catch(done);
            })
            it('should ok', function(done) {
                sendRequest(this.server, {type: 0, name: 'aaaa'}).then(res => {
                    expect(res.body.code).to.equal(resp.ok.code);
                    done();
                })
                .catch(done);
            })
        })
    })
    describe('should write to backend if ok', function() {
        it('should call only once and have right params', function(done) {
            const fakeCategory = {type: 0, name: 'abc'}
            sendRequest(this.server, fakeCategory).then(res => {
                expect(this.backend.calledOnce).to.be.true;
                expect(this.backend.firstCall.firstArg).to.equal(fakeUser.id);
                expect(this.backend.firstCall.lastArg).to.deep.equal(fakeCategory);
                expect(res.body.code).to.equal(resp.ok.code);
                done();
            })
            .catch(done);
        })
    })
})