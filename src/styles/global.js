import { css } from '@emotion/css';

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

const boxHeader = css`
    font-size: 36px;
    background-color: #3498db;
    padding: 10px;
`;

// 用来处理组件外点击关闭组件
const invisibleFullScreenMask = css`
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: -1;
`;

const style = { popupBlock, buttonLike, boxHeader, invisibleFullScreenMask };

export default style;