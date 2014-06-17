var DOCX = require('docxtemplater')

//loading the file
docx = new DOCX().loadFromFile("../templ/invoice.docx")

var transact = [
{id:1,date:'06-06-2014', time:'05:06:06', pickup:'Jurong', dropoff:'Changi', charge:13,remarks:''},
{id:2,date:'07-06-2014', time:'05:06:03', pickup:'Juron2g', dropoff:'Changi2', charge:16,remarks:''}
]
//setting the tags
docx.setTags({
    transact:transact,
    deposit:0,
    total: 29,
    due: 29
})

//when finished
docx.finishedCallback=function () {
    docx.output()
}

//apply the tags
docx.applyTags()
