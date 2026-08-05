/**
 * Desktop Mouse Controller Service
 * Encapsulates desktop automation IPC calls (via Electron window.electronAPI)
 * with safe browser fallback when running outside Electron.
 */

class MouseController {
  constructor() {
    this.screenSize = { width: window.innerWidth, height: window.innerHeight };
    this.initScreenSize();
  }

  async initScreenSize() {
    if (window.electronAPI && window.electronAPI.getScreenSize) {
      try {
        const bounds = await window.electronAPI.getScreenSize();
        if (bounds && bounds.width && bounds.height) {
          this.screenSize = { width: bounds.width, height: bounds.height };
        }
      } catch (err) {
        console.warn("Failed to fetch screen bounds from Electron:", err);
      }
    }
  }

  /**
   * Move system mouse cursor to target screen coordinates.
   * @param {number} x 
   * @param {number} y 
   */
  moveCursor(x, y) {
    if (window.electronAPI) {
      window.electronAPI.mouseMove(x, y);
    }
  }

  /**
   * Trigger Left Click action.
   */
  leftClick() {
    if (window.electronAPI) {
      window.electronAPI.mouseLeftClick();
    }
  }

  /**
   * Trigger Right Click action.
   */
  rightClick() {
    if (window.electronAPI) {
      window.electronAPI.mouseRightClick();
    }
  }

  /**
   * Press mouse down (Hold for Drag).
   */
  mouseDown() {
    if (window.electronAPI) {
      window.electronAPI.mouseDown();
    }
  }

  /**
   * Release mouse up (End Drag).
   */
  mouseUp() {
    if (window.electronAPI) {
      window.electronAPI.mouseUp();
    }
  }

  /**
   * Scroll mouse wheel vertically.
   * @param {number} deltaY 
   */
  scroll(deltaY) {
    if (window.electronAPI) {
      window.electronAPI.mouseScroll(deltaY);
    }
  }

  /**
   * Get target screen size.
   * @returns {{width: number, height: number}}
   */
  getScreenSize() {
    return this.screenSize;
  }
}

export const mouseController = new MouseController();
