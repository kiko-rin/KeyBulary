# StarDict 类
v1.0.0-release

StarDict 是一个用于操作词典数据库的类. 它提供了创建、查询、更新和删除条目的功能. 
该类使用Node.js重写自开源项目[ECDICT](https://github.com/skywind3000/ECDICT)的`stardict.py`. 实现了相同的功能. [^1]
[^1]: 当前仅实现了源代码中的StarDict类，后续将实现更多功能. 

## 构造函数:

```javascript
var dict = new StarDict(filename, verbose = false)
```
- filename: 指定SQLite数据库文件名. 如果filename不是':memory:'，则会使用require('path').resolve(filename)将其转换为绝对路径. 
- verbose: 布尔值，用于控制是否开启详细输出，默认为false. 

## 方法:

### 1. 数据库管理
   - `open()`
     打开或创建数据库，并初始化表结构. 包含创建stardict表及其索引的SQL语句. 在执行这些SQL语句时，会序列化数据库连接以确保原子性. 
   
   - ` close()`
     关闭数据库连接. 检查当前是否有打开的连接，如果有，则关闭它. 

   - `commit()`
     提交当前事务. 通过运行`'COMMIT;' SQL`命令来提交事务，若发生错误，则回滚事务. 

### 2. 查询与匹配
   - ```javascript
	 dict.query(key)

	 ```
     根据ID或单词查询条目. 参数key可以是数字（表示ID）或者字符串（表示单词）. 该方法返回一个Promise对象，解析为从数据库获取的记录对象. 

   - ```javascript
	 dict.match(word, limit = 10, strip = false)
		```
     查找匹配的单词列表. 参数word是要搜索的关键字；limit指定返回结果的最大数量，默认为10；strip决定是否对搜索词进行清理处理，默认为false. 返回一个Promise对象，解析为符合条件的单词列表. 

   - ```
	 dict.count()
	 ```
     返回数据库中的条目总数. 通过执行SQL查询'SELECT COUNT(*) AS count FROM stardict;'来计算总条数. 

### 3. 条目管理
   - ```javascript
	 dict.register(word, items, commit = true)
  
     ```
     注册新条目. 参数word是单词；items是一个对象，包含要添加到数据库的信息；commit指明是否在注册后立即提交更改，默认为true. 

   - ```javascript
	 dict.remove(key, commit = true)
		```
     删除指定的条目. 参数key可以是数字（表示ID）或者字符串（表示单词）；commit指明是否在删除后立即提交更改，默认为true. 

   - ```javascript
	 dict.deleteAll(resetId = false)
		```
     删除所有条目. resetId指明是否重置自增ID序列，默认为false. 这将清空stardict表，并根据resetId参数决定是否重置序列号. 

   - ```javascript
	 dict.update(key, items, commit = true)
	 ```
     更新现有条目. 参数key可以是数字（表示ID）或者字符串（表示单词）；items是一个对象，包含要更新的信息；commit指明是否在更新后立即提交更改，默认为true. 

### 4. 其他方法
   - ```javascript
	 dict.out(text)
		```
     如果启用了详细模式（verbose为true），则打印输出文本. 

   - ```javascript
	 dict.stripword(word)
		```
     清理输入的单词，仅保留字母和数字并转换为小写. 

   - ```javascript
	 dict.dumps()
		```
     返回数据库中所有单词的列表. 通过执行SQL查询'SELECT "word" FROM "stardict";'来获取所有单词. 

   - ```javascript
	 dict.length()
		```
     返回数据库中的条目数，等同于count(). 

   - ```javascript
	 dict.contains(key)
		```
     检查是否存在指定的条目. 通过调用query方法并检查其返回值是否非null来实现. 

   - ```javascript
	 dict.getItem(key)
		```
     获取指定条目，等同于query(key). 

### 5. 异步迭代器
   - ```javascript
	 [Symbol.asyncIterator]()
		```
     实现异步迭代器接口，允许遍历所有条目. 按照单词顺序返回每个条目的id和word字段.
