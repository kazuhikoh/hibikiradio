const Rx = require('rxjs/Rx');
const axios = require('axios');
const { JSDOM } = require('jsdom');

// https://hibiki-radio.jp/description/${accessId}/detail
// ↓
// https://hibiki-radio.jp/scripts/app-XXXXXXXXXX.js <-- angular app script
// ↓
// https://XXXXXXX/programs/${accessId} <-- json

/* 
 * Find URL of Angular-App script file.
 * 
 * https://hibiki-radio.jp/description/${accessId}/detail
 * ↓
 * https://hibiki-radio.jp/scripts/app-*.js <-- angular app script
 */
function findAppJsUrlFromWebPage(accessId) {
  const domain = 'https://hibiki-radio.jp';
  const path = `description/${accessId}/detail`;

  const url = `${domain}/${path}`;

  console.error(`GET ${url}`);
  
  return Rx.Observable
    .fromPromise(
      axios.get(url)
    )
    .map(res => res.data)
    .flatMap(html => {
      // html --> script tags
      const dom = new JSDOM(html);
      const appJsScriptTags = Array.prototype.slice.call(
          dom.window.document.getElementsByTagName('script')
        )
        .filter(it => it.src.match('app.*'));

      if (appJsScriptTags.length < 1) {
        return Rx.Observable.empty();
      }

      const appJsSrc = appJsScriptTags[0].src;
      console.error(`--> js: ${appJsSrc}`);

      return Rx.Observable.of(`${domain}/${appJsSrc}`);
    });
}

/*
 * Find API base URL
 *
 * https://hibiki-radio.jp/scripts/app-XXXXXXXXXX.js
 * ↓
 * https://XXXXXXX/
 */
function findApiBaseUrlFromAppJs(appJsUrl) {
  console.error(`GET ${appJsUrl}`);
  
  return Rx.Observable
    .fromPromise(axios.get(appJsUrl))
    .map(res => res.data)
    .flatMap(appjs => {
      const apiHost = appjs.match( /(?<=constant\("apiHost",")[^"]+/ ); 
      const apiBase = appjs.match( /(?<=apiBase=")[^"]+/ );

      console.error(`--> apiHost: ${apiHost}`);
      console.error(`--> apiBase: ${apiBase}`);
      
      return Rx.Observable.of(`${apiHost}${apiBase}`);
    });
}

/*
 * Generate program info URL
 */
function genProgramInfoUrl(apiBase, accessId) {
  return `${apiBase}programs/${accessId}`;
}

/*
 * Get program info
 */
function getProgramInfo(accessId) {
  return Rx.Observable.of(accessId)
    .flatMap(accessId => findAppJsUrlFromWebPage(accessId))
    .flatMap(appJsUrl => findApiBaseUrlFromAppJs(appJsUrl))
    .flatMap(apiBaseUrl => {
      const programInfoUrl = genProgramInfoUrl(apiBaseUrl, accessId);

      console.error(`GET ${programInfoUrl}`);

      return Rx.Observable.fromPromise(axios.get(programInfoUrl, {
        headers: { "X-Requested-With": "XMLHttpRequest" }
      }));
    })
    .map(res => res.data);
}

/*
 * Get program playlist URL
 */
function getProgramPlaylistUrl(accessId) {
  let apiBase;
  let programInfo;
  
  return Rx.Observable.of(accessId)
    .flatMap(accessId => findAppJsUrlFromWebPage(accessId))
    .flatMap(appJsUrl => findApiBaseUrlFromAppJs(appJsUrl))
    .flatMap(apiBaseUrl => {
      apiBase = apiBaseUrl;

      const url = genProgramInfoUrl(apiBaseUrl, accessId);

      console.error(`GET ${url}`);

      return Rx.Observable.fromPromise(axios.get(url, {
        headers: { "X-Requested-With": "XMLHttpRequest" }
      }));
    })
    .map(res => res.data)
    .flatMap(program => {
      programInfo = program;

      const videoId = program.episode.video.id;
      const url = `${apiBase}videos/play_check?video_id=${videoId}`;

      console.error(`GET ${url}`);

      return Rx.Observable.fromPromise(axios.get(url, {
        headers: { "X-Requested-With": "XMLHttpRequest" }
      }));
    })
    .map(res => res.data)
    .map(response => {
      console.error(`--> playlist: ${response.playlist_url}`);

      return {
        playlist: response.playlist_url,
        programInfo: programInfo
      }
    });
}

module.exports = {
  getProgramInfo,
  getProgramPlaylistUrl
}
