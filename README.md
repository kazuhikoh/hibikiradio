# hibikiradio
HiBiKi Radio Station CLI
- `hibikiradio info <id>`
- `hibikiradio download [-n] <id>`

# Requirements

- ffmpeg

# Features

## Program Detail

`./hibikiradio.sh info <id>` fetchs program infomation.
- `id`: https://hibiki-radio.jp/description/sora/detail --> sora

## Download Video

`./hibikiradio.sh download [-n] <id> <filepath>` downloads video.
- Video will be saved in `<filepath>.mp4`
- `filepath` can contains variables:
    ```
    hibikiradio download -n sora 'marunare.${program.episode_updated_at.slice(0,10).replace(/\//g,"")}.${program.latest_episode_name.slice(1,-1)}.mp4'
    ```
    
|option||
|:-----|:---|
|`-n`  |No action. Show filename and exit.|

