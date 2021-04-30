import { useEffect, useState } from "react";

// 跟踪所有订阅
let subscribe = [];

// 发布url变更信息到每一个订阅上
const dispatchUrl = () => {
    subscribe.forEach(cb => cb(route()));
}

const setUrl = url => {
    window.history.pushState(null, null, url);
    dispatchUrl();
}

// 监听用户的前进、后退操作，然后派发事件
window.addEventListener('popstate', () => dispatchUrl());

const route = () => {
    const routes = [
        {path: "/dashbroad", view: (<h1>this is dashbroad</h1>)},
        {path: "/month", view: (<h1>this is month view</h1>)}
    ]

    let matched = routes.find(r => r.path === window.location.pathname);
    if (!matched) {
        matched = routes[0];
    }
    return matched.view;
}

export const useNavigate = () => {
    // 执行一次初始路由
    const [view, cb] = useState(route());

    useEffect(() => {
        // 记录新订阅
        subscribe.push(cb);
        // return () => subscribe = subscribe.filter(item => item !== cb);
    }, []);
    // React确保在组件生命周期中，useState的setter是稳定的，可以忽略掉

    // 这里返回的state是每个订阅自己的state，但是setter是公共的setter
    // 这样任意一个订阅更新了url，都会通知到其它所有订阅上
    return [view, setUrl];
}