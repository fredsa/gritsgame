# Download and Configure Git #
  1. Download and install Git

### Windows ###
From an msysgit bash prompt type:
```
echo "machine code.google.com login %USERNAME%@domain.com password <your-google-code-password>" >> ~/_netrc
```
### Linux / OSX ###
```
echo "machine code.google.com login ${USER}@domain.com password <your-google-code-password>" >> ~/.netrc
```


# Get Grits #

The source code can be found in this `grits` Google Code Project Hosting project:
> http://code.google.com/p/gritsgame/source/checkout

To checkout the source:
```
git clone http://code.google.com/p/gritsgame/
```


# Get Python 2.7.x #
_Note: **Our App Engine unit tests require Python 2.7. To run the game, you currently only need Python 2.6.x**. You can ignore the fact that the App Engine app specifies the `python27` runtime. Python 2.6 will work just fine for the local dev\_appserver._

  * Python 2.6.x _should_ already be installed on your Google issued machine. You can grab the latest Python 2.7 release from http://www.python.org/download/releases/.

### Windows ###
```
C:\> python -V
Python 2.6.4
```

### Linux / OSX ###
```
# default python version
$ python -V
Python 2.6.5

# explicitly use python 2.7
$ python2.7 -V
Python 2.7.2
```


# Get App Engine SDK / dev\_appserver #

Download the latest SDK, which includes the dev\_appserver from:
> https://developers.google.com/appengine/downloads


# Get Node.js v0.6.18 #

http://nodejs.org/#download

### OSX ###
  1. Download and install `node-v0.6.18.pkg`

### Linux ###
  1. Download and extra source code to a local dir
  1. Install:
```
./configure
make install
```
> > For alternatives to `sudo make install` see https://gist.github.com/579814

### Windows ###
  1. Run installer
    * Will place it in `C:\Program Files (x86)\nodejs` and setup path.
  1. Check that you can run node and npm from anywhere
    * If not your path variable may be too long. Take a large portion of it and move it to a new environment variable such as PATH2, then include that from PATH. i.e. PATH=%PATH2%;"C:\Program Files ...";...


# Install Node Packages #
  * Windows Note: If you have a permission failure, try again from a 'cmd' with Administrator privileges: Start, Run, `cmd` ctrl-shift-enter.

From the grits directory run:
```
npm install socket.io
npm install express
```

Optionally install supervisor to ease iteration (auto reloads when .js files change)
```
npm install supervisor -g
```


# Run Locally #
## What not to worry about ##
_Note: The dev\_appserver.py will complain about missing **MySQLdb** and **PIL** libraries. You should ignore these complaints :)_
```
The rdbms API is not available because the MySQLdb library could not be loaded.
Warning: You are using a Python runtime (2.6) that is older than the production runtime environment (2.7). Your application may be dependent on Python behaviors that have changed and may not work correctly when deployed to production.
WARNING Could not initialize images API; you are likely missing the Python "PIL" module.
ImportError: No module named _imaging
```

## Actually running locally ##
From the `gritsgame/src` directory:

### Windows ###
```
# http://localhost:8081/, http://localhost:5000/, http://localhost:5001/, ...
node games-server\main.js

# http://localhost:8080/ (frontends)
# http://localhost:9100/ (matcher.0 backend)
python "C:\Program Files (x86)\Google\google_appengine\dev_appserver.py" ^
  --backends .
```

### Linux / OSX ###
```
# http://localhost:8081/, http://localhost:5000/, http://localhost:5001/, ...
./games-server.sh

# http://localhost:8080/ (frontends)
# http://localhost:9100/ (matcher.0 backend)
./client.sh
```

### Mac ###
```
# http://localhost:8081/, http://localhost:5000/, http://localhost:5001/, ...
node games-server/main.js $*

# http://localhost:8080/ (frontends)
# http://localhost:9100/ (matcher.0 backend)
dev_appserver.py --skip_sdk_update_check --backends . $*
```

  * Note that you may need to add --port=8080 to some configurations.


# Launch The Game #
Open, either:
  * Locally:
    * http://localhost:8080/ (frontends)
    * http://localhost:9100/ (backends)


# Remote development on a Compute Engine instance #
It's easy to use a Compute Engine instance for development.
  1. Create a an instance called `gritsdev`:
```
gcutil addinstance gritsdev --zone=... --machine_type=... --wait_until_running
```
  1. SSH into your new instance and setup a working environment. Note, in order to easily test the game, you'll want to use ssh port forwarding from your local machine to the Compute Engine instance. At a minimum you'll need to forward port 8080 and 8081:
```
gcutil ssh --ssh_arg -L8080:localhost:8080 --ssh_arg -L8081:localhost:8081 gritsdev
```
  1. On the remote compute engine instance:
```
# Install necessary packages
sudo apt-get install -y git zip npm

# Download and extract the latest App Engine release
# See https://developers.google.com/appengine/downloads
wget http://googleappengine.googlecode.com/files/google_appengine_?.?.?.zip
unzip google_appengine_?.?.?.zip 

# Put App Engine SDK in your PATH
echo 'export PATH=$PATH:~/google_appengine' >>~/.bashrc

# Get the source
git clone https://code.google.com/p/gritsgame/

# Start the the server components
cd gritsgame/src
./client.sh &
./games-server.sh &
```
  1. Try launching the game: http://localhost:8080/

If you'd like others to be able to test the game as well, you can have them use a local SSH client to do the forwarding. Note, this does not require the user to have Compute Engine SSH access.
```
# You determine the external IP address for the `gritsdev` instance
gcutil getinstance gritsdev | grep external-ip

# Other users can access the instance (assuming an external IP address of `1.2.3.4`)
# via http://localhost:8080/ after they've used ssh in a terminal window on their
# machine to forward the necessary ports:
ssh localhost -L8080:1.2.3.4:8080 -L8081:1.2.3.4:8081
```