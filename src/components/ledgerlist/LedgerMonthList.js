import React, { useEffect, useReducer, useState } from "react";
import { css } from '@emotion/css';
import ledger from '../../api/ledger.js';
import style from '../../styles/global.js';
import billFilter from './BillFIlter.js';
import pageSelector from './PageSelector.js';
import useBillUpdate from '../../hooks/useBillUpdate.js';
import { actionCodes, actions } from './context.js';

// 账单列表的样式
const ledgerMonthListStyle = css`
    display: inline-block;
    box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.2);

    main {
        margin: 10px;

        table {
            border-collapse: collapse;
            border: 1px solid #ecf0f1;
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

// 月度概览的样式
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

// 空列表占位文案的样式
const emptyHitStyle = css`
    font-size: 20px;
    padding: 5px;
`;

// 月份名称标签组件
const MonthNameLabel = ({year, month}) => {
    const monthName = ['一','二','三','四','五','六','七','八','九','十','十一','十二'];
    return (<>
        <span>{year}年{monthName[month]}月账单</span>
    </>)
};

// 月度概览（统计）组件
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

// 账单项目组件
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

// 空列表占位文案组件
const EmptyHit = () => {
    return (
        <React.Fragment>
            <tr className={emptyHitStyle}><td>还没有账单</td></tr>
        </React.Fragment>
    )
}

// 账单列表初始状态
const initState = {
    items: [],
    categories: [],
    page: pageSelector.initState, // 托管了分页器的状态
    filter: billFilter.initFilter, // 托管了过滤器的状态
    year: 0,
    month: 0,
    updateRequired: true,
};

// 月度账单状态处理函数
const reducer = (state, action) => {
    switch (action.type) {
        case actionCodes.setUpdateRequired:
            return {...state, updateRequired: action.value};
        case actionCodes.setItems:
            // 账单更新时更新分页器的总项目数
            return {
                ...state,
                items: action.value.items,
                page: {...state.page, total: action.value.total}
            };
        case actionCodes.setCategories:
            return {...state, categories: action.value};
        case actionCodes.setPage:
            // 分页器更新时计算偏移量
            return {
                ...state,
                page: {...action.value, offset: (action.value.current - 1) * action.value.size},
                updateRequired: true
            };
        case actionCodes.setFilter:
            return {...state, filter: action.value, updateRequired: true};
        case actionCodes.setYearMonth:
            // 切换月份后过滤器和分页器都重置
            return {
                ...state,
                year: action.value.year,
                month: action.value.month,
                filter: billFilter.initFilter,
                page: pageSelector.initState,
                updateRequired: true,
            };
        default:
            return state;
    }
}

// 导出组件，月度账单列表
const LedgerMonthList = ({year, month}) => {
    const [state, dispatch] = useReducer(reducer, {...initState, year: year, month: month});
    const [isUpdate, accept,] = useBillUpdate();

    useEffect(() => {
        if (year !== state.year || month !== state.month) {
            dispatch(actions.setYearMonth({year: year, month: month}));
        }
    }, [state, year, month]);

    useEffect(() => {
        if (isUpdate) {
            dispatch(actions.setUpdateRequired(true));
            accept();
        }
    }, [isUpdate, accept]);
    
    useEffect(() => {
        if (!state.updateRequired) {
            return;
        }
        // 为了避免重复请求，首先清理标志
        dispatch(actions.setUpdateRequired(false));
        const filter = {
            offset: state.page.offset,
            limit: state.page.size,
            order: state.filter.order,
            type: state.filter.type.code,
            category: state.filter.category.id
        }
        Promise.all([
            ledger.getItemsInMonth(state.year, state.month, filter).then(data => dispatch(actions.setItems(data))),
            ledger.getCategories().then(data => dispatch(actions.setCategories(data))),
        ])
        .catch(err => {
            // 如果请求失败，需要重试，这里设置请求标志
            console.error(err);
            dispatch(actions.setUpdateRequired(true));
        })
    }, [state]);

    const listItems = () => state.items.map(v => <LedgerItem key={v.id} value={v} categories={state.categories} />);

    return (
        <div className={ledgerMonthListStyle}>
            <header className={style.boxHeader}><MonthNameLabel year={state.year} month={state.month - 1} /></header>
            <main>
                <MonthOverview year={state.year} month={state.month} />
                <table>
                    <thead>
                        <billFilter.BillFilter categories={state.categories} value={state.filter} onChange={f => dispatch(actions.setFilter(f))}/>
                    </thead>
                    <tbody>
                        {state.items.length === 0 ? <EmptyHit /> : listItems()}
                    </tbody>
                </table>
                <pageSelector.PageSelector value={state.page} onChange={p => dispatch(actions.setPage(p))}/>
            </main>
        </div>
    )
};

export default LedgerMonthList;