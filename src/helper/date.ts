import * as moment from 'moment'

export default {
    /**
     * 返回从现在到今天截止的时间，单位秒
     * @param offset 向前偏移，单位秒
     * @example 取现在到今天截止的时间：endToday()
     * @example 取现在到今天23点的时间：endToday(1 * 60 * 60)
     */
    endToday(offset: number = 0) {
        return moment().endOf('day').diff(moment(), 'second') - offset
    },
}
