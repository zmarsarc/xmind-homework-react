import { useEffect, useState } from "react";

let observer = [];

const notifier = () => {
    observer.map(setUpdate => setUpdate(true));
}

// 实现一个观察者模式，当用户账单更新时通知所有订阅者
const useBillUpdate = () => {
    const [update, setUpdate] = useState(false);
    useEffect(() => {
        observer.push(setUpdate);
    }, [])

    // update代表是否更新，第二个返回值accept用来清除状态，notifier通知其它订阅者
    return [update, () => setUpdate(false), notifier];
}

export default useBillUpdate;