#!/usr/bin/env node
const app = require('commander');
const api = require('./datasource/remote/hibikiradio-api');

const info = require('./internal/info');
const download = require('./internal/download');

app
  .version('1.0.0');

app
  .command('info <accessId>')
  .action(accessId => {
    const exec = info.exec;
    exec(accessId).subscribe(it => console.log(it));
  });

app
  .command('download <accessId> <out>')
  .option('-n, --noaction', 'no action. print filenames to be saved.')
  .action((accessId, out, cmd) => {
    if (cmd.noaction) {
      download.execWithoutAction(accessId, out)
        .subscribe(it => console.log(it));
      return;
    }
    
    download.exec(accessId, out)
      .subscribe(it => {
        process.exit(it);
      });
  });

app.parse(process.argv);
