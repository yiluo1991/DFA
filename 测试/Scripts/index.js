Vue.filter('number', function (value) {
    if (value.toString().indexOf('.') > -1) {
        value = value.toFixed(2)
    }

    return value;
})
math.config({
    number: 'BigNumber',  // Choose 'number' (default), 'BigNumber', or 'Fraction'
    precision: 64        // 64 by default, only applicable for BigNumbers
})

var app = new Vue({
    el: '#app',
    data: {
        showResult: false,
        showReadMe: false,
        loading: false,
        ruleValidate: {
            value: [{
                required: true, message: "该数据必填"
            }, {
                type: 'string', message: "请输入数字", pattern: /^[0-9]+(.[0-9]{1,64})?$/
            }]
        },
        showEditValueDialog: false,
        resultColumnConfig: [
            {
                title: "来源",
                key: 'name',
                minWidth: 100
            }, {
                title: 'SS',
                key: 'ss',
                minWidth: 100
            }, {
                title: 'df',
                key: 'df',
                minWidth: 100
            }, {
                title: 'MS',
                key: 'ms',
                minWidth: 100

            }, {
                title: "F",
                key: 'f',
                minWidth: 100
            }
        ],
        editData: [],
        editColumnConfig: [{
            title: "数据",
            key: "value",
            minWidth: 100
        }, {
            title: '操作',
            key: 'value',
            width: 160,
            render: function (h, d) {
                return h('div', [
                    h('Button', {
                        props: {
                            size: 'small',
                            type: 'success',
                            icon: 'md-create'
                        },
                        on: {
                            click: () => {
                                app.enterEditValue(d.index);
                            }
                        }
                    }, '修改'),
                    h('span', ' '),
                    h('Button', {
                        props: {
                            size: 'small',
                            type: 'error',
                            icon: 'ios-trash-outline'

                        },
                        on: {
                            click: () => {
                                app.editData.splice(d.index, 1)
                            }
                        }
                    }, '删除')
                ])
            }
        }],
        showDialog: false,
        colCount: 0,
        rowCount: 0,
        resultData: [],
        editValue: {},
        header: {

        },
        tData: [

        ],
        calcData: []
    },

    methods: {
        addrow: function () {
            var input = prompt("请输入新建的行名称");
            this.header.cols.children.push(input);
            this.rowCount++;
            var row = [];
            for (var i = 0; i < this.rowCount; i++) {
                row.push([])
            }
            this.tData.push(row);
            this.bindCalcData();
        },
        addcol: function () {
            var input = prompt("请输入新建的列名称");
            this.header.rows.children.push(input);
            this.colCount++;
            this.tData.forEach(tr => {
                tr.push([]);
            })
            this.bindCalcData();
        },
        saveEditData: function () {
            var d = this.editData;
            var arr = [];
            d.forEach(item => {
                arr.push(item.value)
            })
            this.tData[d.rowindex][d.colindex] = arr;
            this.bindCalcData();
            this.showDialog = false;
        },
        saveValue: function () {
            this.$refs["editValue"].validate((valid) => {
                if (valid) {
                    this.$Message.success('Success!');
                    if (this.editData.length == this.editValue.index) {
                        this.editData.push({ value: parseFloat(this.editValue.value) })
                    } else {
                        this.editData[this.editValue.index].value = parseFloat(this.editValue.value);
                    }
                    this.showEditValueDialog = false;
                } else {
                    this.$Message.error('Fail!');
                }
            })
        },
        resetValue() {
            this.$refs["editValue"].resetFields();
        },
        enterAddValue: function () {
            this.resetValue();
            this.editValue = { value: "", index: this.editData.length };
            app.showEditValueDialog = true;
            setTimeout(function () {

                document.getElementById("input").focus();

            }, 100)

        },
        enterEditValue: function (index) {
            this.resetValue();
            this.editValue = { value: this.editData[index].value.toString(), index: index };
            app.showEditValueDialog = true;
            setTimeout(function () {

                document.getElementById("input").focus();

            }, 100)
        },
        enterEditSource: function (rowindex, colindex) {
            var d = this.tData[rowindex][colindex];
            this.editData = [];
            this.editData.rowindex = rowindex;
            this.editData.colindex = colindex;
            d.forEach(item => {
                this.editData.push({
                    value: item
                })
            });
            this.showDialog = true;
        },
        //核心算法
        calc: function () {
            var calcData = this.calcData;//单元格数据
            //var EXup2 = 0; //所有数据方差和，用于计算SS总，已有其他方式计算，作废
            var G = 0;  //所有数据总和
            var N = 0;  //所有数据个数





            calcData.forEach(row => {
                row.forEach(td => {
                    N += td.n;
                    G = math.eval(`${G}+${td.T}`)

                })
            })



            /************
             * 总变异
             * step1
             ************ */
            //作废
            // var SS总 = math.eval(`${EXup2}-${G}^2/${N}`);



            /**
            * step2
            * */
            df总 = N - 1;

            /*************
             * 处理间变异
             * step1
             ************ */
            var SS处理间 = 0;
            for (var i = 0; i < this.rowCount; i++) {
                for (var z = 0; z < this.colCount; z++) {
                    if (calcData[i][z].n > 0) {
                        SS处理间 = math.eval(`${SS处理间}+(${calcData[i][z].T}^2/${calcData[i][z].n})`)
                    }
                }
            }
            SS处理间 = math.eval(`${SS处理间}-(${G}^2/${N})`);


            /**
             * step2
             * */
            var df处理间 = this.colCount * this.rowCount - 1;


            /*************
             * 处理内变异
             ********** **/
            var SS处理内 = 0;
            calcData.forEach(row => {
                row.forEach(td => {
                    SS处理内 = math.eval(`${SS处理内}+${td.SS}`);
                })
            })

            var df处理内 = 0;
            calcData.forEach(row => {
                row.forEach(td => {
                    df处理内 = math.eval(`${df处理内}+${td.df}`);
                })
            })

            /**********************************************************************************
             *
             * 双因素分析第二阶段
             *
             *************************************************************************************/

            /**
             * step1
             **/
            var SSa = 0;

            for (var i = 0; i < this.rowCount; i++) {
                var n = 0;
                var t = 0;
                for (var z = 0; z < this.colCount; z++) {
                    n += calcData[i][z].n;
                    t = math.eval(`${t}+${calcData[i][z].T}`);
                }

                SSa = math.eval(`${SSa}+(${t})^2/${n}`);
            }

            SSa = math.eval(`${SSa}-${G}^2/${N}`);

            dfa = this.rowCount - 1;

            /***
             * step2
             * **/
            var SSb = 0;

            for (var i = 0; i < this.colCount; i++) {
                var t = 0;
                var n = 0;
                for (var z = 0; z < this.rowCount; z++) {
                    t = math.eval(`${t}+${calcData[z][i].T}`);
                    n += calcData[z][i].n;
                }
                SSb = math.eval(`${SSb}+${t}^2/${n}`);
            }
            SSb = math.eval(`${SSb}-${G}^2/${N}`);
            dfb = this.colCount - 1;



            /***
             * step3:   AB交互作用
             * **/
            SSab = math.eval(` ${SS处理间} - ${SSa} - ${SSb}`);
            dfab = math.eval(`${df处理间} - ${dfa} - ${dfb}`);


            /*******************************************************************************************
             *
             * 双因素分析的F均方与F分数
             *
             * ****************************************************************************************/
            var MS处理内 = math.eval(`${SS处理内}/${df处理内}`);
            var MSa = math.eval(`${SSa}/${dfa}`);
            var MSb = math.eval(`${SSb}/${dfb}`);
            var MSab = math.eval(`${SSab}/${dfab}`);
            var Fa = math.eval(`${MSa}/${MS处理内}`);
            var Fb = math.eval(`${MSb}/${MS处理内}`);
            var Fab = math.eval(`${MSab}/${MS处理内}`);
            var resultData = [
                {
                    name: "组间",
                    ss: math.number(SS处理间),
                    df: math.number(df处理间)
                }, {
                    name: "　　A因素：" + this.header.cols.name,
                    ss: math.number(SSa),
                    df: math.number(dfa),
                    ms: math.number(MSa),
                    f: `F(${dfa},${df处理内})=` + math.number(Fa)
                }, {
                    name: "　　B因素：" + this.header.rows.name,
                    ss: math.number(SSb),
                    df: math.number(dfb),
                    ms: math.number(MSb),
                    f: `F(${dfb},${df处理内})=` + math.number(Fb)
                }, {
                    name: "　　AxB交互作用",
                    ss: math.number(SSab),
                    df: math.number(dfab),
                    ms: math.number(MSab),
                    f: `F(${dfab},${df处理内})=` + math.number(Fab)
                }, {
                    name: "组内",
                    ss: math.number(SS处理内),
                    df: math.number(df处理内),
                    ms: math.number(MS处理内),
                }, {
                    name: "合计",
                    ss: math.number(math.eval(` ${SS处理内} + ${SS处理间}`)),
                    df: math.number(df总)
                }];

            this.resultData = resultData;
            this.showResult = true;
        },
        bindCalcData: function () {
            w.postMessage(this.tData);
            app.loading = true;

        },
        loadData1: function () {
            this.loadData("data1");
        },
        loadData2: function () {
            this.loadData("data2");
        },
        loadData3: function () {
            $.get('/scripts/data3.js', (data) => {
                data3 = data;
                this.loadData("data3");
            }, 'json')

        },
        loadData: function (dataName) {
            this.calcData = [];
            this.header = window[dataName].header;
            this.tData = window[dataName].rows;
            this.colCount = this.header.rows.children.length;
            this.rowCount = this.header.cols.children.length;
            this.bindCalcData();
            this.resultData = [];
        }
    }
});

var data1 = {
    rows: [
        [[4500, 6000, 7000, 6000, 5500, 5000], [4500, 4500, 4800, 6500, 5500, 5500], [5000, 7000, 6000, 5500, 5500, 5500], [4500, 5500, 6500, 6600, 5000, 5500], [7000, 8000, 6000, 5000, 6000, 5500]],
        [[7000, 6800, 9000, 8000, 8800, 8800], [8000, 8000, 7900, 6800, 6000, 8800], [7000, 9000, 8500, 8000, 7900, 8800], [7800, 8700, 8200, 8000, 9000, 8800], [10000, 12000, 9800, 10000, 8900, 8800]],
        [[13000, 16000, 18000, 15000, 14000, 18800], [15000, 12000, 11000, 13000, 14000, 18800], [15000, 16000, 15000, 17000, 18000, 18800], [17000, 13000, 13000, 16000, 13000, 18800], [20000, 18000, 17000, 16000, 18800, 18800]],
        [[22000, 23000, 25000, 25000, 30000, 31000], [20000, 19000, 25000, 21000, 23000, 19000], [25000, 21000, 25000, 19000, 25000, 220000], [19900, 26000, 25000, 27000, 21000, 20000], [28000, 25000, 29000, 30000, 35000, 30000]]

    ],
    header: {
        rows: {
            name: "专业方向", children: [
                "Web前端", ".NET", "Java", "PHP", "Python"
            ]
        },
        cols: {
            name: "工作年限", children: [
                "1-2年", "3-4年", "5-6年", "7年以上"
            ]
        }
    }
}
var data2 = {
    rows: [
        [
            [3, 1, 1, 6, 4],
            [2, 5, 9, 7, 7],
            [9, 9, 13, 6, 8]
        ],
        [
            [0, 2, 0, 0, 3],
            [3, 8, 3, 3, 3],
            [0, 0, 0, 5, 0]
        ]],
    header: {
        rows: {
            name: "唤起水平", children: [
                "低", "中", "高"
            ]
        },
        cols: {
            name: "任务难度", children: [
                "容易", "困难"
            ]
        }
    }
}



//for (var i = 0; i < 7; i++) {
//    var row = [];
//    for (var z = 0; z < 7; z++) {
//        var td = [];
//        for (var q = 0; q < 1000; q++) {
//            td.push(parseInt((Math.random() * 10).toFixed(0)));
//        }
//        row.push(td)
//    }
//    data3.rows.push(row);
//}
var w = new Worker("/scripts/worker.js");

w.onmessage = function (e) {
    app.calcData = e.data;
    app.loading = false;
}
