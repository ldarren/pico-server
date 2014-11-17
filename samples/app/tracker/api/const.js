Object.freeze(G_MODEL={
DATA: 'data',
USER: 'user',
VEHICLE: 'vehicle',
JOB: 'job',
LISTENER: 'listener',
INVOICE: 'invoice',
NOTIFIER: 'notifier',
})
Object.freeze(G_USER_TYPE={
LEAD: 11,
CUSTOMER: 21,
DRIVER: 31,
ADMIN: 41,
SUPER: 101
})
Object.freeze(G_USER_TYPE_LIST=[
    G_USER_TYPE.LEAD,
    G_USER_TYPE.CUSTOMER,
    G_USER_TYPE.DRIVER,
    G_USER_TYPE.ADMIN,
    G_USER_TYPE.SUPER,
])
Object.freeze(G_JOB_STATE={
OPEN: 10,
SCHEDULE: 20,
START: 30,
STOP: 40,
CLOSE: 50,
CANCEL: 100
})
Object.freeze(G_JOB_STATE_DESC={
    10: 'Open',
    20: 'Schedule',
    30: 'Start',
    40: 'Stop',
    50: 'Close',
    100: 'Cancel'
})
