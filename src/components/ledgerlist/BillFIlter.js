import { useContext, useEffect, useState } from "react";
import { css } from '@emotion/css';
import { actions, LedgerListContext } from './context.js';

// 类型选择器关闭时的样式
const categoryFilterBoxDisactiveStyle = css`
    display: none;
`;

// 类型选择器打开时的样式
const categoryFilterBoxActiveStyle = css`
    display: block;
    position: absolute;
    background-color: #FFF;
`;

// 账单过滤器的样式
const billFilterStyle = css`
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
`;

// 定义账单类型
const types = {
    InAndOut: {code: 0, name: '收支'},
    Income: {code: 1, name: '收入'},
    Outgoing: {code: 2, name: '支出'}
};

// 定义账单排序模式，只能是一下几种中的一种
const orders = {
    DateAsc: 'date asc',     // 按时间升序
    DateDes: 'date des',     // 按时间降序
    AmountAsc: 'amount asc', // 按金额升序
    AmountDes: 'amount des', // 按金额降序
};

// 在时间排序中切换
const switchDateOrder = state => {
    return state === orders.DateAsc ? orders.DateDes : orders.DateAsc;
}

// 在金额排序中切换
const switchAmountOrder = state => {
    return state === orders.AmountAsc ? orders.AmountDes : orders.AmountAsc;
}

// 收支类型中循环
const nextType = state => {
    if (state === types.InAndOut) {
        return types.Income;
    }
    if (state === types.Income) {
        return types.Outgoing;
    }
    return types.InAndOut;
}

// 内部组件，类型选择器
const CategoryFilterBox = ({open, categories, onChange}) => {
    return <>
        <div className={open ? categoryFilterBoxActiveStyle : categoryFilterBoxDisactiveStyle}>
            {categories.map(val => {
                return <div key={val.id} onClick={() => onChange(val)}>{val.name}</div>
            })}
        </div>
    </>
};

// 导出组件，账单过滤器
const BillFilter = ({categories}) => {
    const [order, setOrder] = useState(orders.DateDes);
    const [type, setType] = useState(types.InAndOut);
    const [category, setCategory] = useState(null);
    const [categoryBoxOpen, setCategoryBoxOpen] = useState(false);
    const {dispatch} = useContext(LedgerListContext);

    useEffect(() => {
        dispatch(actions.setFilter({
            order: order,
            type: type.code,
            category: category ? category.id : ''
        }))
    }, [order, type, category, dispatch])
    
    return <>
        <tr className={billFilterStyle}>
            <th onClick={() => setOrder(switchDateOrder(order))}>时间</th>
            <th onClick={() => setType(nextType(type))}>{type.name}</th>
            <th onClick={() => setCategoryBoxOpen(!categoryBoxOpen)}>
                类型
                <CategoryFilterBox open={categoryBoxOpen} categories={categories} onChange={setCategory}/>
            </th>
            <th onClick={() => setOrder(switchAmountOrder(order))}>金额</th>
        </tr>
    </>
}

export default BillFilter;