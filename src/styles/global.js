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

const style = { popupBlock, buttonLike, boxHeader };

export default style;