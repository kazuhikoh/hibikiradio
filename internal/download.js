const proc = require('child_process');
const util = require('util');
const Rx = require('rxjs/Rx');
const { Subject } = require('rxjs')
const ora = require('ora');

const api = require('../datasource/remote/hibikiradio-api');

function exec(accessId, out) {
  return api.getProgramPlaylistUrl(accessId)
    .flatMap(it => {
      const {playlist, programInfo} = it;
      console.error(`DOWNLOAD ${playlist}`);

      const filepath = genFilename(out, programInfo);
      console.error(`--> out: ${filepath}`);
      
      const subject = new Subject();

      const spinner = ora(`${filepath}`).start();

      const p = proc.spawn('ffmpeg', [
        "-n", // never overwrite
        "-i", `${playlist}`,
        "-c:v", "copy",
        "-c:a", "copy",
        "-bsf:a",
        "aac_adtstoasc",
        `${filepath}`
      ]);
      
      p.stdout.setEncoding('utf-8');
      p.stderr.setEncoding('utf-8');
      
      p.stdout.on('data', data => {
        //console.error('O ' + data);
      });
      p.stderr.on('data', data => {
        //console.error('E ' + data);
      });
      p.on('close', exitcode => {
        if (exitcode == 0) {
          spinner.succeed();
        }
        else {
          spinner.fail();
        }

        subject.next(exitcode);
        subject.complete();
      });

      return subject;
    });
}

function execWithoutAction(accessId, out) {
  return api.getProgramPlaylistUrl(accessId)
    .flatMap(it => {
      const {playlist, programInfo} = it;
      console.error(`playlist: ${playlist}`);

      const filepath = genFilename(out, programInfo);
      console.error(`out: ${filepath}`);

      return Rx.Observable.of(filepath);
    });
}

function genFilename(template, program) {
  return eval('`' + template + '`');
}

module.exports = {
  exec,
  execWithoutAction
}
