# flogue
A rogue-like, originally used to teach my son, that has become a really solid game.

If you are a player, all the instructions are in the game.

If you are a developer, read on.

# TO SETUP YOUR DEV ENVIRONMENT

## On Mac, agree to XCode
```bash
sudo xcodebuild -license
```

## Install Tools
You'll need NodeJS v12+, npm, git, nodemon (global install), an editor like Sublime 3.2.1+
You can use Brew for most of these.

## Git Credentials
If you have reason to be very, very concerned about security, skip these steps.
On Mac, type Cmd-Space and find Keychain Access
Within Keychain search for "github"
Set the URL to https://github.com and the username and password appropriately

## Clone the repo
```bash
cd ~/code
git clone https://github.com/kdemarest/flogue
```

## Install NodeJs tools
```bash
npm install nodemon -g
```

## Sublime Config
Click Sublime / Preferences / Settings, and set all of the following:
```json
{
	"auto_complete": false,
	"auto_match_enabled": false,
	"tab_completion": false,
	"word_wrap": "false"
}

```

Install Sublime Hooks and Hjson highlighting:
1. Install "Package Control" in Sublime: https://packagecontrol.io/installation
2. Paste that text into Sublime console: Ctrl+Backtick then paste
3. Restart Sublime.

## Mac HID setup
This KeyRepeat rate might be too fast for you. For me, it is perfect.
```bash
defaults write -g InitialKeyRepeat -int 10
defaults write -g KeyRepeat -int 1
defaults write -g com.apple.keyboard.fnState -int 1
Then logout from your machine & login to make the changes take effect
```
If you use a roller mouse:
* Uninstall any Logitech Control Center (LCC)
* Install SteerMouse
* In SteerMouse, set Wheel / Roll Up to "Scroll Up 5.0"
* In SteerMouse, set Wheel / Roll Down to "Scroll Down 5.0"


## Reducing Arm Strain
The use of touchpads and the mouse has been very bad for my left arm. To avoid over-use of the mouse:

In the OS
* Get rid of Apple's assinine Alt+Tab system by installing https://manytricks.com/witch/
  In System Prefs, Pick Witch. 
  Actions=Cycle Windows
  Sort by Window Activity
  Change Keyboard to Command + Tab
  Uncheck List apps without windows
  Click Enable Witch
* Cmd+Tab moves among all windows, remembering the last visited. Like it should.

When in the File Open dialog in Sublime
* Cmd+UpArrow goes up a directory, them Cmd+Shift+G and type in the relative path. Sadly .. is not accepted.
* Cmd+DownArrow goes down a directory. Sadly, hitting Enter on the directory doesn't always do what you want.
* To see hidden files in finder, like .gitignore, type Cmd+Shift+i   (i for invisible)
* Ctrl+Tab among Sublime tabs, and Cmd+W closes Sublime tabs

In Sublime
* Hit Cmd+Shift+P and search for "install" to install packages, below.
* Install Package BetterFindBuffer then use n/p to jump to next/previous file, and j/k for next/previous result
* Install Package iOpener for WAY better file opening with keyboard only. Includes tab completion.
* Ctrl+F finds and Ctrl+H replaces
* F3 and Shift+F3 go to the next and previous result once you're finding

In Chrome
* Install Chrome extension Tab Toggler to get correct Ctrl+Tab behavior Sadly, Alt+\` toggles it on and off.
* fn+upArrow and fn+downArrow goes up or down a page for all apps.
* Cmd+Tab and Cmd+Shift+Tab go among tabs
* Cmd+T opens tabs and Cmd+W closes tabs.
* Cmd+~ moves amonth MacOs's windows for a specific app. You'll need this for Terminal

In Terminal
* Type open -a Appname to run apps
* In /Applications rename Sublime Text to sublime and Google Chrome to chrome

# Running Flogue
* You probably want to run each of these in its own terminal, expecially if you're editing Monet.
* In /flogue/monet run "nodemon app.js"
* In /flogue run "http-server ./"
* In browser visit http://localhost:8080/src/index.html
