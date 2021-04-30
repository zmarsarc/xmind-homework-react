const path = require('path');
const fs = require('fs').promises;
const { F_OK } = require('constants');

module.exports = class {
    constructor(root) {
        this.root = root

        // 这个方法会通给controller作为数据后端，将它绑定到对象上避免写闭包函数
        this.saveItem = this.saveItem.bind(this);
    }

    async saveItem(userid, item) {
        // check file exists
    
        await fs.access(this.root, F_OK)
        .then(() => {})
        .catch(() => { return fs.mkdir(this.root); })

        const filepath = path.join(this.root, 'ledger.json')
        let ledger = {}
        try {
            ledger = JSON.parse(await fs.readFile(filepath));
        }
        catch {}

        if (!ledger[userid]) {
            ledger[userid] = {maxIndex: 0, items: {}}
        }
        const index = ledger[userid].maxIndex + 1;
        ledger[userid].maxIndex++;

        ledger[userid].items[index] = item;

        return fs.writeFile(filepath, JSON.stringify(ledger));
    }
}