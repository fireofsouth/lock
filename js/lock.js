var Lock = function() {
    this.startLock = false; //判断是否开始触摸密码点
    this.step = 1; //判断设置密码是第几步
    this.timer = null; //定时器成功或者失败保持3秒后或者再次输入时会初始化
    this.chance = 3; //3次输入密码的机会
    /* 事件对象：兼容浏览器的事件方法 */
    this.EventUtil = {
        addHandler: function(element, type, handler) {
            if (element.addEventListener) {
                element.addEventListener(type, handler, false);
            } else if (element.attachEvent) {
                element.attachEvent("on" + type, handler);
            } else {
                element["on" + type] = handler;
            }
        },
        getEvent: function(event) {
            return event ? event : window.event;
        },
        getTarget: function(event) {
            return event.target || event.srcElement;
        },
        preventDefault: function(event) {
            if (event.preventDefault) {
                event.preventDefault();
            } else {
                event.returnValue = false;
            }
        },
        removeHandler: function(element, type, handler) {
            if (element.removeEventListener) {
                element.removeEventListener(type, handler, false);
            } else if (element.datachEvent) {
                element.detachEvent("on" + type, handler);
            } else {
                element["on" + type] = null;
            }
        },
        stopPropagation: function(event) {
            if (event.stopPropagation) {
                event.stopPropagation();
            } else {
                event.cancelBubble = true;
            }
        }
    };


}
var propertys = {
    /* 
        parameter:无
        return: 无
        function: 主函数,进行一系列初始化和事件绑定
    */
    init: function() {
        this.setting();
        this.initDom();
        this.setCoordinate();
        this.initialCircle();
        this.bindEvent();

    },
    /* 
        parameter:无
        return: 无
        function: 初始化所需DOM元素
    */
    initDom: function() {
        var oDiv = this.getDom('#lock');
        this.resultDom = this.getDom('#result');
        this.canvas = this.getDom('#canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.height = oDiv.offsetWidth;
        this.canvas.width = oDiv.offsetWidth;
        var password = window.localStorage.getItem('password') || null;
        if (password) {
            this.setOperationType(1);
            this.resultDom.innerHTML = '请验证手势密码';
        } else {
            this.setOperationType(0);
            this.resultDom.innerHTML = '请设置手势密码';
        }
    },
    /* 
        parameter:DOM匹配符
        return: DOM节点
        function: 获取DOM节点
    */
    getDom: function(str) {
        var type = str.substr(0, 1);
        switch (type) {
            case '#':
                return document.getElementById(str.slice(1));
                break;
            case '[':

                return document.getElementsByName(str.slice(1, str.length - 1));
                break;
            default:
                return document.getElementsByTagName(str);
                break;
        }
    },
    /* 
        parameter:无
        return: 无
        function: 设置所需要的数据
    */
    setting: function() {
        this.centerPoint = [] //存放所有原点
        this.passwordPoint = []; //存放密码点
        this.lastPoint = []; //存放划过的剩余点
        this.resultDom = this.getDom('#result'); //结果节点一次获取多次调用
        /*各个状态下圆的样式*/
        this.circleStyle = {
            'initial': {
                'strokeStyle': '#111',
                'fillStyle': '#fff'
            },
            'move': {
                'strokeStyle': '#c63',
                'fillStyle': '#c90'
            },
            'correct': {
                'strokeStyle': '#0f3',
                'fillStyle': '#0c3'
            },
            'error': {
                'strokeStyle': '#c00',
                'fillStyle': '#c30'
            }
        };
        this.lineStyle = {
            'move': '#c63',
            'correct': '#0f3',
            'error': '#c00'
        };
    },
    /* 
        parameter:无
        return: 无
        function: 生成每个密码点的坐标点
    */
    setCoordinate: function() {
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
    },
    /* 
        parameter:无
        return: 无
        function: 初始化面板中的密码点
    */
    initialCircle: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.centerPoint.forEach(function(item, i) {
            this.drawCircle(item.x, item.y, this.circleStyle.initial);
        }.bind(this));
    },
    /* 
        parameter:无
        return: 无
        function: 得到当前对密码操作的类型
    */
    getOperationType: function() {
        var oType = this.getDom("[operationType]");
        for (var i = 0; i < oType.length; i++) {
            if (oType[i].checked == true) {
                return oType[i].value;
            }
        }

    },
    /* 
        parameter:类型序号
        return: 无
        function:设置当前操作类型
    */
    setOperationType: function(num) {
        var oType = this.getDom("[operationType]");
        oType[num].checked = true;
    },
    /* 
        parameter:x坐标,y坐标和画圆填充样式
        return: 无
        function: 画密码点
    */
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
    /* 
        parameter:经过的密码点数组和对应样式
        return: 无
        function: 画出手势划过的密码点
    */
    drawAcrossCircle: function(point, circleStyle) {
        point.forEach(function(item, i) {
            this.drawCircle(item.x, item.y, circleStyle);
        }.bind(this));
    },
    /* 
         parameter:线填充样式，当前点坐标对象
         return: 无
         function: 画出经过的密码线
     */
    drawAcrossLine: function(lineStyle, p) {
        this.ctx.strokeStyle = lineStyle;
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        this.passwordPoint.forEach(function(item, i) {
            if (i === 0) {
                this.ctx.moveTo(item.x, item.y);
            }
            this.ctx.lineTo(item.x, item.y);
        }.bind(this));
        if (arguments.length == 2) {
            this.ctx.lineTo(p.x, p.y);
        }
        this.ctx.stroke();
        this.ctx.closePath();
    },
    /* 
        parameter:事件对象
        return: 无
        function: 当前手势在canvas中的相对位置
    */
    getRelativePosition: function(event) {
        var event = this.EventUtil.getEvent(event);
        var rec = event.currentTarget.getBoundingClientRect();
        var relativePosition = {
            x: event.touches[0].clientX - rec.left,
            y: event.touches[0].clientY - rec.top
        };
        return relativePosition;
    },
    /* 
         parameter:无
         return: 无
         function: 手指滑动各步骤添加相应事件
     */

    bindEvent: function() {
        /*监听解锁事件*/
        this.startEvent = this.handleStart.bind(this);
        this.moveEvent = this.handleMove.bind(this);
        this.endEvent = this.handleEnd.bind(this);
        this.EventUtil.addHandler(this.canvas, 'touchstart', this.startEvent);
        this.EventUtil.addHandler(this.canvas, 'touchmove', this.moveEvent);
        this.EventUtil.addHandler(this.canvas, 'touchend', this.endEvent);

        /*监听操作类型*/
        var setupPswDom = this.getDom('[operationType]')[0];
        var verificatePswDom = this.getDom('[operationType]')[1];
        this.setupPswEvent = this.handleSetupPsw.bind(this);
        this.VerificatePswEvent = this.handleVerificatePsw.bind(this);
        this.EventUtil.addHandler(verificatePswDom, 'change', this.VerificatePswEvent);
        this.EventUtil.addHandler(setupPswDom, 'change', this.setupPswEvent);

        /*监听提示框选择*/
        var confirmDom = this.getDom('#confirm');
        var cancelDom = this.getDom('#cancel');
        this.confirmResetPswEvent = this.handleConfirmResetPsw.bind(this);
        this.cancleResetPswEvent = this.handleCancleResetPsw.bind(this);
        this.EventUtil.addHandler(confirmDom, 'click', this.confirmResetPswEvent);
        this.EventUtil.addHandler(cancelDom, 'click', this.cancleResetPswEvent);

        /*监听重新绘制*/
        var repaintDom = this.getDom('#repaint');
        this.repaintEvent = this.handleRepaint.bind(this);
        this.EventUtil.addHandler(repaintDom, 'click', this.repaintEvent);
    },
    handleVerificatePsw: function() {
        if (!this.handleLocalStorage('get', 'password')) {
            this.resultDom.innerHTML = '设置密码后，再验证';
            this.setOperationType(0);
        } else {
            return;
        }
    },
    handleSetupPsw: function() {
        if (this.handleLocalStorage('get', 'password')) {
            this.getDom('#prompt').style.display = 'block';
        } else {
            return;
        }
    },
    handleConfirmResetPsw: function() {
        this.handleLocalStorage('remove', 'password');
        this.getDom('#prompt').style.display = 'none';
        this.chance = 3;
        this.resultDom.innerHTML = '请重新设置手势密码';
        this.resultDom.className = '';
    },
    handleCancleResetPsw: function() {
        this.getDom('#prompt').style.display = 'none';
        this.setOperationType(1);
        this.resultDom.innerHTML = '请验证手势密码';
    },
    handleRepaint: function() {
        this.step = 1;
        this.initialCircle();
        this.handleLocalStorage('remove', 'psw1');
        this.resultDom.innerHTML = '请重新设置手势密码';
        this.getDom('#repaint').style.display = 'none';
        this.resultDom.className = '';
    },
    /* 
         parameter:事件对象
         return: 无
         function: 手指刚触摸屏幕事件处理程序
     */

    handleStart: function(event) {
        event = this.EventUtil.getEvent(event);
        this.EventUtil.preventDefault(event);
        clearTimeout(this.timer);
        var p = this.getRelativePosition(event);
        this.centerPoint.forEach(function(item, i) {
            if (Math.abs(p.x - item.x) < this.r && Math.abs(p.y - item.y) < this.r) {
                var password = this.handleLocalStorage('get', 'password');
                this.startLock = true;
                this.drawCircle(item.x, item.y, this.circleStyle.move);
                this.passwordPoint.push(item);
                this.lastPoint.splice(i, 1);
            }

        }.bind(this));
    },
    /* 
         parameter:事件对象
         return: 无
         function: 手指滑动屏幕事件处理程序
     */
    handleMove: function(event) {
        event = this.EventUtil.getEvent(event);
        if (this.startLock) {
            this.move(this.getRelativePosition(event));
        }
    },
    /* 
         parameter:当前坐标点
         return: 无
         function: 手指移动处理过程
     */
    move: function(p) {
        this.initialCircle();
        this.drawAcrossCircle(this.passwordPoint, this.circleStyle.move)
        this.drawAcrossLine(this.lineStyle.move, p);
        this.lastPoint.forEach(function(item, i) {
            if (Math.abs(p.x - item.x) < this.r && Math.abs(p.y - item.y) < this.r) {
                this.drawCircle(item.x, item.y, this.circleStyle.move);
                this.passwordPoint.push(item);
                this.lastPoint.splice(i, 1);
            }

        }.bind(this))
    },
    /* 
         parameter:事件对象
         return: 无
         function: 手指离开屏幕事件处理程序
     */
    handleEnd: function() {
        if (this.startLock) {
            this.startLock = false;
            this.acrossResult();
        }
    },
    /* 
         parameter:操作类型，键，值
         return: 无
         function: 封装LocalStroage操作函数
     */
    handleLocalStorage: function(type, key, value) {
        switch (type) {
            case 'set':
                window.localStorage.setItem(key, value);
                break;
            case 'get':
                return window.localStorage.getItem(key);
                break;
            case 'remove':
                window.localStorage.removeItem(key);
                break;

        }
    },
    /* 
         parameter:无
         return: 无
         function: 滑动过后相应结果
     */
    acrossResult: function() {

        this.resultDom.innerHTML = '';
        this.resultDom.className = '';
        var type = this.getOperationType();
        var passwordStr = this.passwordObjToStr(this.passwordPoint);
        if (this.passwordPoint.length < 4 && type == 'setupPsw' && this.step == 1) {
            this.resultDom.innerHTML = '密码太短，至少需要4个点';
            this.initialCircle();
            return;
        }
        if (type == 'setupPsw') {
            if (this.step == 1) {
                this.handleLocalStorage('set', 'psw1', passwordStr);
                this.step++;
                this.getDom('#repaint').style.display = 'inline';
                this.resultDom.innerHTML = '请确认手势密码';
                this.initialCircle();
            } else if (this.step == 2) {
                var psw1 = this.handleLocalStorage('get', 'psw1');
                if (this.checkPassWord(psw1, passwordStr)) {
                    this.step = 1;
                    this.getDom('#repaint').style.display = 'none';
                    this.handleLocalStorage('set', 'password', psw1);
                    this.handleLocalStorage('remove', 'psw1');
                    this.setOperationType(1);
                    var str = '密码设置成功!';
                    this.handleResult(str, this.circleStyle.correct, this.lineStyle.correct);
                } else {
                    this.resultDom.className = 'error';
                    var str = '两次输入不一致，请重试!';
                    this.handleResult(str, this.circleStyle.error, this.lineStyle.error);
                }
            }
        } else if (type == 'verificatePsw') {
            var password = this.handleLocalStorage('get', 'password');
            if (this.checkPassWord(password, passwordStr)) {
                this.chance = 3;
                var str = '密码正确！';
                this.handleResult(str, this.circleStyle.correct, this.lineStyle.correct);
            } else {
                this.chance--;
                if (this.chance == 0)
                    this.countDown(this.resultDom);
                else {
                    this.resultDom.className = 'error';
                    var str = '密码不正确,剩' + this.chance + '机会';
                    this.handleResult(str, this.circleStyle.error, this.lineStyle.error);
                }
            }
        }
        this.reset();
    },
    /* 
        parameter:无
        return: 无
        function: 处理完密码重置两个点对象数组
    */
    reset: function() {
        this.passwordPoint = [];
        this.lastPoint = this.centerPoint.slice(0);
    },
    /* 
         parameter:提示字符串,圆填充样式,线填充样式
         return: 无
         function: 对滑动过后相应结果进行处理
     */
    handleResult: function(str, circleStyle, lineStyle) {

        this.initialCircle();
        this.resultDom.innerHTML = str;
        this.drawAcrossCircle(this.passwordPoint, circleStyle);
        this.drawAcrossLine(lineStyle);
        this.timer = setTimeout(function() {
            this.initialCircle()
        }.bind(this), 3000);

    },
    /* 
         parameter:提示符显示的DOM节点
         return: 无
         function: 倒计时
     */
    countDown: function(resultDom) {
        var n = 5;
        var modeDom = this.getDom('#mode');
        modeDom.style.display = 'block';
        this.initialCircle();
        this.chance = 3;

        function time() {
            resultDom.innerHTML = (n--) + '秒后才能解锁';
            t = setTimeout(arguments.callee, 1000);
            if (n < 0) {
                resultDom.innerHTML = '请验证手势密码';
                clearTimeout(t);
                modeDom.style.display = 'none';

            }
        }
        time();

    },
    /* 
         parameter:密码点对象数组
         return: 密码点数字字符
         function: 转换密码点方便使用
     */
    passwordObjToStr: function(point) {
        var str = '';
        point.forEach(function(item, i) {
            str += item.index;
        })
        return str;
    },
    /* 
         parameter:密码1，密码2
         return: boolean值
         function: 判断密码是否一致
     */
    checkPassWord: function(psw1, psw2) {
        return psw1 === psw2;
    }
}
Lock.prototype = Object.create(propertys);
