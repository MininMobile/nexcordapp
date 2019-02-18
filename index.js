const { app, BrowserWindow } = require('electron');
const path = require("path"),
	  url = require("url");

let win;

function createWindow() {
	win = new BrowserWindow();

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'src/index.html'),
		protocol: "file:",
		slashes: true
	}));

	win.setBackgroundColor("#212121");

	win.setMinimumSize(800, 600);
	win.setResizable(true);

	win.focus();

	win.on("closed", app.quit);
}

app.on("window-all-closed", () => app.quit());
app.on("ready", createWindow);
