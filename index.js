const { app, BrowserWindow } = require("electron");
const path = require("path"),
	  url = require("url");

let win;

function createWindow() {
	win = new BrowserWindow({
		icon: path.join(__dirname, "src/img/logo/manexThick.png"),
		minWidth: 800,
		minHeight: 600,
		resizable: true,
		title: "Manex",
		backgroundColor: "#212121",
		frame: false
	});

	win.loadURL(url.format({
		pathname: path.join(__dirname, "src/index.html"),
		protocol: "file:",
		slashes: true
	}));

	win.focus();

	win.on("closed", app.quit);
}

app.on("window-all-closed", () => app.quit());
app.on("ready", createWindow);
