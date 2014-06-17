const
src = '/var/node/sandbox/tracker/dat/invoice.xlsx',
dest = '/var/node/sandbox/tracker/dat/public/',
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
xlsx = require('xlsx'),
wb = xlsx.readFile(src, {cellStyles:true, cellHTML: true}),
data = [
{date:'06-06-2014', time:'05:06:06', pickup:'Jurong', dropoff:'Changi', charge:13},
{date:'07-06-2014', time:'05:06:03', pickup:'Juron2g', dropoff:'Changi2', charge:16}
]

var
sheet = wb.Sheets.Invoice,
total = 0,
item,charge

for (var i=START_ROW,l=i+data.length; i<l && i<END_ROW; i++){
    item = data[i-START_ROW]
    sheet[DATE+i] = {v:item.date, t:'s'}
    sheet[TIME+i] = {v:item.time, t:'s'}
    sheet[PICKUP+i] = {v:item.pickup, t:'s'}
    sheet[DROPOFF+i] = {v:item.dropoff, t:'s'}
    charge = item.charge
    sheet[CHARGE+i] = {v:charge, t:'n'}
    total += charge
}
sheet[DEPOSIT] = {v:0,t:'n'}
sheet[GRAND_TOTAL] = sheet[TOTAL_DUE] = {v:total,t:'n'}

//console.log(sheet)

xlsx.writeFile(wb, dest+'aquarius.xlsx')
