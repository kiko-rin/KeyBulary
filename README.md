# KeyBulary
v0.1.0-alpha.2
一个轻量的Electron词典
更新于2025-3-1
## 简介
你好！

这是一个桌面端的英语->汉语词典，借助GitHub开源项目[ECDICT](https://github.com/skywind3000/ECDICT)词典和Electron架构开发，词典根据各类考试大纲和语料库词频收录数十万条各类单词的英文和中文释义[^1]. 
[^1]: 见[ECDICT: README](https://github.com/skywind3000/ECDICT)

因为市面上的词典软件很多都功能臃肿，会员价格昂贵，所以有了自己开发一个词典的想法，于是花了几天写了KeyBulary，目前还处在非常简陋的状态，仅限于可以使用，称不上好用，技术力有限，见谅. 

红豆泥私密马赛！

2025-2-6	kikorin

## 源码使用&二次开发
### 写在前面
如果你只需要打包好的程序，不需要进行二次开发，可在release页面找到安装包. 
本项目使用AGPL协议. 二次开发请遵守该协议并阅读本文档的[声明](#announcement)部分. 
二次开发前请确保Node.js环境存在. 
### 下载源码并配置开发环境
1. 从[本项目的GitHub页面](https://github.com/kiko-rin/KeyBulary)下载源代码，进入项目目录. 
2. 解压`dict.7z`放在项目根目录下. 
3. 打开`package.json`根据您的需求自定义项目设置. 
4. 在项目目录打开终端，运行`cnpm install`（项目用cnpm[^2]替代了npm）. 

至此，你已完成环境搭建. 
[^2]: 见[npm中文文档](https://www.npmrc.cn/en/cnpm.html)和[cnpm的GitHub](https://github.com/cnpm/cnpm)
### 项目结构&文件说明
跟随上述步骤完成操作后，你的项目结构应如下：
```txt
.
│  dict.db
│  icon.ico
│  index.html
│  main.js
│  package.json
│  
├─ECDICT
│      .gitignore
│      del_bfz.py
│      dictutils.py
│      lemma.en.txt
│      LICENSE
│      linguist.py
│      README.md
│      resemble.txt
│      stardict.py
│      wordroot.txt
│      
├─scripts
│      index.js
│      preload.js
│      StarDict.js
│      StarDict.md
│      
└─styles
        index.css
````
下面将介绍不同文件的用途. 
#### `dict.db`
词典数据库文件
##### 结构[^3]
| 字段        | 解释                                                       |
| ----------- | ---------------------------------------------------------- |
| id | 单词id |
| word        | 单词名称                                                   |
| sw | 模糊查询 |
| phonetic    | 音标，以英语英标为主                                       |
| definition  | 单词释义（英文），每行一个释义                             |
| translation | 单词释义（中文），每行一个释义                             |
| pos         | 词语位置，用 "/" 分割不同位置                              |
| collins     | 柯林斯星级                                                 |
| oxford      | 是否是牛津三千核心词汇                                     |
| tag         | 字符串标签：zk/中考，gk/高考，cet4/四级 等等标签，空格分割 |
| bnc         | 英国国家语料库词频顺序                                     |
| frq         | 当代语料库词频顺序                                         |
| exchange    | 时态复数等变换，使用 "/" 分割不同项目，见后面表格          |
| detail      | json 扩展信息，字典形式保存例句（待添加）                  |
| audio       | 读音音频 url （待添加）                                    | 
[^3]: 见[ECDICT: README](https://github.com/skywind3000/ECDICT)
##### Exchange字段说明
标签含义如下[^4]：
| 类型 | 说明                                                       |
| ---- | ---------------------------------------------------------- |
| p    | 过去式（did）                                              |
| d    | 过去分词（done）                                           |
| i    | 现在分词（doing）                                          |
| 3    | 第三人称单数（does）                                       |
| r    | 形容词比较级（-er）                                        |
| t    | 形容词最高级（-est）                                       |
| s    | 名词复数形式                                               |
| 0    | Lemma，如 perceived 的 Lemma 是 perceive                   |
| 1    | Lemma 的变换形式，比如 s 代表 apples 是其 lemma 的复数形式 |
[^4]: 见[ECDICT: README](https://github.com/skywind3000/ECDICT)
#### `main.js`
主进程和窗口管理器，默认打开一个`1200*800`的窗口并加载`index.html`. 
#### `index.html`
词典的主页面，挂载`./scripts/index.js`和`./styles/index.css`. 
#### `./ECDICT/`
ECDICT的源代码，删除了部分内容. 使用了`stardict.py`将`stardict.csv`（已删除）转化为`dict.bd`. 
详情见[ECDICT仓库](https://github.com/skywind3000/ECDICT)
#### `./scripts/`
除`main.js`外的所有脚本储存在此. 
##### `./scripts/index.js`
该脚本初始化一个StarDict实例，并设置一个输入监听器来处理用户在网页上的输入框中的输入事件. 它还定义了几个辅助函数来展示查询结果以及错误处理. 

1. 初始化StarDict数据库实例:
   - 首先，通过`require`导入必要的模块，包括`path`模块和自定义的`StarDict`模块. 
   - 使用绝对路径初始化StarDict实例，指向'dict.db'数据库文件，并开启详细输出模式（第二个参数为true）. 

2. 全局变量:
   - 定义了一个全局变量`globalQueryResult`用于存储查询结果. 

3. 输入监听器设置:
   - `setupInputListener`函数负责获取页面上的输入元素，并为其添加一个`input`事件监听器. 
   - 当用户在输入框中输入内容时，该函数首先检查输入是否为空. 若非空，则调用`stardict.query`方法查询数据库. 
   - 查询的结果会被赋值给全局变量`globalQueryResult`，并通过`processGlobalQueryResult`函数进行进一步处理. 
   - 若查询过程中发生错误，则调用`clearDefinitions`函数清除界面上的定义显示，并打印错误信息. 

4. 清除定义显示:
   - `clearDefinitions`函数负责清空页面上显示英文定义和中文翻译的两个元素的内容. 

5. 处理查询结果:
   - `processGlobalQueryResult`函数用于处理从数据库查询返回的结果. 
   - 如果结果为null或undefined，则会在控制台记录一条错误信息，并为定义和翻译设置默认值. 
   - 否则，根据查询结果更新页面上的定义和翻译显示. 如果没有找到对应的定义或翻译，则会显示相应的提示信息. 

6. 设置输入监听器:
   - 在脚本加载时，立即调用`setupInputListener`函数以确保当用户开始输入时可以立即响应. 

注意：确保在DOM完全加载之后运行，以便能够正确地获取到页面上的输入元素和其他相关元素. 

##### `./scripts/StarDict.js`
该文件是`./scripts/index.js`的依赖. 
详情说明见该目录下的`StarDict.md`. 

##### `./scripts/preload.js`
Electron的预加载脚本. 

#### `./styles/`
该文件夹用于存储html页面的css样式表. 
### 开发指南
整个项目围绕Electron和ECDICT开发，阅读以上文本后，就可以自由的在源代码上进行修改和添加.
#### 测试
在项目文件夹打开终端并运行：
```
cnpm start
```
#### API参考
##### StarDict 类
见`./scripts/StarDict.md`或[项目Wiki](https://github.com/kiko-rin/KeyBulary/wiki/API%E5%8F%82%E8%80%83#stardict-%E7%B1%BB). 
#### 打包
完成您的代码后，您可在`package.json`修改打包设置，然后在终端`cnpm run build`，即可获取打包后文件. 
## 使用的开源项目
1. [Electron](https://github.com/electron/electron)
2. [ECDICT](https://github.com/skywind3000/ECDICT)
3. [electron-builder](https://github.com/electron-userland/electron-builder)
4. [sqlite3](https://github.com/sqlite/sqlite)
5. [cnpm](https://github.com/cnpm/cnpm)

## To Do
- 完善单词所有条目
- 优化搜索体验
- 预计从0.2.0版本开始向Dart迁移
## 实验性计划
- 移植至Dart架构
## 发版说明
- Release：稳定版，提供源代码和可执行文件.
- Beta：测试版（公测），提供源代码和可执行文件，不保证运行稳定性. 
- Alpha：可运行的开发版，仅提供源代码，不保证运行稳定性.
- Dev：含开发工具的开发版，仅提供源代码. 

## <span id='announcement'>声明</span>
若您基于本项目进行二次开发，即代表您遵守以下内容：
1. 禁止（MUST NOT）在未经作者许可的前提下使用源代码或二次开发后的代码进行商业用途. 
2. 本项目及其源代码的衍生内容必须（MUST）遵照本项目开源协议进行处理（本项目开源协议以本项目GitHub仓库所用开源协议为准）.
3. 禁止（MUST NOT) 使用该项目及其衍生项目的源代码从事国家法律禁止的活动或有害于国家安全或利益，社会安全或利益及他人人身安全或利益的活动.
4. 若您使用本项目从事违法活动或有损于他人安全或利益的活动，则您必须（MUST）承认本项目及其衍生项目作者无需承担相应责任. 
5. 二次开发后的内容必须（MUST）声明使用了该项目的内容，并详细阐述改动. 
