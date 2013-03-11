const MILL = 99999999;
var
start,
i=MILL, j=0, waste=0;

start = Date.now();
while(i--){
  waste += i;
}
console.log('while \t\t waste:%d, \t elapsed:%d',waste,Date.now() - start);

i = MILL;
waste=0;
start = Date.now();
for(j=0; j<i; ++j){
  waste += j;
}
console.log('for \t\t waste:%d, \t elapsed:%d',waste,Date.now() - start);

i = MILL;
waste=0;
start = Date.now();
for(j=0; j<i; j++){
  waste += j;
}
console.log('for \t\t waste:%d, \t elapsed:%d',waste,Date.now() - start);
