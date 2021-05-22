const ledger = require('./ledger.js');
const sinon = require('sinon');
const expect = require('chai').expect;
const resp = require('./response.js');
const logger = require('log4js');
const { number } = require('joi');

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

describe('add category params check', function() {
    const validParams = {
        name: 'category',
        type: 0,
    }
    const testFunc = ledger.checkAddCategoryParams;

    it('should pass if valid', function() {
        expect(testFunc(validParams)).to.be.undefined;
    })
    it('must have name', function() {
        expect(testFunc({...validParams, name: undefined})).not.be.undefined;
    })
    it('must have type', function() {
        expect(testFunc({...validParams, type: undefined})).not.be.undefined;
    })
    it('type should be 0 or 1', function() {
        expect(testFunc({...validParams, type: -1})).not.be.undefined;
        expect(testFunc({...validParams, type: 2})).not.be.undefined;
    })
    it('accept valid type', function() {
        expect(testFunc({...validParams, type: 0})).to.be.undefined;
        expect(testFunc({...validParams, type: 1})).to.be.undefined;
    })
})

describe('test addCategory api', function() {
    beforeEach(function() {
        this.ctx = {
            logger: logger.getLogger(),
            user: {
                id: 1,
                name: 'admin',
            },
            request: {
                body: {
                    name: 'category',
                    type: 0,
                }
            }
        }
    })

    it('should deny if params invalid', async function() {
        this.ctx.request.body = {};
        const api = ledger.addCatagory(sinon.fake.resolves());
        await api(this.ctx);
        expect(this.ctx.body).to.deep.equal(resp.invalidParams);
    })
    describe('if call backend', function() {
        it('must call once', async function() {
            const backend = sinon.fake.resolves();
            const api = ledger.addCatagory(backend);
            await api(this.ctx);
            expect(backend.calledOnce).to.be.true;
        }),
        it('must specify user id', async function() {
            const backend = sinon.fake.resolves();
            const api = ledger.addCatagory(backend);
            await api(this.ctx);
            expect(backend.lastCall.firstArg).to.equal(this.ctx.user.id);
        })
        it('must hava params', async function() {
            const backend = sinon.fake.resolves();
            const api = ledger.addCatagory(backend);
            await api(this.ctx);
            expect(backend.lastCall.lastArg).to.deep.equal(this.ctx.request.body);
        })
    })
    it('should return id if success', async function() {
        const api = ledger.addCatagory(sinon.fake.resolves(1));
        await api(this.ctx);
        expect(this.ctx.body).to.deep.equal({...resp.ok, data: {id: 1}});
    })
})

describe('test getOverview', function() {
    beforeEach(function() {
        this.ctx = {
            user: {
                id: 1, name: 'admin',
            }
        }
    })

    describe('should return the overview of all bills if no month specified', function() {
        beforeEach(function() {
            this.backend = sinon.fake.resolves({total: 0, items: []});
            this.api = ledger.getOverview(this.backend);
        });
        it('should call backend only once', async function() {
            await this.api(this.ctx);
            expect(this.backend.calledOnce).to.be.true;
        })
        it('should with user id', async function() {
            await this.api(this.ctx);
            expect(this.backend.lastCall.args[0]).to.deep.equal({
                userId: this.ctx.user.id,
            })
        })
    })
    describe('should return the overview of that bills in which month is specified', function() {
        this.beforeEach(function() {
            this.backend = sinon.fake.resolves({total: 0, items: []});
            this.api = ledger.getOverview(this.backend);
            this.ctx.params = {
                year: '2021',
                month: '5',
            }
        })
        it('should call backend only once', async function() {
            await this.api(this.ctx);
            expect(this.backend.calledOnce).to.be.true;
        })
        it('should have userid, year and month', async function() {
            await this.api(this.ctx);
            expect(this.backend.lastCall.args[0]).to.deep.equal({
                userId: this.ctx.user.id,
                year: Number(this.ctx.params.year),
                month: Number(this.ctx.params.month),
            })
        })
    })
    describe('should return count of bills', function() {
        it('should count input', async function() {
            const api = ledger.getOverview(sinon.fake.resolves({items: [{type: 1, amount: 1}]}));
            await api(this.ctx);
            expect(this.ctx.body.data).to.deep.equal({
                outgoing: 0,
                income: 1,
            })
        })
        it('should count outgoing', async function() {
            const api = ledger.getOverview(sinon.fake.resolves({items: [{type: 0, amount: 1}]}));
            await api(this.ctx);
            expect(this.ctx.body.data).to.deep.equal({
                outgoing: 1,
                income: 0,
            })
        })
    })
})

describe('test getMonthList', function() {
    beforeEach(function() {
        this.ctx = {
            logger: logger.getLogger(),
            user: {id: 1, name: 'admin'},
        }
    })

    describe('should call backend', function() {
        beforeEach(function() {
            this.backend = sinon.fake.resolves({items: []});
            this.api = ledger.getMonthList(this.backend);
        })
        it('should call backend once', async function() {
            await this.api(this.ctx);
            expect(this.backend.calledOnce).to.be.true;
        })
        it('should call backend with user id', async function() {
            await this.api(this.ctx);
            expect(this.backend.lastCall.args[0]).to.deep.equal({
                userId: this.ctx.user.id,
            })
        })
    })
    describe('count amount', function() {
        beforeEach(function() {
            const now = Date.now();
            const date = new Date(now);
            this.expectDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            this.fakeItems = {items: [{
                eventTime: Math.trunc(now / 1000),
                type: 1,
                amount: 1,
            }]}
        })

        it('should count income', async function() {
            this.fakeItems.items[0].type = 1;
            await (ledger.getMonthList(sinon.fake.resolves(this.fakeItems))(this.ctx));
            expect(this.ctx.body.data).to.deep.equal([{
                date: this.expectDate,
                income: 1,
                outgoing: 0
            }])
        })
        it('should count outgoing', async function() {
            this.fakeItems.items[0].type = 0;
            await (ledger.getMonthList(sinon.fake.resolves(this.fakeItems))(this.ctx));
            expect(this.ctx.body.data).to.deep.equal([{
                date: this.expectDate,
                income: 0,
                outgoing: 1,
            }])
        })
    })
    it('return values must sorted', async function() {
        const now = Date.now();
        const fakeItems = [
            {eventTime: 0, type: 0, amount: 0},
            {eventTime: Math.trunc(now / 1000), type: 0, amount: 0},
        ]
        const date = new Date(now);
        const expectDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        await (ledger.getMonthList(sinon.fake.resolves({items: fakeItems}))(this.ctx));
        expect(this.ctx.body.data).to.deep.equal([
            {date: expectDate, income: 0, outgoing: 0},
            {date: '1970-01', income: 0, outgoing: 0},
        ])
    })
})