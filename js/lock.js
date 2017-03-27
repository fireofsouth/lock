var Lock = function() {

    this.startLock = false;
    this.step = 1; //判断设置密码是第几步
    this.timer = null; //定时器成功或者失败再5秒后或者再次输入时会初始化
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
    //初始化
    init: function() {
        this.initDom();
        this.setting();
        this.setCoordinate();
        this.initialCircle();
        this.bindEvent();

    },
    //初始Dom和操作类型
    initDom: function() {
        var oDiv = this.getDom('#lock');
        var resultDom = this.getDom('#result');
        this.canvas = this.getDom('#canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.height = oDiv.offsetWidth;
        this.canvas.width = oDiv.offsetWidth;
        var password = window.localStorage.getItem('password') || null;
        if (password) {
            this.setOperationType(1);
            resultDom.innerHTML = '请输入手势密码';
        } else {
            this.setOperationType(0);
            resultDom.innerHTML = '请设置手势密码';
        }
    },
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
    setting: function() {
        this.centerPoint = [] //存放所有原点
        this.passwordPoint = []; //存放密码点
        this.lastPoint = []; //存放划过的剩余点
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
    //将所有坐标点存在两个数组中;
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
    //初始化每个原点
    initialCircle: function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.centerPoint.forEach(function(item, i) {
            this.drawCircle(item.x, item.y, this.circleStyle.initial);
        }.bind(this));
    },
    getOperationType: function() {
        var oType = this.getDom("[operationType]");
        for (var i = 0; i < oType.length; i++) {
            if (oType[i].checked == true) {
                return oType[i].value;
            }
        }

    },
    setOperationType: function(num) {
        var oType = this.getDom("[operationType]");
        oType[num].checked = true;
    },
    //画圆
    drawCircle: function(x, y, circleStyle) {
        this.ctx.strokeStyle = circleStyle.strokeStyle;
        this.ctx.fillStyle = circleStyle.fillStyle;
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.r, 0, Math.PI * 2, true);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.fill();
    },
    //画出划过圆的点
    drawAcrossCircle: function(point, circleStyle) {
        point.forEach(function(item, i) {
            this.drawCircle(item.x, item.y, circleStyle);
        }.bind(this));
    },
    //画手势密码划过的线
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
    //得到在点在canvas中的相对位置
    getRelativePosition: function(event) {
        var event = this.EventUtil.getEvent(event);
        var rec = event.currentTarget.getBoundingClientRect();
        var relativePosition = {
            x: event.touches[0].clientX - rec.left,
            y: event.touches[0].clientY - rec.top
        };
        return relativePosition;
    },


    bindEvent: function() {
        this.startEvent = this.handleStart.bind(this);
        this.moveEvent = this.handelMove.bind(this);
        this.endEvent = this.handelEnd.bind(this);
        // this.canvas.addEventListener('touchstart', this.startEvent, false);
        this.EventUtil.addHandler(this.canvas, 'touchstart', this.startEvent);
        this.EventUtil.addHandler(this.canvas, 'touchmove', this.moveEvent);
        this.EventUtil.addHandler(this.canvas, 'touchend', this.endEvent);
        // this.canvas.addEventListener('touchmove', this.moveEvent, false);
        // this.canvas.addEventListener('touchend', this.endEvent, false);
    },
    handleStart: function(event) {
        event = this.EventUtil.getEvent(event);
        this.EventUtil.preventDefault(event);
        clearTimeout(this.timer);
        var p = this.getRelativePosition(event);
        this.centerPoint.forEach(function(item, i) {
            if (Math.abs(p.x - item.x) < this.r && Math.abs(p.y - item.y) < this.r) {
                this.startLock = true;
                this.drawCircle(item.x, item.y, this.circleStyle.move);
                this.passwordPoint.push(item);
                this.lastPoint.splice(i, 1);

            }

        }.bind(this))
    },
    handelMove: function(event) {
        event = this.EventUtil.getEvent(event);
        if (this.startLock) {
            this.move(this.getRelativePosition(event));
        }
    },
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
    handelEnd: function() {
        if (this.startLock) {
            this.startLock = false;
            this.acrossResult();
        }
    },
    handelLocalStorage: function(type, key, value) {
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
    acrossResult: function() {
        var resultDom = this.getDom('#result');
        resultDom.innerHTML = '';
        resultDom.className = '';
        var type = this.getOperationType();
        var passwordStr = this.passwordObjToStr();
        if (this.passwordPoint.length < 4 && type == 'setupPsw' && this.step == 1) {
            resultDom.innerHTML = '密码太短，至少需要4个点';
            this.initialCircle();
            return;
        }
        if (type == 'setupPsw') {
            if (this.step == 1) {
                this.handelLocalStorage('set', 'psw1', passwordStr);
                this.step++;
                resultDom.innerHTML = '请确认手势密码';
                this.initialCircle();
            } else if (this.step == 2) {
                var psw1 = this.handelLocalStorage('get', 'psw1');
                if (this.checkPassWord(psw1, passwordStr)) {
                    this.step = 1;
                    this.handelLocalStorage('set', 'password', psw1);
                    this.handelLocalStorage('remove', 'psw1');
                    var str = '密码设置成功!';
                    this.handelResult(str, this.circleStyle.correct, this.lineStyle.correct);
                } else {
                    resultDom.className = 'error';
                    var str = '两次密码不一致，重新输入!';
                    this.handelResult(str, this.circleStyle.error, this.lineStyle.error);
                }
            }
        } else if (type == 'verificatePsw') {
            var password = this.handelLocalStorage('get', 'password');
            if (this.checkPassWord(password, passwordStr)) {
                this.chance = 3;
                var str = '密码正确！';
                this.handelResult(str, this.circleStyle.correct, this.lineStyle.correct);
            } else {
                this.chance--;
                if (this.chance == 0)
                    this.countDown(resultDom);
                else {
                    resultDom.className = 'error';
                    var str = '密码不正确,剩' + this.chance + '机会';
                    this.handelResult(str, this.circleStyle.error, this.lineStyle.error);
                }
            }
        }
        this.passwordPoint = [];
        this.lastPoint = this.centerPoint.slice(0);
    },
    handelResult: function(str, circleStyle, lineStyle) {
        var resultDom = this.getDom('#result');
        this.initialCircle();
        resultDom.innerHTML = str;
        this.drawAcrossCircle(this.passwordPoint, circleStyle);
        this.drawAcrossLine(lineStyle);
        this.timer = setTimeout(function() {
            this.initialCircle()
        }.bind(this), 5000);

    },
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
                resultDom.innerHTML = '请输入手势密码';
                clearTimeout(t);
                modeDom.style.display = 'none';

            }
        }
        time();

    },
    //密码点对象转化为密码字符串
    passwordObjToStr: function() {
        var str = '';
        this.passwordPoint.forEach(function(item, i) {
            str += item.index;
        })
        return str;
    },
    //核对密码
    checkPassWord: function(psw1, psw2) {
        return psw1 === psw2;
    }
}
Lock.prototype = Object.create(propertys);
