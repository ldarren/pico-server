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

    next()
},
pnlView = function(session, month, details, expensesRaw, next){
    var
    dailyIncome = 0,
    j=0, income=[0], expenses=[0],
    charge, day, json

    try{
        for(var i=1,l=daysInMonth(parseInt(month.substr(5, 2))-1, month.substr(0, 4))+1,row=START_PNL_ROW; i<l; i++,row++){
            day = month + '-' + ('0'+i).slice(-2)
            dailyIncome = 0

            for(var d; d=details[j];){
                json = JSON.parse(d.json)
                if (day !== json.date) break
                j++
                dailyIncome += parseFloat(json.charge) || 0
            }
            income.push(dailyIncome)
            expenses.push(parseFloat(expensesRaw[i]) || 0)
        }
    }catch(exp){
        return next(exp)
    }
    session.getModel(MODEL)[MODEL] = {income:income, expenses:expenses}
    session.addJob([session.subJob(MODEL, MODEL)])

    next()
},
pnlReport = function(session, month, details, expenses, next){
    var
    wb = xlsx.readFile(SRC+'pnl.xlsx', {cellStyles:true, cellHTML: true}),
    sheet = wb.Sheets.Profit_n_Loss,
    dailyIncome = 0, dailyExpenses = 0, totalIncome = 0, totalExpenses = 0,
    row = START_PNL_ROW,
    j=0,
    charge, day, json

    //console.log(wb.Sheets)

    try{
        for(var i=1,l=daysInMonth(parseInt(month.substr(5, 2))-1, month.substr(0, 4))+1,row=START_PNL_ROW; i<l; i++,row++){
            day = month + '-' + ('0'+i).slice(-2)
            dailyIncome = 0

            for(var d; d=details[j];){
                json = JSON.parse(d.json)
                if (day !== json.date) break
                j++
                dailyIncome += parseFloat(json.charge) || 0
            }
            dailyExpenses = parseFloat(expenses[i]) || 0
            totalIncome += dailyIncome
            totalExpenses += dailyExpenses

            sheet[DATE+row] = {v:day, t:'s'}
            sheet[INCOME+row] = {v:dailyIncome, t:'s'}
            sheet[EXPENSES+row] = {v:dailyExpenses, t:'s'}
            sheet[PROFIT+row] = {v:totalIncome-totalExpenses, t:'s'}
        }
    }catch(exp){
        return next(exp)
    }
    sheet[TOTAL_INCOME] = {v:totalIncome, t:'s'}
    sheet[TOTAL_EXPENSES] = {v:totalExpenses, t:'s'}
    sheet[TOTAL_PROFIT] = {v:totalIncome-totalExpenses, t:'s'}

    xlsx.writeFile(wb, DST+'pnl.xlsx')

    session.getModel(MODEL)[MODEL] = URL+'pnl.xlsx' 
    session.addJob([session.subJob(MODEL, MODEL)])

    next()
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

                var
                expenses = [],
                month = order.from.substring(0, 7)

                sqlMap.getDataId('month', month, function(err, result){
                    if (err) return next(err)
                    if (!result.length) return view(session, month, sorted, expenses, next)
                    sqlMap.getVal(result[0].dataId, 'date', function(err, result){
                        if (err) return next(err)
                        if (!result.length) return view(session, month, sorted, expenses, next)
                        expenses = result[0].val.split(',')
                        return view(session, month, sorted, expenses, next)
                    })
                })
            })
        })
    }
}
