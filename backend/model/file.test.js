const fs = require('fs').promises;
const file = require('./file.js');
const { F_OK } = require('constants');
const path = require('path');
const expect = require('chai').expect;

describe('test file backend save item', function() {
    const testpath = "./test_data";
    
    // clear after test
    after(async function() {
        return fs.access(testpath, F_OK).then(() => {
            return fs.rm(testpath, {recursive: true, force: true});
        }).catch(err => {return Promise.resolve();});
    })

    it('should create dir if not exits', async function() {
        const backend = new file(testpath);
        await backend.saveItem(0, {});

        let err = null;
        try {
            await fs.access(testpath, F_OK);
        }
        catch (e) {
            err = e;
        }

        expect(err).to.be.null;
    })

    it('should create file if not exists', async function() {
        const backend = new file(testpath);
        await backend.saveItem(0, {});

        let err = null;
        try {
            await fs.access(path.join(testpath, 'ledger.json'), F_OK);
        }
        catch (e) {
            err = e;
        }

        expect(err).to.be.null;
    })

    it('should actual write file', async function() {
        const backend = new file(testpath);
        const expectData = {a: 1, name: 'anderson'};
        await backend.saveItem(0, expectData);

        const actualData = await fs.readFile(path.join(testpath, 'ledger.json'));

        expect(actualData.toString()).to.contain(JSON.stringify(expectData));
    })
})