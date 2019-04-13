function expandDemo(options = {}) {
    this.$options = options;
    let data = this._data = this.$options.data;
    // 数据劫持
    if (isObject(data)) {
        new Observe(data)
    }
    // 数据代理
    proxyData(this, '_data');
    initComputed.call(this);
    // 编译    
    new Compile(options.el, this);
}
/**
 * 数据劫持
 * @param {Object} data 
 */
function Observe(data) {
    for (let key in data) {
        let val = data[key];
        if (isObject(val)) {
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
                if (isObject(val)) { // 新值可能是新的对象，需要
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
                return target[nameKey][key];
            },
            set(newVal) {
                target[nameKey][key] = newVal;
            }
        });
    }
}
// let target = {
//     data: {
//         a: '22'
//     }
// }
// proxyData(target, 'data');
// console.log(target.a);
// target.a = '333';
// console.log(target.a);

/**
 * 模板编译
 * @param {String} el 
 * @param {Object} vm 
 */
function Compile(el, vm) {
    vm.$el = document.querySelector(el); // 挂载节点到vm实例上
    let fragment = document.createDocumentFragment(); // 创建一个文档片段
    while (vm.$el.firstChild) {
        fragment.appendChild(vm.$el.firstChild); //将节点的所有子节点放到文档片段中
    }
    replace(fragment, vm); // 替换内容
    vm.$el.appendChild(fragment); // 再将文档碎片放入el中
}
//替换文档片段中{{exp}}为表达式对应的值
function replace(frag, vm) {
    Array.from(frag.childNodes).forEach(node => {
        let template = node.textContent; // 缓存模板内容
        let reg = /\{\{(.*?)\}\}/g; // 正则匹配{{}}

        if (node.nodeType === 3) { // 文本节点
            let tmp = reg.exec(template);
            let valArray = []; // 存储这个节点所依赖的属性列表
            while (tmp) {
                valArray.push({
                    source: tmp[0],
                    key: tmp[1]
                })
                tmp = reg.exec(template)
            }
            new Watcher(vm, template, valArray, (newVal) => {
                node.textContent = newVal.trim();
            });
        }

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

        if (node.childNodes && node.childNodes.length) {
            replace(node, vm);
        }
    });
}
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


/**
 * 发布订阅
 */
function Dep() {
    this.subs = [];
    // 收集监听器
    this.addSub = function (watcher) {
        if (this.subs.includes(watcher)) return;
        this.subs.push(watcher);
    }
    // 通知更新
    this.notify = function () {
        this.subs.forEach(function (watcher) {
            watcher.update(); // 假设update
        });
    }
}

function initComputed() {
    let vm = this;
    let computed = this.$options.computed; 
    Object.keys(computed).forEach(key => {
        Object.defineProperty(vm, key, {
            // 这里判断是computed里的key是对象还是函数
            // 如果是函数直接就会调get方法
            // 如果是对象的话，手动调一下get方法即可
            // 如： sum() {return this.a + this.b;},他们获取a和b的值就会调用get方法
            // 所以不需要new Watcher去监听变化了
            get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
            set() {}
        });
    });
}