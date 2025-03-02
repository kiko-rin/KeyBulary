const path = require('path');
const StarDict = require('./scripts/StarDict'); // 确保路径正确
const KeyBularyver = 'v0.1.0-alpha2'
// 初始化数据库实例
console.log('Initializing StarDict...');
const stardict = new StarDict(path.join(__dirname, 'dict.db'), true);
console.log('StarDict initialized.');

// 全局变量
let globalQueryResult;

// 添加一个函数来处理输入框的输入事件
function setupInputListener() {
    const inputElement = document.getElementById('wordInput');
    if (inputElement) {
        inputElement.addEventListener('input', async function() {
            var vcb = String(inputElement.value);
            if (!vcb.trim()) { // 如果输入为空，则不进行查询
                clearDefinitions();
                return;
            }
            try {
                console.log('Querying word:', vcb);
                var result = await stardict.query(vcb); // 调用StarDict.js查词
                
                // 将结果赋值给全局变量
                globalQueryResult = result;
                
                // 输出全局变量的内容
                console.log('Query result:', globalQueryResult);
                processGlobalQueryResult(globalQueryResult);
            } catch (error) {
                console.error('Error querying the database:', error);
                clearDefinitions(); // 出错时清除定义
            }
        });
    } else {
        console.error('Word input element not found.');
    }
}
// 清除定义显示
function clearDefinitions() {
    document.getElementById('enDef').textContent = 'Hello!';
    document.getElementById('cnDef').textContent = '你好！';
    document.getElementById('query-word').textContent = 'KeyBulary '
    document.getElementById('phonetic').textContent = '/kɪˈbjuːləri/';
}

// 修改processGlobalQueryResult函数以正确设置文本内容
function processGlobalQueryResult(result) {
    if (!result || result === null) {
        console.log("Received null or undefined data.");
        document.getElementById('enDef').textContent = 'No definition found, moe~';
        document.getElementById('cnDef').textContent = '没有找到翻译呢moe~';
        document.getElementById('query-word').textContent = '没有找到单词呢moe'
        document.getElementById('phonetic').textContent = '(っ °Д °;)っ';
        document.getElementById('version').textContent = null;
        return;
    } else {
        // 处理查询结果的逻辑
        console.log('Final processing result:', result);
        document.getElementById('enDef').textContent = result.definition || 'No definition found, moe~';
        document.getElementById('cnDef').textContent = result.translation || '没有找到翻译呢喵~';
        document.getElementById('query-word').textContent = result.word || '没有找到单词呢亲';
        if (result.phonetic != "") {
            document.getElementById('phonetic').textContent = '/' + result.phonetic + '/';
        } else {
            document.getElementById('phonetic').textContent = '/木有音标/';
        }
        if (result.oxford == 1 ) {
            document.getElementById('oxford').textContent = '牛津';
        } else {
            document.getElementById('oxford').textContent = null;
        }
    }
}

// 在脚本加载时设置输入监听器
setupInputListener();
document.getElementById('version').textContent = KeyBularyver

// 注意：如果这是一个Electron应用或类似的环境，确保这段代码在DOM完全加载之后运行。
