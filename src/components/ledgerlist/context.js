import React from 'react';

export const LedgerListContext = React.createContext({});

export const actionCodes = {
    setUpdateRequired: 1,
    setItems: 2,
    setCategories: 3,
    setPage: 4,
    setFIlter: 5,
    setYearMonth: 6,
}

export const actions = {
    setUpdateRequired: val => ({type: actionCodes.setUpdateRequired, value: val}),
    setItems: val => ({type: actionCodes.setItems, value: val}),
    setCategories: val => ({type: actionCodes.setCategories, value: val}),
    setPage: val => ({type: actionCodes.setPage, value: val}),
    setFilter: val => ({type: actionCodes.setFilter, value: val}),
    setYearMonth: val => ({type: actionCodes.setYearMonth, value: val}),
}
