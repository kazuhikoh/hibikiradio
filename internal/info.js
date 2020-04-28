const proc = require('child_process');
const Rx = require('rxjs/Rx');

const api = require('../datasource/remote/hibikiradio-api');

function exec(accessId) {
  return api.getProgramInfo(accessId)
    .map(program => JSON.stringify(program, null, '\t'))
}

module.exports = {
  exec
}
