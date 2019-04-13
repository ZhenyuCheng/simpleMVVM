## MVVM与MVC
#### MVVM
现在前端的流行框架基本上都是基于MVVM的了，从angular1，regular到现在的React和Vue，我们前端的开发体验越来越好，也逐渐告别了以前刀耕火种的时代，以前操作DOM的思维也逐渐换成了数据驱动的思想。

MVVM模式是通过以下三个核心组件组成，每个都有它自己独特的角色：

> - Model - 包含了业务证逻辑的数据模型（我们业务的js部分）
> - View - 将视图模型通过特定的GUI(图形用户界面)展示出来，并在GUI控件上绑定视图交互事件（主要体现为DOM树）。
> - ViewModel - 扮演“View”和“Model”之间的使者，将Model层的抽象模型转换为视图模型用于展示，同时将视图交互事件绑定到Controller层的数据更新接口上。

```
graph LR
A(View)--数据绑定-->B(ViewModel)
B--更新数据-->C(Model)
C--发送变更通知-->B
B--更新视图-->A
```
那与传统的MVC模式有什么不同呢？
#### MVC
MVC是Model-View- Controller的简写。M和V指的意思和MVVM中的M和V意思一样，分别代表视图和模型。C即Controller指的是页⾯业务逻辑。使⽤用MVC的目的就是将M和V的代码分离。
MVC是单向通信。也就是View跟Model，必须通过Controller来承上启下。

```
graph LR
A(View)-->B(Controller)
B-->C(Model)
C-->A
```


MVVM模式和MVC有些类似，但有以下不同：

- ViewModel 替换了 Controller，在UI层之下
- ViewModel 为 view 暴露数据和方法，VM 推送数据到在它之下的 model。
- ViewModel 接收来自 Model 的数据

MVC和MVVM的区别并不是VM完全取代了了C，VM存在目的在于抽离Controller中展示的业务逻辑,
而不是替代Controller，其它视图操作业务等还是应该放在Controller中实现（通常在MVVM我们将这些划分到Model里面去了），也就是说MVVM实现的是业务逻辑组件的重⽤。



#### 一个MVVM框架的工作
那么一个MVVM框架到底做了什么呢？
- 视图引擎：为 View 层作为视图模板提供强力支持，告别手动操作DOM
- 数据存取器：数据绑定的基础，为数据的变更提供监听
- 组件机制：MVVM 框架提供组件的定义、继承、生命周期、组件间通信机制
- etc...

基于此我们前端工程的维护性和扩展性越来越好，开发效率也得到极大的提高
## Object.defineProperty
MVVM 双向数据绑定 在Angular1.x版本(包括现在的regular)的时候通过的是脏值检测来处理，脏值检测由于性能问题逐渐被抛弃，而现在无论是React还是Vue以及最新的Angular，实现方式都越来越相近，一句话概括当前主流前端框架的MVVM实现方式
> 基于ES5中`Object.defineProperty`实现的数据劫持+发布订阅模式

由于Object.defineProperty属于ES5的特性所以一Vue等框架不支持IE8
#### Object.defineProperty:[MDN](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty)
> Object.defineProperty() 方法会直接在一个对象上定义一个新属性，或者修改一个对象的现有属性， 并返回这个对象。

##### 语法

```javaScript
Object.defineProperty(obj, prop, descriptor)
```
obj|prop|descriptor
---|---|---
要在其上定义属性的对象 | 要定义或修改的属性的名称 | 将被定义或修改的属性描述符。
##### example

```javaScript
let obj;
let tmp = '2222';
Object.defineProperty(obj, 'a',{ 
    configurable: true,     // 1. 是否可配置
    // writable: true,         //2. 是否可写
    // value: 37,          //3. 该属性的值
    enumerable: true,        // 4. 是否可被枚举
    // get,set设置时不能设置writable和value，二者互斥的
    get() {     // 5. 获取obj.music的时候就会调用get方法
        return tmp;
    },
    set(val) {      // 6. 将修改的值重新赋给song
        tmp = val;   
    }
});
```
## 简易版MVVM
我们先看最简单的一个Vue的例子
```html
<body>
    <div id="app">
        <h1>{{message}}</h1>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
    <script>
    var app = new Vue({
      el: '#app',
      data: {
        message: 'Hello Vue!'
      }
    })
    </script>
</body>
```
当我们在vue扩展或者控制台中更改message的值，会看到视图的值也发生了响应的变化（console中对应的字段为app._data.message）

Vue是怎么实现这个双向数据绑定过程的呢？我们先通过一个极小的MVVM的demo来了解他。前文曾经概括过目前主流MVVM框架的实现方式
> 基于ES5中`Object.defineProperty`实现的数据劫持+发布订阅模式

### 发布订阅：Dep
我们定义一个函数Dep用于实现发布定于，这里的发布订阅指的是
- 发布： 通知所有的监听器更新
- 订阅： 将依赖对应的监听器收集存储起来
```javaScript
function Dep(){
	this.subs = [];
    // 收集监听器
	this.addSub = function (watcher) {
        if(this.subs.includes(watcher)) return;
		this.subs.push(watcher);
	}
    // 通知更新
	this.notify = function(){
		this.subs.forEach(function(watcher){
			watcher.update();// 假设update
        });
	}
}
```
为此我们定义监听函数：

```javaScript
function Watcher(fn){
	this.update = function(){
		Dep.target = this; // 方便在数据劫持的时候进行调用
		fn();
		Dep.target = null;
	}
	this.update();
}

let watcher = new Watcher(() => console.log('test'));  // 
let dep = new Dep();
dep.addSub(watcher);  
dep.addSub(watcher);
dep.notify();   //  test, test
```
Watcher函数极其简单，`fn`指的是该监听器的回调函数，这个函数的主要作用就是提供一个内部的update函数，使`Dep.target`指向改监听器本身，并调用回调函数，

==注意：==  `Watcher`初始化时会调用一次`this.update()`
### 数据劫持：Observer
那数据劫持呢？为什么要做数据劫持？
- 观察对象：给对象增加Object.defineProperty
- 劫持数据的存储于读取：收集依赖和进行更新通知
- 深度响应：因为每次赋值一个新对象时会给这个新对象增加defineProperty(数据劫持)

看代码：
```javaScript
// 这个demo只关注对象这一种情况
function Observer(obj, key, value){
	var dep = new Dep();
	if (Object.prototype.toString.call(value) == '[object Object]') {
		Object.keys(value).forEach(function(key){
			new Observer(value,key,value[key]) // 如果是对象，用于深度响应
		})
	};
    // 数据劫持就是通过defineProperty给对象增加get,set方法
	Object.defineProperty(obj, key, {
		enumerable: true,
    	configurable: true,
    	get: function(){
    		if (Dep.target) { // 每次调用get时候会将当前的watch添加到dep列表当中
    			dep.addSub(Dep.target);
    		};
    		return value;
    	},
    	set: function(newVal){
    		value = newVal;
    		dep.notify(); // 每当设置对象该属性的值是，会通知所有依赖它的监听器，并进行更新
    	}
	})
}
```
我们将前文的三个函数放在simpleDemo.js中，并在html中这么写，即实现了一个简单的MVVM，

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>
    <div id="app"></div>
    <script src="./simpleDemo.js"></script>
    <script>
        var obj = {
            message: 'Hello simple MVVM demo ',
        } // 定义了一个对象
        Object.keys(obj).forEach(function (key) {
            new Observer(obj, key, obj[key])
        }); // 为对象所有的属性进行数据劫持
        new Watcher(function () {
            // 初始化一个watch，初始的时候会调用一次update
            document.querySelector("#app").innerHTML = obj.message;
            // 回调函数内容，将数据更新到html视图上，此时读取obj.message，又会触发message上的get，将当前watcher添加到改属性的依赖列表当中，
        })
    </script>
</body>
</html>
```
我们在console中更改`obj.message`，那么会触发`message`上的`set`，来调用`watcher`，并再次收集依赖

## 拓展版
前文我们实现了一个极简单的MVVM的Demo, 但是我们看一下前文Vue例子，我们的Demo依然相差很远，接下来我们就对Demo进行一些扩展
```html
<body>
    <div id="app">
        <h1>{{message}}</h1>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
    <script>
    var app = new Vue({
      el: '#app',
      data: {
        message: 'Hello Vue!'
      }
    })
    </script>
</body>
```
##### 改造 Observer函数
主要是将遍历Data的操作放到Observe中去, 这样就不需要在业务逻辑里面去遍历Data了

```javaScript
/**
 * 数据劫持
 * @param {Object} data 
 */
function Observe(data) {
    for (let key in data) {
        let val = data[key];
        if(isObject(val)) {
            new Observe(val)
        }
        let dep = new Dep();
        Object.defineProperty(data, key, {
            configurable: true,
            get() {
                if (Dep.target) { 
        			dep.addSub(Dep.target);
                };
                return val;
            },
            set(newVal) {
                if (val === newVal) return; //值未变时跳过
                val = newVal;
                if(isObject(val)) { // 新值可能是新的对象，需要
                    new Observe(val)
                }
                dep.notify();
            }
        });
    }
}

function isObject(data) {
    if (!data || typeof data !== 'object') return;
    return true;
}

```
#### 进行数据代理：
数据代理的目的是类似于Vue中通过this.xxx的方式直接访问option.data上的对应属性
```javaScript
function proxyData(target, nameKey) {
    for (let key in target[nameKey]) {
        Object.defineProperty(target, key, {
            configurable: true,
            get() {
                return target[nameKey][key];
            },
            set(newVal) {
                target[nameKey][key] = newVal;
            }
        });
    }
}
let target = {
    data: {
        a: '22'
    }
}
proxyData(target, 'data');
console.log(target.a);
target.a = '333';
console.log(target.a);
// 22
// 333
```
### 模板编译

```js
/**
 * 模板编译
 * @param {String} el 
 * @param {Object} vm 
 */
function Compile(el, vm) {
    vm.$el = document.querySelector(el); // 挂载节点到vm实例上
    let fragment = document.createDocumentFragment(); // 创建一个文档片段
    while (vm.$el.firstChild) {
        fragment.appendChild(vm.$el.firstChild); //将节点的所有子节点放到文档片段中, Vue2中用的虚拟DOM和AST，此处不考虑这些
    }
    replace(fragment, vm); // 替换内容
    vm.$el.appendChild(fragment); // 再将文档碎片放入el中
}
//替换文档片段中{{exp}}为表达式对应的值
function replace(frag, vm) {
    Array.from(frag.childNodes).forEach(node => {
        let txt = node.textContent; // 缓存模板内容
        let reg = /\{\{(.*?)\}\}/g; // 正则匹配{{}}

        if (node.nodeType === 3) { // 文本节点
            let tmp = reg.exec(txt);
            let valArray = []; // 存储这个节点所依赖的属性列表
            while (tmp) {
                valArray.push({
                    source: tmp[0],
                    key:  tmp[1]
                })
                tmp = reg.exec(txt)
            }
            new Watcher(vm, txt, valArray, (newVal) => {
                node.textContent = newVal.trim();
            });
        }
        if (node.childNodes && node.childNodes.length) {
            replace(node, vm);
        }
    });
}
```
### 监听器

```
/**
 * 监听器函数
 * @param {*} vm vm实例
 * @param {*} sourceTemplate 原模板字符串{{exp}}
 * @param {*} targetKey {{exp}}中的exp
 * @param {*} fn 回调函数
 */
function Watcher(vm, template, valArray, fn) {
    this.update = function () {
        Dep.target = this; // 方便在数据劫持的时候进行调用
        let newVal = template
        valArray.forEach((ele) => {
            newVal = newVal.replace(ele.source, getValue(vm, ele.key))
        });
        fn(newVal);
        Dep.target = null;
    }
    this.update();
}

// 从target获取对应值
function getValue(target, str) {
    let arr = str.split('.');
    let val = arr.reduce((val, key) => {
        return val[key];
    }, target); // 获取target上对应的值，并触发对应的get
    return val;
}
```
### 实例
我们组装一下上面的函数，写一个构造函数
```js
function expandDemo(options = {}) {
    this.$options = options;
    let data = this._data = this.$options.data;
    // 数据劫持
    if(isObject(data)) {
        new Observe(data)
    }
    // 数据代理
    proxyData(this, '_data');
    // 编译    
   new Compile(options.el, this);    
}
```

在html中我们这么写：

```html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>

<body>
    <div id="app">
        <h1>{{h1}}</h1>
        <h2>{{h2}}</h2>
        <h3>
            {{h3}}{{h4}}
            <span style="color:red;">{{h5}}{{h6}}</span>
        </h3>
    </div>
    <script src="./expandDemo.js"></script>
    <script>
        let app = new expandDemo({
            el: '#app',
            data: {
                h1: 'h1',
                h2: 'h2',
                h3: 'h3',
                h4: 'h4',
                h5: 'h5',
                h6: 'h6',
            }
        });
    </script>
</body>
</html>
```
此时的写法已经基本与Vue相似了，在console中更改h1-h6的值，可以看到对应的Dom也发生了变化
### 双向绑定
在vue中双向绑定的常见写法为,

```html
 <input v-model="demo" type="text">
```
基于这个结构, 我们扩展一下replace函数，实现双向绑定

```js
if (node.nodeType === 1) { // 元素节点
    let nodeAttr = node.attributes; // 获取dom上的所有属性,是个类数组
    Array.from(nodeAttr).forEach(attr => {
        let name = attr.name; // v-model  type
        let exp = attr.value;
        if (name.includes('v-')) {
            node.value = getValue(vm, exp);
            // 监听变化
            new Watcher(vm, '', [{
                source: '',
                key: exp,
            }], function (newVal) {
                node.value = newVal; //变量改动，更新视图
            });
            node.addEventListener('input', e => {
                let newVal = e.target.value;
                // 给this[exp]赋值，会调用set,继而调用notify更新驶入
                eval(`vm.${exp}= newVal`);
            });
        }
    });
}
```
### 计算属性

```
function initComputed() {
    let vm = this;
    let computed = this.$options.computed; 
    Object.keys(computed).forEach(key => {
        Object.defineProperty(vm, key, {
            get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
        });
    });
}

function expandDemo(options = {}) {
...
    initComputed.call(this);
    // 编译    
    new Compile(options.el, this);
}
```

```html
...
        <h1>{{computedKey1}}</h1>
        <h2>{{computedKey2}}</h2>
...
            computed: {
                computedKey1: {
                    get() {
                        return this.h1 + this.h2;
                    }
                },
                computedKey2() {
                    return this.h1 + this.h2;
                }
            }
        });
...
```
1.  在computed的Watcher中，会读取this.computedKey1等来触发该watcher以及对应视图` <h1>{{computedKey1}}</h1>`的更新，
2. 而读取this.computedKey1又会触发 this.h1 + this.h2的get，并将this.computedKey1的watcher添加h1,h2的dep数组当中
3. 所有当h1或者h2更新的时候，会触发this.computedKey1的watcher来更新视图

## Vue版本
Vue中的Mvvm实现与上述的思路基本类似，只不过多了更多细节，以及框架层面的一些东西：比如对数组上面push、pop等方法的代理、Dep的清除等等，有兴趣可以看Vue的源码
相关源码在目录`vue/src/core/observer`下
[链接](https://github.com/vuejs/vue/tree/dev/src/core/observer)
## Vue3.0, proxy
去年VueConf TO 2018 大会上，尤雨溪发表了名为 “ Vue 3.0 Updates ” 的主题演讲，对Vue3.0版本要做的事情做了一个大致的介绍，在[ 尤雨溪：Vue 3.0 计划](https://juejin.im/post/5bb719b9f265da0ab915dbdd)一文当中提到：
> 3.0 将带来一个基于 Proxy 的 observer 实现，它可以提供覆盖语言 (JavaScript——译注) 全范围的响应式能力，消除了当前 Vue 2 系列中基于 Object.defineProperty 所存在的一些局限，如：
> 
> - 对属性的添加、删除动作的监测
> - 对数组基于下标的修改、对于 .length 修改的监测
> - 对 Map、Set、WeakMap 和 WeakSet 的支持

### Proxy：[MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)
proxy是什么的，没用过的可以看一看，阮一峰的[教程](http://es6.ruanyifeng.com/#docs/proxy#construct)

简单介绍一下：
> Proxy 可以理解成，在目标对象之前架设一层“拦截”，外界对该对象的访问，都必须先通过这层拦截，因此提供了一种机制，可以对外界的访问进行过滤和改写。Proxy 这个词的原意是代理，用在这里表示由它来“代理”某些操作，可以译为“代理器”。

###### 使用：

```js
var p = new Proxy(target, handler);
```
###### example1
```js
var obj = new Proxy({}, {
  get: function (target, key, receiver) {
    console.log(`getting ${key}!`);
    return Reflect.get(target, key, receiver);
  },
  set: function (target, key, value, receiver) {
    console.log(`setting ${key}!`);
    return Reflect.set(target, key, value, receiver);
  }
});
obj.count = 1
//  setting count!
++obj.count
//  getting count!
//  setting count!
//  2
```
###### example2

```js
var handler = {
  get: function(target, name) {
    if (name === 'prototype') {
      return Object.prototype;
    }
    return 'Hello, ' + name;
  },

  apply: function(target, thisBinding, args) {
    return args[0];
  },

  construct: function(target, args) {
    return {value: args[1]};
  }
};

var fproxy = new Proxy(function(x, y) {
  return x + y;
}, handler);

fproxy(1, 2) // 1
new fproxy(1, 2) // {value: 2}
fproxy.prototype === Object.prototype // true
fproxy.foo === "Hello, foo" // true
```
#### 基于Proxy改造我们的MVVM的例子
##### 思路：
=> 代理this上的访问到data.proxy
=> 使用data.proxy代理data上的值，Object类型递归

##### 改造Observe

```js
/**
 * 数据劫持
 * @param {Object} data 
 */
function Observe(data) {
    let tmpDep = {};
    Object.entries(data).forEach(([key, value]) => {
        if (isObject(value) && key!='proxy') {
            new Observe(data[key]);
        }
    });
    data.proxy = new Proxy(data, {
        get: function (target, key, receiver) {
            if(!tmpDep[key]) {
                tmpDep[key] =  new Dep();
            }
            if(key=='proxy'){
                return Reflect.get(target, key, receiver);
            }
            if (Dep.target) {
                tmpDep[key].addSub(Dep.target);
            };
            if(isObject(target[key])) {
                return Reflect.get(target, key, receiver).proxy;
            } else {
                return Reflect.get(target, key, receiver);
            }
        },
        set: function (target, key, value, receiver) {
            if (data[key] === value) return; //值未变时跳过
            if (isObject(value) && key!='proxy') { // 新值可能是新的对象，需要
                new Observe(value)
            }
            Reflect.set(target, key, value, receiver)
            tmpDep[key].notify();
            return true;
        }
    });
}

```
##### 数据代理

```js
/**
 * 数据代理
 * @param {Object} target 
 * @param {String} nameKey 
 */
function proxyData(target, nameKey) {
    for (let key in target[nameKey]) {
        Object.defineProperty(target, key, {
            configurable: true,
            get() {
                return target[nameKey].proxy[key]; //FLAG
            },
            set(newVal) {
                target[nameKey].proxy[key] = newVal; //FLAG
            }
        });
    }
}
```
##### HTML

```html
...
<body>
    <div id="app">
        <h1>{{h1}}</h1>
        <h2>{{h2}}</h2>
        <h3>
            {{h3}}{{h4}}
            <span style="color:red;">{{h5}}{{h6}}</span>
        </h3>
        <h1>{{computedKey1}}</h1>
        <h2>{{computedKey2}}</h2>
        <h1>{{obj.a}}</h1>
        <h1>{{obj.b}}</h1>
        <input v-model="obj.b" type="text">
    </div>
    <script src="./proxyDemo.js"></script>
    <script>
        let app = new proxyDemo({
            el: '#app',
            data: {
                ...
                obj: {}
            },
            ...
        });
    </script>
</body>
</html>
```
我们初始设置obj为一个空对象{}，当我们在控制台设置

```js
app.obj.a = '222';
```
可以看到对应视图发生了变化, 在input框中输入`2222`可以展示obj.b的地方的值页发生了响应的变化

### 参考文档
- [vue2.0-source/双向数据绑定.md](https://github.com/liutao/vue2.0-source/blob/master/%E5%8F%8C%E5%90%91%E6%95%B0%E6%8D%AE%E7%BB%91%E5%AE%9A.md)
- [不好意思！耽误你的十分钟，让MVVM原理还给你](https://juejin.im/post/5abdd6f6f265da23793c4458#heading-6)
- [Vue、MVVM、MVC、双向绑定](https://juejin.im/post/5b4198a65188251ac446c7ff)
- [ECMAScript 6 入门--阮一峰](http://es6.ruanyifeng.com/#docs/proxy#construct)
- [[译] 尤雨溪：Vue 3.0 计划](https://juejin.im/post/5bb719b9f265da0ab915dbdd)





