import { useEffect, useState } from "react";
import MonthView from './components/MonthView.js';

const pathToRegexp = path => new RegExp("^" + path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)") + "$");

const getParams = match => {
    const values = match.result.slice(1);
    const keys = Array.from(match.router.path.matchAll(/:(\w+)/g)).map(result => result[1]);
    return Object.fromEntries(keys.map((key, i) => {
        return [key, values[i]];
    }));
};

const route = () => {
    const routes = [
        // {path: "/dashbroad", view: () => (<h1>this is dashbroad</h1>)},
        {path: "/month", view: () => {
            // 直接访问month跳转到当月的账单
            const now = new Date();
            const thisMonth = now.getMonth() + 1;
            const thisYear = now.getFullYear();
            window.history.replaceState(null, null, `/ledger/month/${thisYear}/${thisMonth}`);
            return <MonthView year={thisYear} month={thisMonth}/>;
        }},
        {path: "/ledger/month/:year/:month", view: ({year, month}) => <MonthView year={year} month={month}/>}
    ]

    const potentialMatch = routes.map(r => {
        return {
            router: r,
            result: window.location.pathname.match(pathToRegexp(r.path)),
        }
    })

    let matched = potentialMatch.find(r => r.result !== null);
    if (!matched) {
        matched = {
            router: routes[0],
            result: []
        }
    }

    return matched.router.view(getParams(matched));
}

let subscribers = [];

const notifyAll = url => {
    window.history.pushState(null, null, url);
    subscribers.map(cb => cb(url));
}

window.addEventListener('popstate', () => {
    subscribers.map(cb => cb(window.location.pathname));
})

export const useNavigate = () => {
    const [url, setUrl] = useState(window.location.pathname);
    useEffect(() => {
        subscribers.push(setUrl);
        return () => subscribers = subscribers.filter(item => item !== setUrl);
    }, []);
    return [route(url), notifyAll];
}