const
MODEL = G_MODEL.INVOICE,
SRC = __dirname + '/../tpl/invoice.',
DST = '/var/node/pico/client/samples/tracker/dat/',
URL = 'http://107.20.154.29/tracker/dat/',
SERIAL = 'A',
DATE = 'B',
TIME = 'C',
PICKUP = 'D',
DROPOFF = 'E',
CHARGE = 'F',
REMARK = 'G',
GRAND_TOTAL = 'G34',
DEPOSIT = 'G35',
TOTAL_DUE = 'G36',
START_ROW = 16,
END_ROW = 33

var
actData = require('./data'),
sqlData = require('../models/sql/data'),
sqlMap = require('../models/sql/map'),
sqlList = require('../models/sql/list'),
sqlRef = require('../models/sql/ref')
DOCX = require('docxtemplater'),
xlsx = require('xlsx'),
incomeView = function(session, details, next){
    session.getModel(MODEL)[MODEL] = details
    session.addJob([session.subJob(MODEL, MODEL)])

    next()
},
incomeReport = function(session, details, next){
    var
    wb = xlsx.readFile(SRC+'xlsx', {cellStyles:true, cellHTML: true}),
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
pnlView = function(session, details, next){
    session.getModel(MODEL)[MODEL] = details
    session.addJob([session.subJob(MODEL, MODEL)])

    next()
},
pnlReport = function(session, details, next){
    var
    wb = xlsx.readFile(SRC+'xlsx', {cellStyles:true, cellHTML: true}),
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
invoice = function(session, createdBy, details, next){
    var
    docx = new DOCX().loadFromFile(SRC+'docx'),
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
                sorted = filtered.sort(function(a, b){
                    if(a.updatedBy > b.updatedBy) return 1
                    else if (a.updatedBy < b.updatedBy) return -1
                    return 0
                })

                switch(parseInt(order.type)){
                case 1: return incomeView(session, sorted, next)
                case 2: return incomeReport(session, sorted, next)
                case 3: return pnlView(session, sorted, next)
                case 4: return pnlReport(session, sorted, next)
                case 5: return invoice(session, parseInt(order.userId), sorted, next)
                }
            })
        })
    },
}
