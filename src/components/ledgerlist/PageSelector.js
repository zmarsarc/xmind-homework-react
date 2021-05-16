import { css } from '@emotion/css';

// 分页器样式
const pageSelectorStyle = css`
    display: flex;
    justify-content: flex-end;
    align-items: center;

    div {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 2px 5px;
        min-width: 18px;
        border: 1px solid #ecf0f1;
        user-select: none;
        cursor: pointer;

        :hover {
            background-color: #ecf0f1;
        }
        :active {
            background-color: #bdc3c7;
        }

        &.current {
            background-color: #ecf0f1;
        }
    }
`;

// 分页器初始状态
const initState = {
    current: 1,
    size: 10,
    total: 0,
    offset: 0,
}

// 导出组件，分页器
const PageSelector = ({onChange, value}) => {
    const fillPage = (size, total, current) => {
        // 计算总页数，向上取整，不能填满首页的补足首页
        let cnt = Math.ceil(total / size);
        if (cnt === 0) {
            cnt = 1;
        }

        // 确定滑窗位置
        let head = Math.min(Math.max(1, current - Math.floor(size / 2)), cnt - size + 1);
        let tail = Math.max(Math.min(cnt, current + Math.ceil(size / 2)), size);
        
        // 如果页码不足以填满一个窗口，只显示能填满的部分
        if (cnt < size) {
            head = 1;
            tail = cnt;
        }

        // 渲染页码
        // 开头的是向前翻页按钮
        const index = [];
        index.push(<div key={'prev'} onClick={() => onChange({...value, current: current === 1 ? current : current - 1})}>{'<'}</div>)

        if (head > 1) {
            index.push(<div key={'prev-hidden'} onClick={() => onChange({...value, current: Math.max(1, current - size)})}>{'\u22ef'}</div>)
        }
        for (let i = head; i <= tail; i++) {
            index.push(<div className={i === current ? 'current' : ''} onClick={() => onChange({...value, current: i})} key={i}>{i}</div>);
        }
        if (tail < cnt) {
            index.push(<div key={'next-hidden'} onClick={() => onChange({...value, current: Math.min(cnt, current + size)})}>{'\u22ef'}</div>)
        }

        // 向后翻页按钮
        index.push(<div key={'next'} onClick={() => onChange({...value, current: current === cnt ? current : current + 1})}>{'>'}</div>)
        
        return index;
    };

    return <>
        <div className={pageSelectorStyle}>
            {fillPage(value.size, value.total, value.current)}
        </div>
    </>
}

const selector = {
    initState, PageSelector
}

export default selector;