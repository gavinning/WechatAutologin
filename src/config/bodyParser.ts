export default {
    jsonLimit: '1mb',
    formLimit: '1mb',
    enableTypes: ['json', 'form', 'text'],
    extendTypes: {
        text: ['text/xml', 'application/xml'],
    },
}
