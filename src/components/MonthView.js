import MonthList from './MonthList.js';
import Ledger from './LedgerMonthList.js';
import React, { useState } from 'react';

const MonthView = ({year, month}) => {
    const [date, setDate] = useState({year: year, month: month});
    return (
        <React.Fragment>
            <MonthList onChange={setDate}/>
            <Ledger year={date.year} month={date.month}/>
        </React.Fragment>
    )
};

export default MonthView;