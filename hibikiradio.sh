#!/bin/bash

readonly HIBIKI_RADIO="https://hibiki-radio.jp/"

function requirements {
  local deps="grep curl jq ffmpeg"
  local ng=0

  for dep in $deps; do
    type $dep >/dev/null 2>&1 || {
      echo "ERROR: $dep not be installed." >&2
      ng=1
    }
  done

  return $ng
}

function usage {
  cat << EOF
hibikiradio: HiBiKi Radio CLI (hibiki-radio.jp)

Usage:
  hibikiradio info [id]
  hibikiradio download <url|id> <filepath>

Parameters:
  url:
    HiBiKi Radio URL
  id:
    HiBiKi Radio program id
    example> https://hibiki-radio.jp/description/sora/detail --> sora
  filepath: 
    output filepath
EOF
}

# isAccessId <string>
function isAccessId {
  local input="$1"

  return $([[ "$input" =~ ^[^\/]+$ ]])
}

# extract access-id from url
function accessIdOf {
  local url="$1"

  local accessId=$(echo "$url" | grep -oP '(?<=description/)[^ ]*(?=/detail)')

  [ "$accessId" = "" ] && {
    echo "access-id is unknown." >&2
    exit 1
  }

  echo "$accessId"
}

# fetchApiBase <access-id>
function fetchApiBase {
  local accessId="$1"
  
  local url="${HIBIKI_RADIO}description/${accessId}/detail"
  local apiBaseUrl=$(
    curl "$url" \
    | grep -oP '(?<=src=")[^ ]*app[^ ]*\.js' \
    | {
      read jsPath
   
      js=$(curl ${HIBIKI_RADIO}${jsPath})
   
      apiHost=$(echo "$js" | grep -oP '(?<=constant\("apiHost",")[^"]*')
      apiBase=$(echo "$js" | grep -oP '(?<=apiBase=")[^"]*')
      echo "${apiHost}${apiBase}"
    }
  )

  [ "$apiBaseUrl" = "" ] && {
    echo "fetching api-base failed." >&2
    exit 1
  }

  echo "$apiBaseUrl"
}

# programDetail <apiBaseUrl> <accessId>
function fetchProgramDetail {
  local programDetailApi="${apiBaseUrl}programs/${accessId}"
  
  curl "$programDetailApi" -H 'X-Requested-With: XMLHttpRequest'
}

# download <url> <filepath>
function download {
  local urlOrId="$1"
  local filepath="${2%.mp4}.mp4"
  local touch="${3:-false}"

  local accessId="$(
    isAccessId "$urlOrId" && {
      echo "$urlOrId"
    } || {
      echo $(accessIdOf "$url")
    })"
  local apiBaseUrl="$(fetchApiBase "$accessId")"

  {
    echo ""
    echo "downloading... "
  } >&2

  fetchProgramDetail "$apiBaseUrl" "accessId" \
    | {
      read detail

      echo "$detail" \
        | jq .episode.video.id \
        | sed -E 's/\r$//' \
        | xargs -I{} curl 'https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id={}' \
                      -H 'X-Requested-With: XMLHttpRequest' \
        | jq .playlist_url \
        | xargs -I{} ffmpeg -i {} -c:v copy -c:a copy -bsf:a aac_adtstoasc "$filepath"
      
      if $touch ; then
        echo "$detail" \
          | jq -r .episode.updated_at \
          | xargs -I{} touch -d {} "$filepath"
      fi
    }

  echo "done!" >&2
}

# info <url>
function info {
  local urlOrId="$1"

  local accessId="$(
    isAccessId "$urlOrId" && {
      echo "$urlOrId"
    } || {
      echo $(accessIdOf "$url")
    })"
  local apiBaseUrl="$(fetchApiBase "$accessId")"

  fetchProgramDetail "$apiBaseUrl" "accessId"
}

subcommand="$1"
shift

requirements || exit 1

while getopts t opts
do
  case $opts in
    t)
      TOUCH=true
      ;;
  esac
done
shift $(($OPTIND - 1))

case "$subcommand" in
  download)
    [ "$1" = "" ] || [ "$2" = "" ] && {
      usage
      exit 1
    }

    download "$1" "$2" "$TOUCH"
    ;;
  info)
    info "$1"
    ;;
  *)
    echo "\"$subcommand\" subcommand is invalid."
    usage
    ;;
esac

