# hibikiradio
HiBiKi Radio Station CLI
- `hibikiradio info [id|url]`
- `hibikiradio download [-t] <id|url>`

# Requirements

- grep
- curl
- ffmpeg
- jq

# Features

## Program Detail

`./hibikiradio.sh info [id|url]` fetchs program infomation.
- `url`: https://hibiki-radio.jp/description/sora/detail
- `id`: https://hibiki-radio.jp/description/sora/detail --> sora
- If `id` is not specified, all programs infomations fetched.

## Download Video

`./hibikiradio.sh download [-t] <id|url> <filepath>` downloads video.
- Video will be saved in `<filepath>.mp4`

|option|desc|
|:-----|:---|
|`-t`  |change the modified date (touch)|
