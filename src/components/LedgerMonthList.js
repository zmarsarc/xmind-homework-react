import { useEffect, useState } from "react";

const LedgerMonthList = (props) => {
    const [items, setItems] = useState([]);
    useEffect(() => {
        fetch('/api/ledger/item/month/' + props.month)
        .then(resp => {
            if (resp.ok) {
                return resp.json();
            }
            throw new Error(resp.statusText);
        })
        .then(json => {
            if (json.code !== 0) {
                throw new Error(json.msg);
            }
            setItems(json.data);
        })
        .catch(err => console.error(err));
    }, [props.month]);

    return (
        <div>
            <ul>
                {items.map(v => {
                    return <li key={v.id}>{new Date(v.eventTime).toLocaleString()}</li>
                })}
            </ul>
        </div>
    )
}

export default LedgerMonthList;