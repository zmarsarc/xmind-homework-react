const pad2 = n => {
    return String(n).padStart(2, '0');
};

const format = t => {
    return `${t.getFullYear()}-${pad2(t.getMonth()+1)}-${pad2(t.getDate())} ${pad2(t.getHours())}:${pad2(t.getMinutes())}`
};

const formatMonth = t => {
    return `${t.getFullYear()}-${pad2(t.getMonth()+1)}`
};

const formatHour = t => {
    return `${pad2(t.getHours())}`
};

const formatMinute = t => {
    return `${pad2(t.getMinutes())}`
};

const totalDaysInMonth = t => {
    const end = new Date(t.getTime());
    end.setMonth(t.getMonth() + 1);
    return (end - t) / (24 * 3600 * 1000);
};

const datetime = { format, formatMonth, totalDaysInMonth, formatHour, formatMinute };
export default datetime;