#! /bin/bash 

NAME=$1

if [ -z "$NAME" ]; then 
  echo "machine-export <machine-name>"
  exit 1
fi

echo "exporting $NAME"

# stay clean
rm -rf /tmp/$NAME

# save a copy of the machine data
cp -r $HOME/.docker/machine/machines/$NAME /tmp/$NAME

# stub out the host specific vars
cat /tmp/$NAME/config.json | sed -e "s:$HOME:{{HOME}}:g" > /tmp/$NAME/config.json.stub
mv /tmp/$NAME/config.json.stub /tmp/$NAME/config.json 

# make a zip
zip -r -j $NAME.zip /tmp/$NAME

# clean up
rm -rf /tmp/$NAME

