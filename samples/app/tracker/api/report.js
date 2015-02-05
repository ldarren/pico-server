const
MODEL = G_MODEL.INVOICE,
SRC = __dirname + '/../tpl/',
DST = '/var/node/pico/client/samples/tracker/dat/',
URL = 'http://107.20.154.29/tracker/dat/',
SERIAL = 'A',
DATE = 'B',
TIME = 'C',
PICKUP = 'D',
DROPOFF = 'E',
CHARGE = 'F',
REMARK = 'G',
INCOME = 'C',
EXPENSES = 'D',
PROFIT = 'E',
GRAND_TOTAL = 'G34',
DEPOSIT = 'G35',
TOTAL_DUE = 'G36',
TOTAL_INCOME = 'C41',
TOTAL_EXPENSES = 'D41',
TOTAL_PROFIT = 'E41',
START_ROW = 16,
END_ROW = 33,
START_PNL_ROW = 10

var
actData = require('./data'),
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref')
common = require('pico-common'),
DOCX = require('docxtemplater'),
xlsx = require('xlsx'),
monthDiff = function(d1, d2) {
    var months
    months = (d2.getFullYear() - d1.getFullYear()) * 12
    months -= d1.getMonth() + 1
    months += d2.getMonth()
    return months <= 0 ? 0 : months
},
daysInMonth = function(month, year){ console.log(month, year);return new Date(year, month+1, 0).getDate() },
updatedBySort= function(a, b){
    if(a.updatedBy > b.updatedBy) return 1
    else if (a.updatedBy < b.updatedBy) return -1
    return 0
},
pnl = function(month, incomeRaw, expensesRaw, income, expenses, cb){
    var
    dailyIncome = 0, dailyExpenses = 0,
    earns = [], spends = [],
    day, j, k, d, items

    try{
        spends = JSON.parse(expensesRaw)
        for(j=0; d=incomeRaw[j]; j++){ earns.push(JSON.parse(d.json)) }
        j=0
        for(var i=0,l=daysInMonth(parseInt(month.substr(5, 2))-1, month.substr(0, 4)),row=START_PNL_ROW; i<l; i++,row++){
            day = month + '-' + ('0'+(i+1)).slice(-2)
            dailyIncome = 0
            dailyExpenses = 0

            for(; d=earns[j];){
                if (day !== d.date) break
                j++
                dailyIncome += parseFloat(d.charge) || 0
            }
            income.push(dailyIncome)
            items = spends[i]
            if (items){
                for(k=0; d=items[k]; k++){
                    dailyExpenses += d[1]
                }
            }
            expenses.push(dailyExpenses)
        }
        return cb(null, income, expenses)
    }catch(exp){
        return cb(exp, income, expenses)
    }
},
incomeView = function(session, details, next){
    session.getModel(MODEL)[MODEL] = details
    session.addJob([session.subJob(MODEL, MODEL)])

    next()
},
incomeReport = function(session, details, next){
    var
    wb = xlsx.readFile(SRC+'invoice.xlsx', {cellStyles:true, cellHTML: true}),
    sheet = wb.Sheets.Invoice,
    total = 0,
    charge

    try{
        for (var i=START_ROW,item; item=details[i-START_ROW]; i++){
            json = JSON.parse(item.json)
            sheet[DATE+i] = {v:json.date, t:'s'}
            sheet[TIME+i] = {v:json.time, t:'s'}
            sheet[PICKUP+i] = {v:json.pickup, t:'s'}
            sheet[DROPOFF+i] = {v:json.dropoff, t:'s'}
            charge = parseFloat(json.charge) || 0
            sheet[CHARGE+i] = {v:charge, t:'n'}
            total += charge
        }
    }catch(exp){
        return next(exp)
    }
    sheet[DEPOSIT] = {v:0,t:'n'}
    sheet[GRAND_TOTAL] = sheet[TOTAL_DUE] = {v:total,t:'n'}

    //console.log(sheet)

    xlsx.writeFile(wb, DST+'aquarius.xlsx')

    session.getModel(MODEL)[MODEL] = URL+'aquarius.xlsx' 
    session.addJob([session.subJob(MODEL, MODEL)])
/* server side push file download
var path = require('path');
var mime = require('mime');

app.get('/download', function(req, res){

  var file = __dirname + '/upload-folder/dramaticpenguin.MOV';

  var filename = path.basename(file);
  var mimetype = mime.lookup(file);

  res.setHeader('Content-disposition', 'attachment; filename=' + filename);
  res.setHeader('Content-type', mimetype);

  var filestream = fs.createReadStream(file);
  filestream.pipe(res);
});
 */

    next()
},
pnlView = function(session, month, incomeRaw, expensesRaw, next){
    pnl(month, incomeRaw, expensesRaw, [], [], function(err, income, expenses){
        if (err) return next(err)
        session.getModel(MODEL)[MODEL] = {income:income, expenses:expenses}
        session.addJob([session.subJob(MODEL, MODEL)])

        next()
    })
},
pnlReport = function(session, month, incomeRaw, expensesRaw, next){
    pnl(month, incomeRaw, expensesRaw, [], [], function(err, income, expenses){
        if (err) return next(err)
        var
        wb = xlsx.readFile(SRC+'pnl.xlsx', {cellStyles:true, cellHTML: true}),
        sheet = wb.Sheets.Profit_n_Loss,
        dailyIncome = 0, dailyExpenses = 0, totalIncome = 0, totalExpenses = 0,
        row = START_PNL_ROW

        //console.log(wb.Sheets)

        for(var i=0,l=income.length,row=START_PNL_ROW; i<l; i++,row++){
            day = month + '-' + ('0'+(i+1)).slice(-2)
            dailyIncome = 0
            dailyExpenses = 0

            dailyIncome += income[i]
            dailyExpenses += expenses[i]

            totalIncome += dailyIncome
            totalExpenses += dailyExpenses

            sheet[DATE+row] = {v:day, t:'s'}
            sheet[INCOME+row] = {v:dailyIncome, t:'s'}
            sheet[EXPENSES+row] = {v:dailyExpenses, t:'s'}
            sheet[PROFIT+row] = {v:totalIncome-totalExpenses, t:'s'}
        }

        sheet[TOTAL_INCOME] = {v:totalIncome, t:'s'}
        sheet[TOTAL_EXPENSES] = {v:totalExpenses, t:'s'}
        sheet[TOTAL_PROFIT] = {v:totalIncome-totalExpenses, t:'s'}

        xlsx.writeFile(wb, DST+'pnl.xlsx')

        session.getModel(MODEL)[MODEL] = URL+'pnl.xlsx' 
        session.addJob([session.subJob(MODEL, MODEL)])

        next()
    })
},
invoice = function(session, createdBy, details, next){
    var
    docx = new DOCX().loadFromFile(SRC+'invoice.docx'),
    transact = [],
    total = 0, deposit = 0, due = 0,
    item, json, charge

    try{
        for(var i=0,item; item=details[i]; i++){
            if (item.createdBy !== createdBy) continue
            json = JSON.parse(item.json)
            charge = parseFloat(json.charge) || 0
            total += charge

            transact.push({
                id: item.id,
                date: json.date,
                time: json.time,
                pickup: json.pickup,
                dropoff: json.dropoff,
                charge: charge,
                remarks: json.remarks || ''
            })
        }
    }catch(exp){
        return next(exp)
    }
    due = total - deposit;

    sqlMap.getVal(createdBy, 'json', function(err, result){
        if (err) return next(err)
        try{
            var user = JSON.parse(result[0].val)
        }catch(exp){
            return next(exp)
        }
        //setting the tags
        docx.setTags({
            name:user.name,
            coy:user.coy || 'NA',
            tel: user.tel || 'NA',
            fax: user.fax || 'NA',
            email: user.email || 'NA',
            now: (new Date).toDateString(),
            transact:transact,
            total: total, 
            deposit:deposit,
            due: due 
        })

        //when finished
        docx.finishedCallback=function () {
            process.chdir(DST)
            docx.output({
                name: 'aquarius.docx',
            })

            session.getModel(MODEL)[MODEL] = URL+'aquarius.docx' 
            session.addJob([session.subJob(MODEL, MODEL)])

            next()
        }

        //apply the tags
        docx.applyTags()
    })
}

module.exports = {
    setup: function(context, next){
        next()
    },
    read: function(session, order, next){
        if (!order.from || !order.to) return 
        sqlData.getTypeRange('job', order.from, order.to, function(err, summary){
            if (err) return next(err)

            actData.loadAll(summary, [], function(err, details){
                if (err) return next(err)

                var
                filtered = details.filter(function(d){return 50 == d.job}),
                sorted = filtered.sort(updatedBySort),
                view

                switch(parseInt(order.type)){
                case 1: return incomeView(session, sorted, next)
                case 2: return incomeReport(session, sorted, next)
                case 3: view = pnlView; break
                case 4: view = pnlReport; break
                case 5: return invoice(session, parseInt(order.userId), sorted, next)
                }

                var month = order.from.substring(0, 7)

                sqlMap.getDataId('month', month, function(err, result){
                    if (err) return next(err)
                    if (!result.length) return view(session, month, sorted, undefined, next)
                    sqlData.getValid(common.pluck(result, 'dataId'), function(err, result){
                        if (err) return next(err)
                        if (!result.length) return view(session, month, sorted, undefined, next)
                        sqlMap.getVal(result[0].id, 'date', function(err, result){
                            if (err) return next(err)
                            if (!result.length) return view(session, month, sorted, undefined, next)

                            return view(session, month, sorted, result[0].val, next)
                        })
                    })
                })
            })
        })
    }
}
