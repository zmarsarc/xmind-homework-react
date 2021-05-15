import { css } from '@emotion/css';
import { useEffect, useState } from 'react';
import style from '../styles/global.js';
import ledger from '../api/ledger.js';

const categoryPickerStyle = css`
    display: inline-block;
    position: relative;
    width: 100%;
    font-size: 20px;
    font-weight: 500;
`;

const selectedCategory = css`
    ${style.buttonLike}
    font-size: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 5px;
`;

const selectedType = css`
    background-color: red;
`;

const disactivePicker = css`
    display: none;
`;

const activePicker = css `
    ${style.popupBlock}
    .types {
        display: flex;
        div {
            padding: 10px;
            ${style.buttonLike}
        }
    }
    .categories {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        div {
            padding: 5px;
            ${style.buttonLike}
        }
    }
`;

const CategoryPicker = props => {
    const [category, setCategory] = useState(null);
    const [type, setType] = useState(0);
    const [categories, setCategories] = useState([]);
    const [pickerOpen, setPickerOpen] = useState(false);

    useEffect(() => {
        ledger.getCategories().then(setCategories).catch(alert);
    }, [type]);

    const types = [
        {id: 0, name: '支出'},
        {id: 1, name: '收入'}
    ]

    const onSelectCategory = val => {
        setCategory(val);     // 设置当前选中的类型（为了展示）
        setPickerOpen(false); // 关闭picker
        props.onChange(val);  // 通知父组件选中类型已经改变
    }

    return (
        <div className={categoryPickerStyle}>
            <div className={selectedCategory} onClick={() => setPickerOpen(!pickerOpen)}>{category === null ? '选择类型' : category.name}</div>
            <div className={pickerOpen? activePicker : disactivePicker}>
                <div className='types'>
                    {types.map(val => <div key={val.id} onClick={() => setType(val.id)} className={type === val.id ? selectedType : ''}>{val.name}</div>)}
                </div>
                <div className='categories'>
                    {categories.filter(elem => elem.type === type).map(val => {
                        return (<div key={val.id} onClick={() => onSelectCategory(val)}>{val.name}</div>)
                    })}
                </div>
            </div>
        </div>
    )
};

export default CategoryPicker;