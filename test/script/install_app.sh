echo $1
curl -d '{"folder":"'$1'"}' -H "Content-Type:Application/json" 127.0.0.1:9461/apps
