


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
function Watcher(fn){
	this.update = function(){
		Dep.target = this; // 方便在数据劫持的时候进行调用
		fn();
		Dep.target = null;
	}
	this.update();
}
// let watcher = new Watcher(() => console.log('test'));  // 
// let dep = new Dep();
// dep.addSub(watcher);  
// dep.addSub(watcher);
// dep.notify();   //  test, test

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
            console.log(dep.subs);
    		return value;
    	},
    	set: function(newVal){
    		value = newVal;
    		dep.notify(); // 每当设置对象该属性的值是，会通知所有依赖它的监听器，并进行更新
    	}
	})
}
