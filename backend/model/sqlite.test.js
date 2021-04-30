const expect = require('chai').expect;
const sqlite = require('./sqlite.js');

describe('test sqlite backend', function() {

    beforeEach(async function() {
        this.db = new sqlite({database: ":memory:"});
        await this.db.prepare();
    })

    afterEach(function() {
        this.db.close();
    })

    describe("check user table", function() {
        const fakeUser = {username: "admin", password: "", role: 0}

        it('insert user should return last id', async function() {
            const id = await this.db.saveUser(fakeUser);
            expect(id).not.to.equal(0);
        })
        it('check it actual write done', async function() {
            const id = await this.db.saveUser(fakeUser);
            const actualUser = await this.db.getUser({userId: id});
            expect(actualUser.username).to.equal(fakeUser.username);
        })
    })

    describe('check foreign key constraint on category table work', function() {
        it('should failed because no user exists', async function() {
            let err = null;
            try { await this.db.saveCategory(0, fakeCategory); }
            catch (e) { err = e; }
            expect(err).not.to.be.null;
        })
    })

    describe("check insert category", function() {
        const fakeCategory = {type: 0, name: 'abc'}
        const fakeUser = {username: "admin", password: "", role: 0}

        beforeEach(async function() {
            this.userId = await this.db.saveUser(fakeUser)
        })

        it('should ok if user exists', async function() {
            let err = null;
            try {
                await this.db.saveCategory(this.userId, fakeCategory);
            }
            catch (e) { err = e; }
            expect(err).to.be.null;
        })

        it('check it actual write done', async function() {
            const lastId = await this.db.saveCategory(this.userId, fakeCategory);
            const actualCategory = await this.db.getCategory({id: lastId});

            expect(actualCategory.userId).to.equal(this.userId);
            expect(actualCategory.type).to.equal(fakeCategory.type);
            expect(actualCategory.name).to.equal(fakeCategory.name);
        })
    })

    describe('check ledger table work', function() {
        const fakeUser = {username: 'admin', password: '', role: 0};
        const fakeCategory = {type: 0, name: 'abc'};
        const fakeLedger = {eventTime: Date.now(), type: 0, category: 0, amount: 100.0};
    
        describe("check foreign key constraint on ledger table work", function() {
            describe('check if no user exists', function() {
                it('should failed because have foreign key constraint on user id', async function() {
                    let err = null;
                    try { await this.db.saveItem(0, fakeLedger); }
                    catch (e) { err = e; }
                    expect(err).not.to.be.null;
                })
            })
    
            describe('check if no category exists', function() {
                before(async function() {
                    this.userId = this.db.saveUser(fakeUser);
                })
                it('should failed because have foreign key constraint on category id', async function() {
                    let err = null;
                    try { await this.db.saveItem(this.userId, fakeLedger); }
                    catch (e) { err = e; }
                    expect(err).not.to.be.null;
                })
            })
        })

        describe('check it actual write done', function() {
            beforeEach(async function() {
                this.userId = await this.db.saveUser(fakeUser);
                this.categoryId = await this.db.saveCategory(this.userId, fakeCategory);
            })
            it('should actual write', async function() {
                const item = fakeLedger;
                item.category = this.categoryId;
                const id = await this.db.saveItem(this.userId, item);
                const actualItem = await this.db.getItem({id: id});
                expect(actualItem).to.contain(item);
            })
        })
    })
})