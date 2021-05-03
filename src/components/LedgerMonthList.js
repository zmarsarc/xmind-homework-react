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

        section {
            display: flex;
            justify-content: flex-start;
            align-items: center;

            div {
                margin: 0px 10px 10px 10px;
            }

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
        }

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

const LedgerMonthList = (props) => {
    const [items, setItems] = useState([]);
    const [categories, setCategories] = useState([]);
    const [overview, setOverview] = useState([]);

    const handleError = err => {
        alert(err);
    }

    useEffect(() => {
        Promise.all([
            ledger.getItemsInMonth(props.month).then(setItems),
            ledger.getCategories().then(setCategories),
            ledger.getOverviewInMonth(props.month).then(setOverview),
        ])
        .catch(handleError)
    }, [props.month]);

    const monthName = ['一','二','三','四','五','六','七','八','九','十','十一','十二'];

    return (
        <div className={monthLedgerViewStyle}>
            <header>{monthName[props.month - 1]}月账目</header>
            <main>
                <section>
                    <div><label>月收入<span className="val income">{overview.income}</span></label></div>
                    <div><label>月支出<span className="val outgoing">{overview.outgoing}</span></label></div>
                </section>
                <table>
                    <thead><tr><th>时间</th><th>收支</th><th>类型</th><th>金额</th></tr></thead>
                    <tbody>
                        {items.map(v => {
                            return <LedgerItem key={v.id} value={v} categories={categories} />
                        })}
                    </tbody>
                </table>
            </main>
        </div>
    )
};

export default LedgerMonthList;