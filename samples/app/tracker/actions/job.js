const
MODEL = 'job',
ME = 'me',
LIST = 'list',
URL = 'url',
CWD = '/var/node/sandbox/tracker/dat/public/'

var
DOCX = require('docxtemplater'),
sql = require('../models/sql/job')

module.exports = {
    create: function(session, order, next){
        var
        me = this,
        data = order.data
        if (!data.caller || !data.mobile || !data.date || !data.time || !data.driver || !data.vehicle || !data.pickup || !data.dropoff)
            return next(G_CERROR['400'])

        sql.create(data, function(err, result){
            if (err) return next(err)

            data['id'] = result.insertId

            var model = session.getModel(MODEL)
            model[ME] = data
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, ME)]]
            )

            next()
        })
    },
    read: function(session, order, next){
        var data = order.data
        sql.read(data.start, data.end, function(err, result){
            if (err) return next(err)

            var model = session.getModel(MODEL)
            model[LIST] = result

            next()
        })
    },
    remove: function(session, order, next){
        sql.remove(order.data.id, function(err, result){
            if (err) return next(err)

            session.addJob(
                G_PICO_WEB.RENDER_HEADER
            )

            next()
        })
    },
    httpOut: function(session, order, next){
        session.addJob(
            G_PICO_WEB.RENDER_FULL,
            [[session.createModelInfo(MODEL, LIST)]]
        )

        next()
    },
    docxOut: function(session, order, next){
        var
        docx = new DOCX().loadFromFile(__dirname + '/../templ/invoice.docx'),
        model = session.getModel(MODEL),
        list = model[LIST],
        transact = [],
        total = 0, deposit = 0, due = 0,
        item

        for(var i=0,l=list.length; i<l; i++){
            item = list[i]
            total += item.charge

            transact.push({
                id: item.id,
                date: item.date.toLocaleDateString(),
                time: item.time.toString(),
                pickup: item.pickup,
                dropoff: item.dropoff,
                charge: item.charge,
                remarks: item.remarks || ''
            })
        }
        due = total - deposit;

        //setting the tags
        docx.setTags({
            transact:transact,
            total: total, 
            deposit:deposit,
            due: due 
        })

        //when finished
        docx.finishedCallback=function () {
            process.chdir(CWD)
            docx.output({
                name: 'aquarius.docx',
            })

            model[URL] = 'http://107.20.154.29/tracker/dat/public/aquarius.docx' 
            session.addJob(
                G_PICO_WEB.RENDER_FULL,
                [[session.createModelInfo(MODEL, URL)]]
            )

            next()
        }

        //apply the tags
        docx.applyTags()
    },
    xlsxOut: function(session, order, next){
    }
}
