import { css } from '@emotion/css';
import { useEffect, useState } from 'react';
import datetime from '../utils/datetime.js';

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
        user-select: none;
        cursor: pointer;  
        :hover {
            background-color: #bdc3c7;
        }
        :active {
            background-color: #ecf0f1;
        }
    }
    .selected-datetime {
        font-size: 24px;
        font-weight: 500;
        padding: 10px 25px;      
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

const DatetimePicker = props => {

    const [current, setCurrent] = useState(Date.now());
    const [pickerOpen, setPickerOpen] = useState(false);

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

const categoryPickerStyle = css`
    display: inline-block;
    position: relative;
    width: 100%;
    font-size: 20px;
    font-weight: 500;
    
    .selected-category {
        user-select: none;
        cursor: pointer;  
        :hover {
            background-color: #bdc3c7;
        }
        :active {
            background-color: #ecf0f1;
        }
    }

    .selected-category {
        font-size: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 5px;
    }

    .picker {
        display: none;
    }
    .picker.active {
        ${popupBlock}

        .types {
            display: flex;
            div {
                padding: 10px;
                ${buttonLike};
            }
        }

        .categories {
            display: grid;
            grid-template-columns: repeat(2, 1fr);

            div {
                padding: 5px;
                ${buttonLike};
            }
        }
    }
`;

const CategoryPicker = props => {
    const [category, setCategory] = useState(null);
    const [type, setType] = useState(0);
    const [categories, setCategories] = useState([]);
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        fetch('/api/category/')
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
            setCategories(json.data);
        })
        .catch(err => console.error(err));
    }, [type])

    return (
        <div className={categoryPickerStyle}>
            <div className='selected-category' onClick={() => setPickerOpen(!pickerOpen)}>{category === null ? '选择类型' : category.name}</div>
            <div className={pickerOpen? 'picker active': 'picker'}>
                <div className='types'>
                    <div onClick={() => setType(0)}>支出</div>
                    <div onClick={() => setType(1)}>收入</div>
                </div>
                <div className='categories'>
                    {categories.filter(elem => elem.type === type).map(val => {
                        return (<div key={val.id} onClick={() => setCategory(val)}>{val.name}</div>)
                    })}
                </div>
            </div>
        </div>
    )
};

const addItemStyle = css`
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.5);

    .content {
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
        .cancel {
            background-color: #e74c3c;
            :hover {
                background-color: #c0392b;
            }
            :active {
                background-color: #e74c3c;
            } 
        }
    }
`;

const AddItem = props => {
    return (
        <div className={addItemStyle}>
            <div className="content">
                <DatetimePicker />
                <CategoryPicker />
                <button className="cancel" onClick={props.onClose}>Cancel</button>
            </div>
        </div>
    )
}

export default AddItem;