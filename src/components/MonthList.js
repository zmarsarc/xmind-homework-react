import { useState, useEffect } from "react";
import api from '../api/ledger.js'
import { css } from '@emotion/css';
import style from '../styles/global.js';
import useBillUpdate from '../hooks/useBillUpdate.js';

const monthListStyle = css`
    display: inline-block;
    font-size: 24px;
    margin-right: 20px;

    ul {
        li {
            padding: 5px;
            box-shadow: 0px 0px 15px rgba(0, 0, 0, 0.2);
            user-select: none;
            cursor: pointer;
            list-style: none;

            :hover {
                background-color: #ecf0f1;
            }
            :active {
                background-color: #bdc3c7;
            }
        }
    }
`;

const MonthList = ({onChange}) => {
    const [month, setMonth] = useState([]);
    const [isUpdate,accept,] = useBillUpdate();

    useEffect(() => {
        api.getMonthList().then(setMonth).catch(console.error);
    }, [])

    useEffect(() => {
        if (isUpdate) {
            api.getMonthList().then(setMonth).catch(console.error).then(accept);
        }
    }, [isUpdate, accept]);

    return (
        <div className={monthListStyle}>
            <header className={style.boxHeader}>月份选择</header>
            <ul>
                {month.map(val => {
                    return <li key={val.date} onClick={() => {
                        const [year, month] = val.date.split('-');
                        onChange({year: Number(year), month: Number(month)});
                    }}>{`${val.date} 收入 ${val.income} 支出 ${val.outgoing}`}</li>
                })}
            </ul>
        </div>
    )
}

export default MonthList;