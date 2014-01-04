echo "uninstall app "$1
curl -X "DELETE" 127.0.0.1:9461/apps/$1
