import { css } from '@emotion/css';
import React, { useContext, useEffect, useReducer } from 'react';
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

const activePicker = css`
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

const addNewType = css`
    display: flex;
    border-top: 1px solid #95a5a6;
    input {
        margin: 1px;
        flex: 70%;
    }
    button {
        flex: 30%;
    }
`;

const initState = {
    isOpen: false,
    currentType: 0,
    selectedCategory: null,
    categories: [],
    updateRequire: true,
    addNewCategoryRequired: false,
    newCategoryName: '',
}

const actionCodes = {
    toggle: 1, // 展开/关闭类型选择器
    setCurrentType: 2, // 设置当前正在查看的收支类型
    selectCategory: 3, // 设置当前选中的账目类型
    updateCategories: 4, // 更新账目类型列表
    setNewCategoryName: 6, // 保持待添加的新账目类型的名称
    addNewCategory: 7, // 命令添加新账目
    successAddNewCategory: 8, // 通知新账目添加成功
}

const actions = {
    toggles: val => ({type: actionCodes.toggle, value: val}),
    setCurrentType: val => ({type: actionCodes.setCurrentType, value: val}),
    selectCategory: val => ({type: actionCodes.selectCategory, value: val}),
    updateCategories: val => ({type: actionCodes.updateCategories, value: val}),
    setNewCategoryName: val => ({type: actionCodes.setNewCategoryName, value: val}),
    addNewCategory: () => ({type: actionCodes.addNewCategory}),
    successAddNewCategory: () => ({type: actionCodes.successAddNewCategory})
}

const reducer = (state, action) => {
    switch(action.type) {
        case actionCodes.toggle:
            // 关闭选择器后重置待添加的新账目名称
            const newState = {...state, isOpen: action.value};
            if (!newState.isOpen) {
                newState.newCategoryName = '';
            }
            return newState;
        case actionCodes.setCurrentType:
            return {...state, currentType: action.value};
        case actionCodes.selectCategory:
            // 选定账目类目后收起选择器
            return {...state, selectedCategory: action.value, isOpen: false};
        case actionCodes.updateCategories:
            // 更新账目列表后清除等待账目列表更新标志
            return {...state, categories: action.value, updateRequire: false};
        case actionCodes.setNewCategoryName:
            return {...state, newCategoryName: action.value};
        case actionCodes.addNewCategory:
            // 设置需要添加新账目类型
            return {...state, addNewCategoryRequired: true};
        case actionCodes.successAddNewCategory:
            // 添加新账目类型成功，清除等待添加标志并且更新列表
            return {...state, addNewCategoryRequired: false, updateRequire: true, newCategoryName: ''}
        default:
            return initState;
    }
}

const Context = React.createContext(null);

const TypeTab = ({type, currentType}) => {
    const dispatch = useContext(Context);
    return (
        <div onClick={() => dispatch(actions.setCurrentType(type.id))} className={currentType === type.id ? selectedType : ''}>
            {type.name}
        </div>
    )
}

const Category = ({category, onChange}) => {
    const dispatch = useContext(Context);
    return (
        <div onClick={() => {dispatch(actions.selectCategory(category)); onChange(category);}}>
            {category.name}
        </div>
    )
}

const CategoryPicker = props => {
    const [state, dispatch] = useReducer(reducer, initState);

    useEffect(() => {
        if (state.updateRequire) {
            ledger.getCategories().then(json => dispatch(actions.updateCategories(json))).catch(alert);
        }
        if (state.addNewCategoryRequired) {
            const category = {
                type: state.currentType,
                name: state.newCategoryName,
            }
            ledger.addCategory(category).then(() => dispatch(actions.successAddNewCategory())).catch(alert);
        }
    }, [state]);

    const types = [
        {id: 0, name: '支出'},
        {id: 1, name: '收入'}
    ]

    return (
        <div className={categoryPickerStyle}>
            <Context.Provider value={dispatch}>
                <div className={selectedCategory} onClick={() => dispatch(actions.toggles(!state.isOpen))}>
                    {state.selectedCategory === null ? '选择类型' : state.selectedCategory.name}
                </div>
                <div className={state.isOpen? activePicker : disactivePicker}>
                    <div className={style.invisibleFullScreenMask} onClick={() => dispatch(actions.toggles(false))}></div>
                    <div className='types'>
                        {types.map(val => <TypeTab key={val.id} type={val} currentType={state.currentType}/>)}
                    </div>
                    <div className='categories'>
                        {state.categories.filter(elem => elem.type === state.currentType).map(val => 
                            <Category key={val.id} category={val} onChange={props.onChange}/>
                        )}
                    </div>
                    <div className={addNewType}>
                        <input type='text' placeholder='添加新类型' onChange={e => dispatch(actions.setNewCategoryName(e.target.value))} value={state.newCategoryName}/>
                        <button className={style.buttonLike} onClick={() => dispatch(actions.addNewCategory())}>ok</button>
                    </div>
                </div>
            </Context.Provider>
        </div>
    )
};

export default CategoryPicker;