import { css } from '@emotion/css';
import { useState } from 'react';
import AddItem from './AddItem.js';

const toolbarStyle = css`
    position: fixed;
    bottom: 100px;
    right: 0px;
    display: flex;
    align-items: center;

    background-color: #ecf0f1;
    border-top-left-radius: 15px;
    border-bottom-left-radius: 15px;

    button {
        border: none;
        outline: none;
        background-color: transparent;
        border-radius: 50%;
        padding: 10px;
    }

    .icon {
        color: #27ae60;
        font-size: 2.5rem;

        :hover {
            color: #16a085;
        }
        :active {
            color: #e67e22;
        }
    }

    .menu {
        display: none;
    }

    .menu.active {
        border-left: 2px solid #95a5a6;
        display: block;
    }
`;

export const Toolbar = props => {
    const [menuActive, setMenuActive] = useState(false);
    const [addItemOpen, setAddItemOpen] = useState(false);

    return (
        <>
            <div className={toolbarStyle}>
                <div>
                    <button onClick={() => setMenuActive(!menuActive)}><div className="icon"><i className="fas fa-notes-medical"></i></div></button>
                </div>
                <div className={menuActive ? "menu active" : "menu"}>
                    <button onClick={() => setAddItemOpen(true)}><div className="icon"><i className="fas fa-plus"></i></div></button>
                    <button><div className="icon"><i className="fas fa-file-import"></i></div></button>
                    <button><div className="icon"><i className="fas fa-file-export"></i></div></button>
                </div>
            </div>
            {addItemOpen ? <AddItem onClose={() => setAddItemOpen(false)}/> : ''}
        </>
    )
}

export default Toolbar;