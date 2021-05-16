import MonthList from './MonthList.js';
import Ledger from './ledgerlist/LedgerMonthList.js';
import React, { useState } from 'react';
import { css } from '@emotion/css';

const monthViewStyle = css`
    display: flex;
    margin: 20px;
`;

const MonthView = ({year, month}) => {
    const [date, setDate] = useState({year: year, month: month});
    return (
        <div className={monthViewStyle}>
            <MonthList onChange={setDate}/>
            <Ledger year={date.year} month={date.month}/>
        </div>
    )
};

export default MonthView;