# machine-share

This is a small script that attempts to provide the missing import/export
functionality in docker machine (see issue
[23](https://github.com/docker/machine/issues/23))

## installation 

```
npm install -g machine-share
```

## exporting machines

```
machine-share export <machine-name>
>> exported to <machine-name>.tar 
```

## importing machines

```
machine-share import <machine-name>.tar
>> imported
```


