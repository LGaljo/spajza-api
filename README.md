Backend built on Nest framework for inventory project.

## Installation

```bash
$ git clone https://github.com/LGaljo/inventory-api
```

Running on raspberry pi requires installation of some additional libraries
```bash
mkdir phantomjs-raspberrypi
cd phantomjs-raspberrypi
# https://github.com/piksel/phantomjs-raspberrypi
wget https://github.com/piksel/phantomjs-raspberrypi/releases/download/v2.1.1-r/phantomjs-armv6-rpi-v2.1.1.tar.xz
tar -xf phantomjs-armv6-rpi-v2.1.1.tar.xz
sudo cp -R bin/. /usr/bin
sudo cp -R lib/. /usr/lib
```

```bash
$ npm i
```

## Running the app

```bash
# development
$ npm run start
$ npm run start:dev
$ npm run start:debug

# production mode
$ npm run build
$ npm run start:prod
```

## Use PM2 to run at startup
```bash
# Have pm2 install ie npm install -g pm2

pm2 start dist/main.js --name=inventory-api

pm2 startup systemd

pm2 save
```