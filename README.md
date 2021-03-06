# 文档说明及作品地址  
https://fireofsouth.github.io/lock/  
https://fireofsouth.github.io/lock/lock.html  
# 页面结构  
## html页面结构    
- 倒计时遮挡层  
- 重新设置密码提示框  
- 密码图  
- 结果显示  
- 操作类型选择  
## css布局  
- 采用vw,vh进行适配各手机大小不同问题  
- 遮挡层使用position绝对定位  
- 对错误提示采用animation动画改变left提示  
## js  
主要采用对象封装,所用方法写入原型链中  
### 初始化  
- 初始dom元素
- 计算每个圆心的坐标存入数组中,根绝canvas宽度分为7个圆其中3个为需要显示的圆  
```javascript  
 var index = 0;
        var n = 3; //每行有三个点
        this.r = this.canvas.width / (2 + 4 * n);
        for (var i = 0; i < n; i++) {
            for (var j = 0; j < n; j++) {
                index++;
                var pointObj = {
                    x: j * 4 * this.r + 3 * this.r,
                    y: i * 4 * this.r + 3 * this.r,
                    index: index
                }
                this.centerPoint.push(pointObj);
                this.lastPoint.push(pointObj);
            }
        }
```  

- 设置不通状态下的圆形和线的对象  
- 根据初始坐标点画出初始密码点  
- 初始化事件绑定  
### 画图  
- 画圆和画线基本函数传入点和样式进行绘画，多点绘画即可调用基本函数进行绘画,如画圆:  
```javascript  
      drawCircle: function(x, y, circleStyle) {
        this.ctx.strokeStyle = circleStyle.strokeStyle;
        this.ctx.fillStyle = circleStyle.fillStyle;
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    },
        drawAcrossCircle: function(point, circleStyle) {
        point.forEach(function(item, i) {
            this.drawCircle(item.x, item.y, circleStyle);
        }.bind(this));
    },
```  

- 得到划过的点调用基本函数画出手势密码
### 时间处理函数  
- 对触摸开始的监听，开始解锁  
- 对触摸移动的监听，更新解锁轨迹  
- 对触摸结束的监听，处理划过的轨迹，做出相应操作  
- 对操作类型的监听，根据不同操作得到相应反应  
- 对重置和重绘的监听，可以清空密码或清空第一次操作重新设置密码  
### 辅助函数  
- 封装获取dom节点函数  
- 封装对LocalStorage的操作  
- 判断密码正确与否  
- 等等。。
## 功能说明  
- 进入页面:如有密码则操作自动为验证密码，无密码则为设置密码  
- 操作类型选择:无密码，点击验证密码无效会自动改为设置密码操作，有密码点击设置密码会确认是否重设  
- 设置密码:密码数不少于4位，第一次设置后可以选择重绘，第二次与第一次不同继续输入直到密码设置成功，保存密码，操作类型改为验证密码  
- 验证密码：验证密码有3次验证机会，如3次都输入错误，则会停止5秒操作，5秒后才能继续验证  
- 状态说明：第二次密码设置成功或失败和验证密码成功或失败，会将解锁密码显示2秒后消失，如2秒内触摸密码点会自动消失不影响操作  




