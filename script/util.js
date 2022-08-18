export {
    curtime
}

// 当前本时区时间,格式2022-8-17 19:38:15
function curtime() {
    return new Date().toLocaleString().replaceAll("/","-")
}
