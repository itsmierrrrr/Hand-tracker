const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  mouseMove: (x, y) => ipcRenderer.send("mouse:move", { x, y }),
  mouseLeftClick: () => ipcRenderer.send("mouse:click", "left"),
  mouseRightClick: () => ipcRenderer.send("mouse:click", "right"),
  mouseDown: () => ipcRenderer.send("mouse:down", "left"),
  mouseUp: () => ipcRenderer.send("mouse:up", "left"),
  mouseScroll: (deltaY) => ipcRenderer.send("mouse:scroll", deltaY),
  getScreenSize: () => ipcRenderer.invoke("screen:get-size"),
});
