# manex
The matrix client.

Come discuss Manex with other Manex-headed individuals at [#manex:matrix.org](https://matrix.to/#/#manex:matrix.org)

![manex login](https://raw.githubusercontent.com/mininmobile/manex/master/docs/src/img/screenshot_login.png)
![loading](https://raw.githubusercontent.com/mininmobile/manex/master/docs/src/img/screenshot_loading.png)
![manex chat](https://raw.githubusercontent.com/mininmobile/manex/master/docs/src/img/screenshot_chat.png)

## Features
* [x] send and read messages to and from your rooms
* [x] sort rooms into categories
* [ ] full customizable, support for themes and plugins/extensions
* [ ] room/member options
* [ ] create rooms

## Running
Currently, you *could* build manex but since there are rapid updates and the fact that it is in very, very early development means you wouldn't want to use it as your daily driver. But this is how you would run it if you wanted to try it out/help out with development;

```bash
# downloads source code to the current directory
git clone https://github.com/mininmobile/manex.git`
# go into the source code
cd manex

# installs the dependencies and modules required for manex
# "npm i" is and alias for "npm install"
npm i

# installs the electron cli required to launch manex
# the -g flag installs this module globally as a cli tool
npm i electron -g

# starts current node project as an electron instance
# since you are in the manex repo it will start manex
electron .
```
