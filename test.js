const moment = require('moment')

console.log(
    moment().endOf('day'),

    moment().endOf('day').diff(moment(), 'second') - 3600
)
