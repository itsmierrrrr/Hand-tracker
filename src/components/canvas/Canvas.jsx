import "./Canvas.css";

function Canvas({ canvasRef }) {
  return (
    <canvas
      ref={canvasRef}
      className="canvas-overlay"
    />
  );
}

export default Canvas;