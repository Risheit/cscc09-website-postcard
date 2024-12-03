import { Dispatch, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import './SimpleCanvasV2.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCancel,
  faPencil,
  faEraser,
  faDroplet,
  faMinus,
  faPlus,
  faUndo,
  faRedo,
  faUpload,
  faSave,
} from '@fortawesome/free-solid-svg-icons';
import { KonvaEventObject, Node, NodeConfig } from 'konva/lib/Node';

type Tool = 'brush' | 'eraser';
type Line = { tool: Tool; size: number; colour: Colour; points: number[] };
type Colour = string; // hex, e.g. "#000000"

export default function SimpleCanvasV2(props: {
  file: File | null;
  setFile: Dispatch<File | null>;
}) {
  const { file, setFile } = props;
  const [tool, setTool] = useState<Tool>('brush');
  const [lines, setLines] = useState<Line[]>([]);
  const [undoLines, setUndoLines] = useState<Line[]>([]); // manages lines for redo
  const isDrawing = useRef(false);
  const [currentColour, setCurrentColour] = useState<Colour[]>([
    '#ffffff',
    '#dc2626',
    '#16a34a',
    '#2563eb',
  ]);
  const [canvasSize, setCanvasSize] = useState({ width: 500, height: 500 });

  const [colorPicker, setColorPicker] = useState('#ffffff');
  const [colorPickerUsed, setColorPickerUsed] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(5);

  const fileUploadRef = useRef<HTMLInputElement>(null);

  const handleMouseDown = (
    e:
      | KonvaEventObject<TouchEvent, Node<NodeConfig>>
      | KonvaEventObject<MouseEvent, Node<NodeConfig>>
  ) => {
    isDrawing.current = true;

    const stage = e.target.getStage();
    const point = stage?.getPointerPosition();

    if (!point) return;

    let colour = currentColour[0];

    // if color picker is used, set the current colour to the color picker
    if (colorPickerUsed && !currentColour.includes(colorPicker)) {
      colour = colorPicker;
      setCurrentColour([
        colour,
        currentColour[0],
        ...currentColour.slice(1).filter((c) => c !== colorPicker),
      ]);
      setColorPickerUsed(false);
    }

    setLines([
      ...lines,
      {
        tool: tool,
        size: strokeWidth,
        colour: colour,
        points: [point.x, point.y],
      },
    ]);

    setUndoLines([]);
  };

  const handleMouseMove = (
    e:
      | KonvaEventObject<TouchEvent, Node<NodeConfig>>
      | KonvaEventObject<MouseEvent, Node<NodeConfig>>
  ) => {
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

  const [showCursor, setShowCursor] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasPos = useRef({ top: 0, left: 0 });

  useEffect(() => {
    document.body.onmousemove = function (e) {
      setMousePos({ x: e.clientX, y: e.clientY });

      const canvas: HTMLCanvasElement | null = document.querySelector(
        '#canvas-stage > div > canvas'
      );

      if (!canvas) return;
      canvasPos.current = {
        top: canvas.getBoundingClientRect().top,
        left: canvas.getBoundingClientRect().left,
      };

      // if mousePos within canvas
      if (
        e.clientX > canvasPos.current.left &&
        e.clientY > canvasPos.current.top &&
        e.clientX < canvasPos.current.left + canvasSize.width &&
        e.clientY < canvasPos.current.top + canvasSize.height
      ) {
        setShowCursor(true);
        canvas.style.cursor = 'none';
      } else {
        setShowCursor(false);
        canvas.style.cursor = 'default';
      }
    };

    // cleanup
    return () => {
      document.body.onmousemove = null;
    };
  }, [showCursor, mousePos, canvasSize]);

  // called when file is changed to null
  const resetEditor = () => {
    setLines([]);
    setUndoLines([]);
    setCanvasSize({ width: 500, height: 500 });

    // reset upload input
    const upload = fileUploadRef.current;
    if (!upload) return;
    upload.value = '';

    // remove background image
    const bg = document.querySelector('.konvajs-content') as HTMLDivElement;
    if (!bg) return;
    bg.style.backgroundImage = '';
  };

  // if file is changed to null, reset canvas
  useEffect(() => {
    if (file === null) {
      resetEditor();
    }
  }, [file]);

  // save canvas
  const saveCanvas = () => {
    const canvas: HTMLCanvasElement | null = document.querySelector(
      '#canvas-stage > div > canvas'
    );
    if (!canvas) return;

    console.log('found canvas');

    // create new canvas, fill with white, draw old canvas on top
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvasSize.width;
    newCanvas.height = canvasSize.height;
    const newCtx = newCanvas.getContext('2d');
    if (!newCtx) return;

    const drawOldCanvas = () => {
      const oldCanvas = new Image();
      oldCanvas.src = canvas.toDataURL();
      oldCanvas.onload = () => {
        newCtx.drawImage(oldCanvas, 0, 0, canvasSize.width, canvasSize.height);

        const link = document.createElement('a');
        link.href = newCanvas.toDataURL();
        link.download = 'canvas.png';
        link.click();
      };
    };

    if (file) {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        newCtx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
        drawOldCanvas();
      };
    } else {
      newCtx.fillStyle = '#000000';
      newCtx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      drawOldCanvas();
    }
  };

  return (
    <div className="flex flex-col place-items-center w-[500px] border !border-background-300 rounded-md overflow-hidden shadow-lg">
      {showCursor && (
        <div
          id="circularcursor"
          style={{
            left: mousePos.x + window.scrollX - strokeWidth / 2 + 'px',
            top: mousePos.y + window.scrollY - strokeWidth / 2 + 'px',
            width: strokeWidth,
            height: strokeWidth,
            mixBlendMode: 'difference',
          }}
        ></div>
      )}
      <input
        id="file-upload"
        ref={fileUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files === null || e.target.files.length === 0) return;
          setFile(e.target.files[0]);

          const img = new Image();
          img.src = URL.createObjectURL(e.target.files[0]);
          img.onload = () => {
            console.log(`${img.width} x ${img.height}`);

            setLines([]);
            setUndoLines([]);

            // scale canvas to image size

            const MAX_SIZE = 500;

            if (img.width > img.height) {
              console.log('new canvas size', {
                width: MAX_SIZE,
                height: (MAX_SIZE / img.width) * img.height,
              });
              setCanvasSize({
                width: MAX_SIZE,
                height: (MAX_SIZE / img.width) * img.height,
              });
            } else {
              console.log('new canvas size', {
                width: (MAX_SIZE / img.height) * img.width,
                height: MAX_SIZE,
              });
              setCanvasSize({
                width: (MAX_SIZE / img.height) * img.width,
                height: MAX_SIZE,
              });
            }

            const bg = document.querySelector(
              '.konvajs-content'
            ) as HTMLDivElement;
            if (!bg) return;
            bg.style.backgroundImage = `url(${img.src})`;
          };
        }}
      ></input>
      <div className="w-full h-10 flex place-items-center gap-1 p-1">
        <button
          disabled={lines.length === 0 && file === null}
          onClick={() => {
            setFile(null);
          }}
        >
          <FontAwesomeIcon icon={faCancel} />
        </button>
        <button
          className={tool === 'brush' ? 'bg-background-300 text-text-900' : ''}
          onClick={() => setTool('brush')}
        >
          <FontAwesomeIcon icon={faPencil} />
        </button>
        <button
          className={tool === 'eraser' ? 'bg-background-300 text-text-900' : ''}
          onClick={() => setTool('eraser')}
        >
          <FontAwesomeIcon icon={faEraser} />
        </button>

        <div className="w-5"></div>

        <button
          className={`!border-white !border disabled:!border-white rounded-full p-0 min-w-0 w-[20px] min-h-0 h-[20px]`}
          disabled={true}
          style={{ backgroundColor: currentColour[0] }}
        ></button>

        <div className="relative inline-block">
          <button>
            <FontAwesomeIcon icon={faDroplet} />
          </button>
          <input
            type="color"
            value={colorPicker}
            className="opacity-0 absolute left-0 top-0 w-full"
            onChange={(e) => {
              const newColor = e.target.value;
              setColorPicker(newColor);
              setColorPickerUsed(true);
            }}
          />
        </div>

        {currentColour.slice(1, 4).map((colour, i) => (
          <button
            key={i}
            className={`border-white border-2 rounded-full p-0 min-w-0 w-[15px] min-h-0 h-[15px] ${
              currentColour[0] === colour ? 'border-2' : ''
            }`}
            onClick={() =>
              setCurrentColour([
                colour,
                currentColour[0],
                ...currentColour.slice(1).filter((c) => c !== colour),
              ])
            }
            style={{ backgroundColor: colour }}
          ></button>
        ))}

        <div className="w-5"></div>

        <button
          disabled={strokeWidth === 5}
          onClick={() => {
            setStrokeWidth(Math.max(strokeWidth - 5, 5));
          }}
        >
          <FontAwesomeIcon icon={faMinus} />
        </button>
        <span className="w-[20px] text-center">{strokeWidth}</span>
        <button
          disabled={strokeWidth === 50}
          onClick={() => {
            setStrokeWidth(Math.min(strokeWidth + 5, 50));
          }}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>

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

        <button onClick={() => fileUploadRef.current?.click()}>
          <FontAwesomeIcon icon={faUpload} />
        </button>

        <button onClick={saveCanvas}>
          <FontAwesomeIcon icon={faSave} />
        </button>
      </div>

      <div>
        <Stage
          id="canvas-stage"
          width={canvasSize.width}
          height={canvasSize.height}
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
                strokeWidth={line.size}
                tension={0.5}
                lineCap="round"
                lineJoin="round"
                globalCompositeOperation={
                  line.tool === 'brush' ? 'source-over' : 'destination-out'
                }
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
