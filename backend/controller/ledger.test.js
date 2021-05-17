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

describe('get items in month check url params', function() {
    it('should return params if valid', function() {
        expect(ledger.checkGetItemsInMonthRequestParams('2020', '10')).to.deep.equal([2020, 10, undefined]);
    })
    describe('if year not valid', function() {
        it('year is required', function () {
            const [,,error] = ledger.checkGetItemsInMonthRequestParams(undefined, '11');
            expect(error).not.be.undefined;
        })
        it('year must be integer', function() {
            const [,,error] = ledger.checkGetItemsInMonthRequestParams('100.1', '11');
            expect(error).not.be.undefined;
        })
        it('year should be positive', function() {
            const [,,error] = ledger.checkGetItemsInMonthRequestParams('-1', '11');
            expect(error).not.be.undefined;
        })
        it('year shoudl be number', function() {
            const [,,error] = ledger.checkGetItemsInMonthRequestParams('notnumber', '11');
            expect(error).not.be.undefined;
        })
    })
    describe('if month not valid', function() {
        it('should be a number', function() {
            const [,,error] = ledger.checkGetItemsInMonthRequestParams('2020', 'notnumber');
            expect(error).not.be.undefined;
        })
        it('should greate then 0', function() {
            const [,,error] = ledger.checkGetItemsInMonthRequestParams('2020', '0');
            expect(error).not.be.undefined;
        })
        it('should less then 13', function() {
            const [,,error] = ledger.checkGetItemsInMonthRequestParams('2020', '13');
            expect(error).not.be.undefined;
        })
    })
})

describe('get items in month check query params', function() {
    const validParams = {
        offset: 0,
        limit: 10,
        order: 'date des',
        type: 0,
        category: '',
    }
    const testFunc = ledger.checkGetItemsInMonthRequestQuery;

    it('should pass if valid', function() {
        const {value} = testFunc(validParams);
        expect(value).to.deep.equal(validParams);
    })
    it('should no error if valid', function() {
        const {error} = testFunc(validParams);
        expect(error).to.be.undefined;
    })
    describe('if offset is invalid', function() {
        it('offset is required', function() {
            const {valid, error} = testFunc({...validParams, offset: undefined});
            expect(error).not.be.undefined;
        })
        it('offset must greate then 0', function() {
            const {error} = testFunc({...validParams, offset: -1});
            expect(error).not.be.undefined;
        })
        it('must be number', function() {
            const {error} = testFunc({...validParams, offset: 'notnumber'});
            expect(error).not.be.undefined;
        })
    })
    describe('if limit is invalid', function() {
        it('limit is required', function() {
            const {error} = testFunc({...validParams, limit: undefined});
            expect(error).not.be.undefined;
        })
        it('must be number', function() {
            const {error} = testFunc({...validParams, limit: 'notnumber'});
            expect(error).not.be.undefined;
        })
        it('must greater then 0', function() {
            const {error} = testFunc({...validParams, limit: -1});
            expect(error).not.be.undefined;
        })
        it('not accept 0', function() {
            const {error} = testFunc({...validParams, limit: 0});
            expect(error).not.be.undefined;
        })
    })
    describe('if order not given', function() {
        it('should use default', function() {
            const {value} = testFunc({...validParams, order: undefined});
            expect(value.order).to.equal('date des');
        })
        it('no error', function() {
            const {error} = testFunc({...validParams, order: undefined});
            expect(error).to.be.undefined;
        })
    })
    describe('if type is not given', function() {
        it('use default', function() {
            const {value} = testFunc({...validParams, type: undefined});
            expect(value.type).to.equal(0);
        })
        it('no error', function() {
            const {error} = testFunc({...validParams, type: undefined});
            expect(error).to.be.undefined;
        })
    })
    describe('if category not valid', function() {
        it('if given, it must match pattern', function() {
            const {error} = testFunc({...validParams, category: 'not category'});
            expect(error).not.be.undefined;
        })
        it('if not given, use defalut', function() {
            const {value} = testFunc({...validParams, category: undefined});
            expect(value.category).to.equal('');
        })
        it('if not given, no error', function() {
            const {error} = testFunc({...validParams, category: undefined});
            expect(error).to.be.undefined;
        })
    })
})

describe('test getItemsInMonth api', function() {
    beforeEach(function() {
        this.ctx = {
            logger: logger.getLogger(),
            user: {
                id: 1,
                name: 'admin',
            },
            params: {
                year: '2021',
                month: '5',
            },
            query: {
                'offset': 0,
                'limit': 10,
            },
        }
    });

    it('should deny if url params invalid', async function() {
        const api = ledger.getItemsInMonth(sinon.fake.resolves());
        this.ctx.params = {};
        await api(this.ctx);
        expect(this.ctx.body).to.deep.equal(resp.invalidParams);
    })
    it('should deny if query params invalid', async function() {
        const api = ledger.getItemsInMonth(sinon.fake.resolves());
        this.ctx.query = {};
        await api(this.ctx);
        expect(this.ctx.body).to.deep.equal(resp.invalidParams);
    })
    it('should ok if valid', async function() {
        const api = ledger.getItemsInMonth(sinon.fake.resolves());
        await api(this.ctx);
        expect(this.ctx.body.code).to.equal(resp.ok.code);
    })
    describe('if call backend', function() {
        it('must call once', async function() {
            const backend = sinon.fake.resolves();
            const api = ledger.getItemsInMonth(backend);
            await api(this.ctx);
            expect(backend.calledOnce).to.be.true;
        })
        it('must hava arg', async function() {
            const expectArg = {
                ...this.ctx.query,
                order: 'date des',
                type: 0,
                category: '',
                userId: 1,
                year: 2021,
                month: 5
            };
            const backend = sinon.fake.resolves();
            const api = ledger.getItemsInMonth(backend);
            await api(this.ctx);
            expect(backend.lastCall.firstArg).to.deep.equal(expectArg);
        })
    })
    it('should resp ok and data', async function() {
        const expectResp = {
            ...resp.ok,
            data: [],
        }
        const api = ledger.getItemsInMonth(sinon.fake.resolves([]));
        await api(this.ctx);
        expect(this.ctx.body).to.deep.equal(expectResp);
    })
})