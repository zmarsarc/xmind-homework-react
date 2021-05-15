import { css } from '@emotion/css';
import { useEffect, useState } from 'react';
import datetime from '../utils/datetime.js';
import CategoryPicker from './CategoryPicker.js';

const popupBlock = css`
    background-color: #ecf0f1;
    position: absolute;
    display: block;
    width: 100%;
    border-top: 1px solid #95a5a6;
    z-index: 100;
`;

const buttonLike = css`
    user-select: none;
    cursor: pointer;  
    :hover {
        background-color: #bdc3c7;
    }
    :active {
        background-color: #ecf0f1;
    }
`;

const datetimePickerStyle = css`
    position: relative;

    .selected-datetime, .next, .prev, .day, .up, .down {
        ${buttonLike}
    }
    .selected-datetime {
        font-size: 24px;
        font-weight: 500;
        padding: 10px 25px;
        display: flex;
        justify-content: center;
        align-items: center;
    }
    .picker {
        display: none;
    }
    .picker.active {
        ${popupBlock}
        font-size: 20px;
        font-weight: 400;
        .month {
            display: flex;
            justify-content: space-between;
            align-items: center;
            .mth {
                user-select: none;
            }
            .prev, .next {
                padding: 5px 15px;
            }
        }
        .days {
            font-size: 20px;
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            .day {
                display: flex;
                justify-content: center;
                align-items: center;
            }
        }
        .time {
            font-size: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            .hour, .minute {
                display: flex;
            }
            .hr, .min, .sep {
                user-select: none;
            }
            .up, .down {
                padding: 0px 5px;
            }
        }
    }
`;

const addItemStyle = css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.5);

    .content {
        max-width: 300px;
        padding: 10px;
        border-radius: 2px;
        z-index: 1;
        background-color: #ecf0f1;
        & > * {
            box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.2);
            margin: 5px 0px;
        }
        button {
            border: none;
            outline: none;
            font-size: 24px;
            width: 100%;
            padding: 5px 10px;
        }
        input {
            border: none;
            outline: none;
            font-size: 24px;
            width: 100%;
            text-align: center;
            ::-webkit-inner-spin-button {
                appearance: none;
                margin: 0;
            }
        }
        .cancel {
            background-color: #e74c3c;
            :hover {
                background-color: #c0392b;
            }
            :active {
                background-color: #e74c3c;
            } 
        }
        .confirm {
            background-color: #2ecc71;
            :hover {
                background-color: #27ae60;
            }
            :active {
                background-color: #2ecc71;
            } 
        }
    }
`;

const DatetimePicker = props => {

    const [current, setCurrent] = useState(Date.now());
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        props.onChange(current);
    }, [props, current])

    const time = new Date(current);

    const fillDays = cnt => {
        const days = [];
        for (let i = 0; i < cnt; i++) {
            days.push(<div key={i} className='day' onClick={() => setCurrent(time.setDate(i + 1))}>{i + 1}</div>)
        }
        return days;
    }

    return (
        <div className={datetimePickerStyle}>
            <div className="selected-datetime" onClick={() => setPickerOpen(!pickerOpen)}>{datetime.format(time)}</div>
            <div className={pickerOpen ? "picker active" : "picker"}>
                <div className="date">
                    <div className="month">
                        <div className="prev" onClick={() => setCurrent(time.setMonth(time.getMonth() - 1))}>{'<'}</div>
                        <div className="mth">{datetime.formatMonth(time)}</div>
                        <div className="next" onClick={() => setCurrent(time.setMonth(time.getMonth() + 1))}>{'>'}</div>
                    </div>
                    <div className="days">
                        {fillDays(datetime.totalDaysInMonth(time))}
                    </div>
                </div>
                <div className="time">
                    <div className="hour">
                        <div className="down" onClick={() => setCurrent(time.setHours(time.getHours() - 1))}>{'<'}</div>
                        <div className="hr">{datetime.formatHour(time)}</div>
                        <div className="up" onClick={() => setCurrent(time.setHours(time.getHours() + 1))}>{'>'}</div>
                    </div>
                    <div className="sep">:</div>
                    <div className="minute">
                        <div className="down" onClick={() => setCurrent(time.setMinutes(time.getMinutes() - 1))}>{'<'}</div>
                        <div className="min">{datetime.formatMinute(time)}</div>
                        <div className="up" onClick={() => setCurrent(time.setMinutes(time.getMinutes() + 1))}>{'>'}</div>
                    </div>
                </div>
            </div>
        </div>
    )
};

const AddItem = props => {
    const [datetime, setDatetime] = useState(0);
    const [category, setCategory] = useState(null);
    const [amount, setAmount] = useState(0);
    const [ok, setOk] = useState(false);

    useEffect(() => {
        if (!ok) {
            return;
        }

        const item = {
            time: datetime,
            input: category.type,
            type: category.id,
            amount: amount
        }
        fetch('/api/ledger/item', {
            method: 'POST',
            body: JSON.stringify(item),
            headers: {
                'Content-type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(resp => {
            if (!resp.ok) {
                throw new Error(resp.statusText);
            }
            return resp.json();
        })
        .then(json => {
            if (json.code !== 0) {
                throw new Error(json.msg);
            }
        })
        .catch(err => console.error(err));
        props.onClose();
    }, [datetime, category, amount, ok, props])

    return (
        <div className={addItemStyle}>
            <div className="content">
                <DatetimePicker onChange={setDatetime} />
                <CategoryPicker onChange={setCategory} />
                <input type="number" placeholder='金额' onChange={e => setAmount(Number(e.target.value))}/>
                <button className="cancel" onClick={props.onClose}>cancel</button>
                <button className="confirm" onClick={() => setOk(true)}>ok</button>
            </div>
        </div>
    )
}

export default AddItem;