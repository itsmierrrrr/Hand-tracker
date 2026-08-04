/**
 * @fileoverview Universal Desktop Controller Service.
 * Single abstraction over all IPC automation calls.
 * Nothing outside this file should touch window.electronAPI directly.
 */

class DesktopController {
  constructor() {
    /** @type {{ width: number, height: number }} */
    this.screenSize = { width: window.screen.width, height: window.screen.height };
    this._initScreenSize();
    this._lastScrollY = null;
  }

  async _initScreenSize() {
    if (window.electronAPI?.getScreenSize) {
      try {
        const bounds = await window.electronAPI.getScreenSize();
        if (bounds?.width && bounds?.height) {
          this.screenSize = { width: bounds.width, height: bounds.height };
        }
      } catch (e) {
        console.warn("[DesktopController] Could not fetch screen size:", e);
      }
    }
  }

  // ─── Mouse ──────────────────────────────────────────────────────────────────

  /** @param {number} x @param {number} y */
  moveCursor(x, y) {
  console.log("DesktopController:", x, y);
  window.electronAPI?.mouseMove(x, y);
}
  leftClick()       { window.electronAPI?.mouseLeftClick(); }
  rightClick()      { window.electronAPI?.mouseRightClick(); }
  doubleClick()     { window.electronAPI?.mouseDoubleClick(); }
  mouseDown()       { window.electronAPI?.mouseDown(); }
  mouseUp()         { window.electronAPI?.mouseUp(); }
  /** @param {number} delta positive = scroll down, negative = scroll up */
  scroll(delta)     { window.electronAPI?.mouseScroll(delta); }

  // ─── Keyboard ────────────────────────────────────────────────────────────────

  /** @param {string} key */
  pressKey(key)           { window.electronAPI?.pressKey(key); }
  /** @param {string[]} keys */
  pressShortcut(keys)     { window.electronAPI?.pressShortcut(keys); }

  // Convenience keyboard shortcuts
  escape()      { this.pressKey("escape"); }
  enter()       { this.pressKey("enter"); }
  altTab()      { this.pressShortcut(["alt", "tab"]); }
  windowsKey()  { this.pressKey("win"); }
  copy()        { this.pressShortcut(["control", "c"]); }
  paste()       { this.pressShortcut(["control", "v"]); }
  screenshot()  { this.pressShortcut(["super", "shift", "s"]); }

  // ─── Media ───────────────────────────────────────────────────────────────────

  /** @param {"playPause"|"volumeUp"|"volumeDown"|"nextTrack"|"prevTrack"|"mute"} cmd */
  mediaControl(cmd)  { window.electronAPI?.mediaControl(cmd); }

  playPause()   { this.mediaControl("playPause"); }
  volumeUp()    { this.mediaControl("volumeUp"); }
  volumeDown()  { this.mediaControl("volumeDown"); }
  nextTrack()   { this.mediaControl("nextTrack"); }
  prevTrack()   { this.mediaControl("prevTrack"); }
  mute()        { this.mediaControl("mute"); }

  // ─── Window management ────────────────────────────────────────────────────────

  /** @param {"minimize"|"maximize"|"restore"|"close"|"switchNext"} action */
  windowAction(action) { window.electronAPI?.windowAction(action); }

  minimize()    { this.windowAction("minimize"); }
  maximize()    { this.windowAction("maximize"); }
  closeWin()    { this.windowAction("close"); }
  switchWindow(){ this.windowAction("switchNext"); }

  // ─── Screen ──────────────────────────────────────────────────────────────────

  /** @returns {{ width: number, height: number }} */
  getScreenSize() { return this.screenSize; }
}

export const desktopController = new DesktopController();
