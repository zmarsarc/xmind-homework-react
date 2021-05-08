import { useEffect, useState } from "react";
import { css } from '@emotion/css';
import ledger from '../api/ledger.js';

const LedgerItem = ({ value, categories }) => {

    const typeNames = {
        0: "支出",
        1: "收入"
    }

    const categoriesName = Object.fromEntries(categories.map(v => {
        return [v.id, v.name];
    }))

    const toTimeString = t => {
        const time = new Date(t);
        const pad2 = t => {
            return String(t).padStart(2, '0');
        }
        return `${time.getFullYear()}-${time.getMonth() + 1}-${time.getDate()} ${pad2(time.getHours())}:${pad2(time.getMinutes())}`
    }

    return (
        <tr><td>{toTimeString(value.eventTime)}</td><td>{typeNames[value.type]}</td><td>{categoriesName[value.category]}</td><td>{value.amount}</td></tr>
    )
};

const monthLedgerViewStyle = css`
    display: inline-block;
    box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.2);

    header {
        font-size: 36px;
        background-color: #3498db;
        padding: 10px;
    }

    main {
        margin: 10px;

        table {
            border-collapse: collapse;
            border: 1px solid #ecf0f1;
            thead tr {
                background-color: #3498db;
                font-size: 32px;

                th {
                    user-select: none;
                    cursor: pointer;
                    padding: 0px 5px;
                    :hover {
                        background-color: #2980b9;
                    }
                }
            }

            tbody {
                tr {
                    border-bottom: 1px solid #EEE;
                    :hover {
                        background-color: #EEE;
                    }
                }

                td {
                    font-size: 20px;
                    padding: 2px 10px;
                }
            }
        }
    }
`;

const pageSelectorStyle = css`
    display: flex;
    justify-content: flex-end;
    align-items: center;

    div {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2px 5px;
        min-width: 18px;
        border: 1px solid #ecf0f1;
        user-select: none;
        cursor: pointer;

        :hover {
            background-color: #ecf0f1;
        }
        :active {
            background-color: #bdc3c7;
        }

        &.current {
            background-color: #ecf0f1;
        }
    }
`;

const monthOverviewStyle = css`
    display: flex;
    justify-content: flex-start;
    align-items: center;

    label {
        font-size: 16px;
    }

    .val {
        margin-left: 5px;
        font-size: 32px;
    }

    .income {
        color: #2ecc71;
    }

    .outgoing {
        color: #e74c3c;
    }
`;

const MonthNameLabel = ({month}) => {
    const monthName = ['一','二','三','四','五','六','七','八','九','十','十一','十二'];
    return (<>
        <span>{monthName[month]}月账单</span>
    </>)
};

const MonthOverview = ({year, month}) => {
    const [overview, setOverview] = useState({});
    useEffect(() => {
        ledger.getOverviewInMonth(year, month).then(setOverview).catch(err => alert(err));
    }, [year, month])

    return (
        <div className={monthOverviewStyle}>
            <div><label>月收入<span className="val income">{overview.income}</span></label></div>
            <div><label>月支出<span className="val outgoing">{overview.outgoing}</span></label></div>
        </div>
    )
};

const PageSelector = ({onChange, size, total}) => {

    const [current, setCurrent] = useState(1);

    useEffect(() => {
        onChange({limit: size, offset: (current - 1) * size})
    }, [current, onChange, size, total])

    const fillPage = (size, total) => {
        // 计算总页数，向上取整，不能填满首页的补足首页
        let cnt = Math.ceil(total / size);
        if (cnt === 0) {
            cnt = 1;
        }

        // 确定滑窗位置
        let head = Math.min(Math.max(1, current - Math.floor(size / 2)), cnt - size + 1);
        let tail = Math.max(Math.min(cnt, current + Math.ceil(size / 2)), size);
        
        // 如果页码不足以填满一个窗口，只显示能填满的部分
        if (cnt < size) {
            head = 1;
            tail = cnt;
        }

        // 渲染页码
        // 开头的是向前翻页按钮
        const index = [];
        index.push(<div key={'prev'} onClick={() => setCurrent(current === 1 ? current : current - 1)}>{'<'}</div>)

        if (head > 1) {
            index.push(<div key={'prev-hidden'} onClick={() => setCurrent(Math.max(1, current - size))}>{'\u22ef'}</div>)
        }
        for (let i = head; i <= tail; i++) {
            index.push(<div className={i === current ? 'current' : ''} onClick={() => setCurrent(i)} key={i}>{i}</div>);
        }
        if (tail < cnt) {
            index.push(<div key={'next-hidden'} onClick={() => setCurrent(Math.min(cnt, current + size))}>{'\u22ef'}</div>)
        }

        // 向后翻页按钮
        index.push(<div key={'next'} onClick={() => setCurrent(current === cnt ? current : current + 1)}>{'>'}</div>)
        
        return index;
    };

    return (
        <div className={pageSelectorStyle}>
            {fillPage(size, total)}
        </div>
    )
}

const LedgerMonthList = (props) => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [page, setPage] = useState({offset: 0, limit: 5});
    const [total, setTotal] = useState(0);
    const [order, setOrder] = useState(2);
    const [type, setType] = useState(0);
    
    const handleError = err => {
        alert(err);
    };

    const typeName = {
        0: '收支',
        1: '收入',
        2: '支出'
    };

    useEffect(() => {
        const orderType = {
            1: 'date asc',
            2: 'date des',
            3: 'amount asc',
            4: 'amount des',
        };
        Promise.all([
            ledger.getItemsInMonth(props.year, props.month, {offset: page.offset, limit: page.limit, order: orderType[order], type: type}).then(data => {
                setTotal(data.total);
                setItems(data.items);
            }),
            ledger.getCategories().then(setCategories),
        ])
        .catch(handleError)
    }, [props.year, props.month, page, order, type]);

    return (
        <div className={monthLedgerViewStyle}>
            <header><MonthNameLabel month={props.month - 1} /></header>
            <main>
                <MonthOverview year={props.year} month={props.month} />
                <table>
                    <thead><tr><th onClick={() => setOrder(order === 1 ? 2 : 1)}>时间</th><th onClick={() => setType((type + 1) % 3)}>{typeName[type]}</th><th>类型</th><th onClick={() => setOrder(order === 3 ? 4 : 3)}>金额</th></tr></thead>
                    <tbody>
                        {items.map(v => {
                            return <LedgerItem key={v.id} value={v} categories={categories} />
                        })}
                    </tbody>
                </table>
                <PageSelector onChange={setPage} size={5} total={total}/>
            </main>
        </div>
    )
};

export default LedgerMonthList;