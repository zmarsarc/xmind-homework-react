const crypto = require('crypto');

module.exports = class {
    constructor(conf) {
        const sqlite3 = require('better-sqlite3');
        this.db = new sqlite3(conf.database);
        this.prepare();
    }

    prepare() {

        // 用户表模板
        const userSchema = `
        create table if not exists users (
            id integer primary key not null,
            username varchar(64) not null unique,
            password varchar(128) not null,
            create_time datetime not null default current_time,
            last_login datetime,
            role integer not null
        );
        insert or ignore into users (id, username, password, role) values (1, 'admin', '', 0);`

        // 账单表模板
        const ledgerSchema = `
        create table if not exists ledger (
            id integer primary key not null, 
            user_id integer not null references users(id),
            event_time datetime not null,
            write_time timestamp not null default current_timestamp,
            type int not null,
            category varchar(10) not null references category(id),
            amount decimal(12,2) not null
        );
        create index if not exists ledger_user_id on ledger (user_id);`

        // 类目表模板
        const categorySchema = `
        create table if not exists category (
            id varchar(10) not null primary key,
            user_id integer not null references users(id),
            write_time datetime not null default current_time,
            type int not null,
            name text not null
        );
        create unique index if not exists user_category_name on category (user_id, name);`

        this.db.pragma('foreign_key = ON');
        this.db.exec(userSchema);
        this.db.exec(categorySchema);
        this.db.exec(ledgerSchema);
    }

    close() {
        this.db.close();
    }

    generateCategoryId(length) {
        if (length < 0) length = 0;

        const characters = 'abcdefghijklmnopqrstvuwxyz0123456789';
        const maxIndex = characters.length;
        const result = [];
        for (let i = 0; i < length; i++) {
            result.push(characters[crypto.randomInt(0, maxIndex)]);
        }

        return result.join('');
    }

    async saveUser(user) {
        return new Promise((resolve) => {
            const stmt = this.db.prepare('insert into users(username, password, role) values (?, ?, ?)');
            const result = stmt.run(user.username, user.password, user.role);
            resolve(result.lastInsertRowid);
        });
    }

    async getUser(filter) {
        if (filter.userId) {
            return new Promise((resolve) => {
                const sql = `
                select 
                id, username, password, create_time as createTime, last_login as lastLoginTime, role 
                from users 
                where id = ?`
                const row = this.db.prepare(sql).get(filter.userId);
                resolve(row)
            })
        }
    }

    async saveItem(userid, item) {
        return new Promise((resolve) => {
            const sql = `
            insert into ledger(user_id, event_time, type, category, amount)
            values (?, strftime('%Y-%m-%d %H:%M:%S', ?, 'unixepoch', 'localtime'), ?, ?, ?)`;
            resolve(this.db.prepare(sql).run(userid, item.time, item.input, item.type, item.amount).lastInsertRowid);
        })
    }

    // field names: id, userId, eventTime, writeTime, type, category, amount
    async getItem(filter) {
        let query = JSON.parse(JSON.stringify(filter));
        return new Promise((resolve, reject) => {
            const sql = `select id, user_id as userId, event_time as eventTime, write_time as writeTime, type, category, amount
            from ledger`
            if (query.id) {
                const querySql = sql + ' where id = ?';
                resolve(this.db.prepare(querySql).get(query.id));
            }
            if (query.userId) {
                let queryTotalSql = 'select count(*) as cnt from ledger where user_id = @userId';
                let querySql = sql + ' where user_id = @userId';

                if (query.year && query.month) {
                    query.yearMonth = `${query.year}-${String(query.month).padStart(2, '0')}`;
                    const cond = ` and strftime('%Y-%m', event_time, 'localtime') = @yearMonth`
                    querySql += cond;
                    queryTotalSql += cond; 
                }

                if (query.type) {
                    let cond = ''
                    switch (query.type) {
                        case 0:
                            cond = ' and type in (0, 1)';
                            break;
                        case 1:
                            cond = ' and type = 1';
                            break;
                        case 2:
                            cond = ' and type = 0';
                            break;
                        default:
                            break;
                    }
                    querySql += cond;
                    queryTotalSql += cond;
                }

                if (query.category && query.category !== '') {
                    let cond = ' and category = @category';
                    querySql += cond;
                    queryTotalSql += cond;
                }

                if (query.order) {
                    switch (query.order) {
                        case 'date asc':
                            querySql += ' order by event_time asc';
                            break;
                        case 'date des':
                            querySql += ' order by event_time desc';
                            break;
                        case 'amount asc':
                            querySql += ' order by amount asc';
                            break;
                        case 'amount des':
                            querySql += ' order by amount desc';
                            break;
                        default:
                            break;
                    }
                }

                if (query.offset && query.limit) {
                    querySql += ' limit @limit offset @offset'
                }

                const result = {
                    total: this.db.prepare(queryTotalSql).get(query).cnt,
                    items: this.db.prepare(querySql).all(query)
                };
                resolve(result);
            }
            reject(new Error("no user id or ledger item id specified."))
        })
    }

    async saveCategory(userid, category) {
        return new Promise((resolve) => {
            const idLength = 10;
            const id = this.generateCategoryId(idLength);
            const sql = `
            insert into category(id, user_id, type, name)
            values (?, ?, ?, ?)`
            this.db.prepare(sql).run(id, userid, category.type, category.name);
            resolve(id);
        })
    }

    async getCategory(filter) {
        return new Promise((resolve, reject) => {
            const sql = `select id, user_id as userId, write_time as writeTime, type, name from category`
            if (filter.id) {
                const querySql = sql + ' where id = ?'
                resolve(this.db.prepare(querySql).get(filter.id));
            }
            if (filter.userId) {
                let querySql = sql + ' where user_id = @userId';
                if (filter.type) {
                    querySql += ` and type = @type`
                }
                resolve(this.db.prepare(querySql).all(filter));
            }
            reject(new Error('no category id or user id specified.'));
        })
    }

    // bills like: [{type: 0, time: Date(), category: 'xxxx', amount: 100}]
    async saveImportBills(userId, bills) {
        const findCategoryId = this.db.prepare('select id from category where user_id = ? and name = ?');
        const insertMany = this.db.transaction(async bills => {
            for (let b of bills) {
                const category = findCategoryId.get(userId, b.category);
                if (!category) {
                    // 没有类目需要新增类目
                    b.category = await this.saveCategory(userId, {type: b.type, name: b.category});
                }
                else {
                    b.category = category.id;
                }
                await this.saveItem(userId, {time: b.time.getTime() / 1000, input: b.type, type: b.category, amount: b.amount});
            }
        })

        return insertMany(bills)
    }
}