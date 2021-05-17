const ledger = require('./ledger.js');
const sinon = require('sinon');
const expect = require('chai').expect;
const resp = require('./response.js');
const logger = require('log4js');

describe('add item should check params', function() {
    const validParams = {
        'time': Math.trunc(Date.now() / 1000),
        'input': 1,
        'type': 'abcdf98765',
        'amount': 1.5,
    }

    it('should pass if valid', function() {
        expect(ledger.checkAddItemRequestParams(validParams)).to.be.undefined;
    })
    it('should error if empty', function() {
        expect(ledger.checkAddItemRequestParams({})).to.not.be.undefined;
    })
    describe('if time is invalid', function() {
        it('should error when it too big', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, time: Date.now()})).to.not.be.undefined;
        })
        it('should error when it to small', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, time: -1})).to.not.be.undefined;
        })
        it('not accept 0 value', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, time: 0})).to.not.be.undefined;
        })
        it('must be a number', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, time: 'not number'})).to.not.be.undefined;
        })
    })
    describe('input must be 1 or 2', function() {
        it('exceed range', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, input: 2})).to.not.be.undefined;
        })
        it('less then range', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, input: -1})).to.not.be.undefined;
        })
        it('must be a number', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, input: 'not number'})).to.not.be.undefined;
        })
        it('float not accept', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, input: 1.1})).to.not.be.undefined;
        })
    })
    describe('type must valid', function() {
        it('must be string', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, type: 123})).to.not.be.undefined;
        })
        it('must match regexp', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, type: 'this is too big'})).to.not.be.undefined;
        })
        it('not accept 0 len string', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, type: ''})).to.not.be.undefined;
        })
    })
    describe('amount can be float', function() {
        it('0 not accept', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, amount: 0})).to.not.be.undefined;
        })
        it('must be number', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, amount: 'abc'})).to.not.be.undefined;
        })
        it('should be positive', function() {
            expect(ledger.checkAddItemRequestParams({...validParams, amount: -1.0})).to.not.be.undefined;
        })
    })
})

describe('test addItem api', function() {
    const validParams = {
        'time': Math.trunc(Date.now() / 1000),
        'input': 0,
        'type': 'abcde09876',
        'amount': 100,
    }

    beforeEach(function() {
        this.ctx = {
            logger: logger.getLogger(),
            user: {
                id: 1,
                name: 'admin',
            },
            request: {
                body: {}
            },
            body: undefined,
        }
    })

    it('should deny access when params invalid', async function() {
        this.ctx.request.body = {};
        const api = ledger.addItem(sinon.fake.resolves());
        await api(this.ctx);
        expect(this.ctx.body).to.deep.equal(resp.invalidParams);
    })
    describe('if has valid params', function() {
        beforeEach(() => {
            this.ctx.ctx.request.body = validParams;
        })
        it('should ok if params valid', async function() {
            const api = ledger.addItem(sinon.fake.resolves());
            await api(this.ctx);
            expect(this.ctx.body).to.deep.equal(resp.ok);
        })
        it('should call backend only once', async function() {
            const fakeBackend = sinon.fake.resolves();
            const api = ledger.addItem(fakeBackend);
            await api(this.ctx);
            expect(fakeBackend.calledOnce).to.be.true;
        })
        it('should call backend with user id', async function() {
            const fakeBackend = sinon.fake.resolves();
            const api = ledger.addItem(fakeBackend);
            await api(this.ctx);
            expect(fakeBackend.lastCall.firstArg).to.equal(1);
        })
        it('should call backend with params', async function() {
            const fakeBackend = sinon.fake.resolves();
            const api = ledger.addItem(fakeBackend);
            await api(this.ctx);
            expect(fakeBackend.lastCall.lastArg).to.deep.equal(validParams);
        })
    })
})