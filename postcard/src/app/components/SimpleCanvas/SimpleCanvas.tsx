import { useRef, useState } from "react";
import { Stage, Layer, Line } from "react-konva";
import "./SimpleCanvas.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCancel,
  faPencil,
  faEraser,
  faUndo,
  faRedo,
} from "@fortawesome/free-solid-svg-icons";

type Tool = "brush" | "eraser";
type Line = { tool: Tool; colour: Colour; points: number[] };
type Colour = "" | "#000000" | "#dc2626" | "#16a34a" | "#2563eb";

export default function SimpleCanvas() {
  const [tool, setTool] = useState<Tool>("brush");
  const [lines, setLines] = useState<Line[]>([]);
  const [undoLines, setUndoLines] = useState<Line[]>([]); // manages lines for redo
  const isDrawing = useRef(false);
  const [currentColour, setCurrentColour] = useState<Colour>("#000000");

  const handleMouseDown = (e: any) => {
    isDrawing.current = true;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();

    if (!point) return;

    setLines([
      ...lines,
      {
        tool: tool,
        colour: tool != "eraser" ? currentColour : "",
        points: [point.x, point.y],
      },
    ]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current) return;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();

    if (!point) return;

    const lastLine = lines[lines.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);

    lines.splice(lines.length - 1, 1, lastLine);
    setLines(lines.concat());
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  return (
    <div className="flex flex-col place-items-center w-[500px] border rounded-md overflow-hidden">
      <div className="w-full h-10 flex place-items-center gap-1 p-1">
        <button disabled={lines.length === 0} onClick={() => setLines([])}>
          <FontAwesomeIcon icon={faCancel} />
        </button>
        <button
          className={tool === "brush" ? "bg-white text-black" : ""}
          onClick={() => setTool("brush")}
        >
          <FontAwesomeIcon icon={faPencil} />
        </button>
        <button
          className={tool === "eraser" ? "bg-white text-black " : ""}
          onClick={() => setTool("eraser")}
        >
          <FontAwesomeIcon icon={faEraser} />
        </button>

        <div className="w-5"></div>

        <button
          className={
            "border-white bg-black border-2 rounded-full p-0 min-w-0 w-[15px] min-h-0 h-[15px]" +
            " " +
            (currentColour === "#000000" ? "!border-white" : "")
          }
          disabled={currentColour === "#000000"}
          onClick={() => setCurrentColour("#000000")}
        ></button>
        <button
          className={
            "border-white bg-red-600 border-2 rounded-full p-0 min-w-0 w-[15px] min-h-0 h-[15px]" +
            " " +
            (currentColour === "#dc2626" ? "!border-white" : "")
          }
          disabled={currentColour === "#dc2626"}
          onClick={() => setCurrentColour("#dc2626")}
        ></button>
        <button
          className={
            "border-white bg-green-600 border-2 rounded-full p-0 min-w-0 w-[15px] min-h-0 h-[15px]" +
            " " +
            (currentColour === "#16a34a" ? "!border-white" : "")
          }
          disabled={currentColour === "#16a34a"}
          onClick={() => setCurrentColour("#16a34a")}
        ></button>
        <button
          className={
            "border-white bg-blue-600 border-2 rounded-full p-0 min-w-0 w-[15px] min-h-0 h-[15px]" +
            " " +
            (currentColour === "#2563eb" ? "!border-white" : "")
          }
          disabled={currentColour === "#2563eb"}
          onClick={() => setCurrentColour("#2563eb")}
        ></button>

        <div className="flex-grow"></div>

        <button
          disabled={lines.length === 0}
          onClick={() => {
            if (lines.length === 0) return;
            setUndoLines([...undoLines, lines[lines.length - 1]]);
            setLines(lines.slice(0, -1));
          }}
        >
          <FontAwesomeIcon icon={faUndo} />
        </button>
        <button
          disabled={undoLines.length === 0}
          onClick={() => {
            if (undoLines.length === 0) return;
            setLines([...lines, undoLines[undoLines.length - 1]]);
            setUndoLines(undoLines.slice(0, -1));
          }}
        >
          <FontAwesomeIcon icon={faRedo} />
        </button>
      </div>

      <div>
        <Stage
          width={500}
          height={500}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleMouseDown}
          onTouchMove={handleMouseMove}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {lines.map((line, i) => (
              <Line
                key={i}
                points={line.points}
                stroke={line.colour}
                strokeWidth={5}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === "brush" ? "source-over" : "destination-out"
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
