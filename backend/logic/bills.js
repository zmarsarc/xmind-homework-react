async function handleUserBills(rawRecords) {
    return new Promise((resolve, reject) => {
        // 将类目和账单信息分类
        let categories = new Map(); // 账单类目
        let billRecords = [];       // 原始账单记录
        let bills = [];             // 账单

        for (let records of rawRecords) {
            if (records.length < 1) {
                continue;
            }
            if (checkCategoryHeader(records[0])) {
                readCategory(categories, records); // 如果错误会抛出异常
            }
            billRecords.push(records);
        }
        for (let records of billRecords) {
            if (checkBillHeader(records[0])) {
                bills = bills.concat(readBills(categories, records));
            }
        }
        resolve(bills);
    })
}

function checkCategoryHeader(header) {
    return (header.includes('id') && header.includes('type') && header.includes('name'));
}

function checkBillHeader(header) {
    return (header.includes('type') && header.includes('time') && header.includes('category') && header.includes('amount'));
}

function readCategory(categories, records) {
    const header = records[0];

    const idIndex = header.indexOf('id');
    const typeIndex = header.indexOf('type');
    const nameIndex = header.indexOf('name');

    for (let c of records.slice(1)) {
        if (categories.has(c[idIndex])) {
            throw new Error('duplicate category id');
        }
        categories.set(c[idIndex], {
            'type': c[typeIndex],
            'name': c[nameIndex]
        });
    }
}

function readBills(categories, records) {
    const header = records[0];

    const typeIndex = header.indexOf('type');
    const timeIndex = header.indexOf('time');
    const categoryIndex = header.indexOf('category');
    const amountIndex = header.indexOf('amount');

    const bills = []
    for (let r of records.slice(1)) {
        const type = Number(r[typeIndex]);
        const time = new Date(Number(r[timeIndex]))
        const amount = Number(r[amountIndex]);
        if (!categories.has(r[categoryIndex])) {
            throw new Error('invalid category');
        }
        const category = categories.get(r[categoryIndex]).name;

        bills.push({
            type: type,
            time: time,
            category: category,
            amount: amount
        })
    }
    return bills;
}

module.exports = { handleUserBills }