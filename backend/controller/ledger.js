const resp = require('./response.js');
const csv = require('csv');
const fs = require('fs');
const { handleUserBills } = require('../logic/bills.js');
const joi = require('joi');

// addItem接口输入参数的定义
const addItemParamsSchema = joi.object({
    'time': joi.number().integer().positive().max(2147485547).required(), // 要求传入的unix时间戳单位为s，js默认拿到的时间是ms，需要前端处理
    'input': joi.number().integer().min(0).max(1).required(), // 收支类型只有收入和支出
    'type': joi.string().pattern(/^[a-z0-9]{10}$/).required(), // 合法的账目id需要符合此格式
    'amount': joi.number().positive().required(),
});

// 检查addItem的输入参数
const checkAddItemRequestParams = json => {
    const {error} = addItemParamsSchema.validate(json);
    return error
}

// 检查getItemsInMonth接口的URL参数
const checkGetItemsInMonthRequestParams = (y, m) => {
    try {
        const year = joi.attempt(y, joi.number().integer().positive().required());
        const month = joi.attempt(m, joi.number().integer().min(1).max(12).required());
        return [year, month, undefined];
    }
    catch (err) {
        return [undefined, undefined, err];
    }
}

// 收支类型
const BillType = {
    InAndOut: 0,
    Income: 1,
    Outgoing: 2,
};

// getItemInMonth接口查询参数定义
const getItemsInMonthRequestQuerySchema = joi.object({
    'offset': joi.number().integer().min(0).required(), // 分页偏移，大于0
    'limit': joi.number().integer().positive().required(),  // 每页大小，大于0，一般是5、10、20
    'order': joi.string().valid('date asc', 'date des', 'amount asc', 'amount des').default('date des'), // 排序基准
    'type': joi.number().integer().min(BillType.InAndOut).max(BillType.Outgoing).default(BillType.InAndOut), // 收支类型
    'category': joi.string().allow('').pattern(/^[a-z0-9]{0,10}$/).default('').optional(),
});

// 检查getItemInMonth的query参数
const checkGetItemsInMonthRequestQuery = json => {
    const {value, error} = getItemsInMonthRequestQuerySchema.validate(json);
    if (error) {
        return {error: error};
    }
    return {value: value};
};

// 添加账目中间件
//
// saveItem是具有async function(userid, item)签名的函数
// 其中item结构如 {time: [number], input: [number], type: [string], amount: [number]}
// userid是用户的id
const addItem = saveItem => {
    // 添加一条账目
    // 
    // router: [post] /api/ledger/item
    //
    // param: [json] {time: 123123123, input: 0, type: "12348abcd", amount: 100.00}
    //      time [number]: 账目时间，unix时间
    //      input [number]: 入账？0代表出账，1代表入账
    //      type [string]: 类型，用户自定的分类，记录的是分类的uuid
    //      amount [number]: 金额
    //
    // response: [json] {code: 0, msg: "ok"}
    //      code [number]: 错误码，成功为0，否则非0
    //      msg [string]: 错误提示信息
    return async ctx => {
        const error = checkAddItemRequestParams(ctx.request.body);
        if (error) {
            ctx.logger.error(`invalid params: ${error}`);
            ctx.body = resp.invalidParams;
            return;
        }
        
        await saveItem(ctx.user.id, ctx.request.body);
        ctx.body = resp.ok;
        return;
    }
}

// router: /api/ledger/item/:year/:month
// response: json {"code": 0, "msg": "ok", "data": {
//    total: 1, items:[{"id": 1, "userId": 1, "eventTime": , "writeTime": , "type": , "category": , "amount": }]
//    }}
const getItemsInMonth = (readItem) => {
    return async ctx => {
        const [year, month, err] = checkGetItemsInMonthRequestParams(ctx.params.year, ctx.params.month);
        if (err) {
            ctx.logger.error(`invalid url params, ${err}`);
            ctx.body = resp.invalidParams;
            return;
        }
        const {value, error} = checkGetItemsInMonthRequestQuery(ctx.query);
        if (error) {
            ctx.logger.error(`invalid query params, ${error}`);
            ctx.body = resp.invalidParams;
            return;
        }
        const filter = {
            ...value,
            userId: ctx.user.id,
            year: year,
            month: month,
        };
        ctx.body = resp.json(await readItem(filter));
    }
}

module.exports = {
    checkAddItemRequestParams,
    addItem,
    checkGetItemsInMonthRequestParams,
    checkGetItemsInMonthRequestQuery,
    getItemsInMonth,
    
    // 添加账目类目，传入参数saveCategory是一个具有 async function(number, json{"type": , "name":}) 签名的方法
    // saveCategory作为将类目数据写入持久化存储的代理
    //
    // router: POST /api/category
    // body: json {"type": [int], "name": [string]}
    //      type: 类型，出账或是入账，可选值[0,1]
    //      name: 名称，有 unique(userid, type, name) 的限制
    // response: json {"code": 0, "msg": "ok", "data"; {"id": "abcdef1234"}}
    //      返回最新创建的category的id给前端
    addCatagory: (saveCategory) => {
        return async (ctx, next) => {
            ctx.checkBody('type').notEmpty().isInt().isIn([0, 1]);
            ctx.checkBody('name').notEmpty();
            if (ctx.errors) {
                ctx.logger.error(`invalid params when add category to user ${ctx.user.name}`);
                ctx.body = resp.invalidParams;
                return await next();
            }

            const id = await saveCategory(ctx.user.id, ctx.request.body);
            ctx.logger.debug(`user ${ctx.user.name} add new category ${ctx.request.body.name}, id ${id}`);
            ctx.body = resp.json({id: id});
            return await next();
        }
    },

    // 获取账目类目
    //
    // router: GET /api/category
    // response: json {"code": 0, "msg": "ok", "data": []}
    getCategory: (readCategory) => {
        return async(ctx, next) => {
            ctx.logger.debug(`user ${ctx.user.name} get category`);
            ctx.body = resp.json(await readCategory(ctx.user.id));
            return await next();
        }
    },

    // 按类型获取账目类目
    //
    // router: GET /api/cagetory/type/:typeid
    // response: json {"code": 0, "msg": "ok", "data": [object]}
    getCategoryByType: (readCategory) => {
        return async(ctx, next) => {
            ctx.logger.debug(`user ${ctx.user.name} get category with type ${ctx.params.typeid}`);
            ctx.body = resp.json(await readCategory(ctx.user.id, ctx.params.typeid));
            return await next();
        }
    },

    // router: GET /api/overview
    // router: GET /api/overview/month/:month
    getOverview: (readLedger) => {
        return async(ctx, next) => {
            let items = []
            if (ctx.params) {
                items = (await readLedger({userId: ctx.user.id, year: ctx.params.year, month: ctx.params.month})).items;
            } else {
                items = (await readLedger({userId: ctx.user.id})).items;
            }
            let output = 0;
            let input = 0;
            for (let i of items) {
                // output
                if (i.type === 0) {
                    output += i.amount;
                }

                // input
                if (i.type === 1) {
                    input += i.amount;
                }
            }

            ctx.body = resp.json({outgoing: output, income: input});
        }
    },

    // 获取月度列表
    // router: GET /api/month
    getMonthList: (reader) => {
        return async(ctx, next) => {
            ctx.logger.debug(`${ctx.user.name} get month list`);
            const {items} = await reader({userId: ctx.user.id});

            for (let i in items) {
                const date = new Date(items[i].eventTime);
                items[i].yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            }

            const month = {};
            for (let i of items) {
                if (!month[i.yearMonth]) {
                    month[i.yearMonth] = {date: i.yearMonth, income: 0, outgoing: 0}
                }
                if (i.type === 0) {
                    month[i.yearMonth].outgoing += i.amount;
                }
                if (i.type === 1) {
                    month[i.yearMonth].income += i.amount;
                }
            }

            ctx.body = resp.json(Object.values(month).sort((i, j) => { return j.date.localeCompare(i.date); }));
        }
    },

    // 导入账单文件
    // router: POST /api/ledger/file
    importLedger: (saver) => {
        return async(ctx, next) => {
            ctx.logger.debug(`${ctx.user.name} import ledger file`);
            if (!ctx.request.files) {
                ctx.body = resp.invalidParams;
                return await next();
            }

            const readProcesses = [];
            for (let file of ctx.request.files.files) {
                const parseProcess = new Promise((resolve, reject) => {
                    const parse = csv.parse({delimiter: ','}, (err, records) => {
                        if (err) reject(err);
                        resolve(records);
                    });
                    const rs = fs.createReadStream(file.path);
                    rs.pipe(parse);
                })
                readProcesses.push(parseProcess);
            }
            
            const files = await Promise.all(readProcesses);
            const bills = await handleUserBills(files);
            await saver(ctx.user.id, bills);

            ctx.body = resp.ok;
        }
    }
}