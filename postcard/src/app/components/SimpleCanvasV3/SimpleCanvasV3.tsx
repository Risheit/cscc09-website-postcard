import { Dispatch, useCallback, useEffect, useRef, useState } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import './SimpleCanvasV3.css';

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
import { Message } from './WebSocketComponent/WebSocketComponent';
import { useWebSocket } from 'next-ws/client';
import useDbSession from '@/app/hooks/useDbSession';
import { randomBytes } from 'crypto';

type Tool = 'brush' | 'eraser';
type DrawingLine = {
  id: string;
  tool: Tool;
  size: number;
  colour: Colour;
  points: number[];
  author: string;
};
type Colour = string; // hex, e.g. "#000000"

export default function SimpleCanvasV3(props: {
  setCanvasState: Dispatch<Blob | null>;
  file: File | null;
  setFile: Dispatch<File | null>;
  background?: Blob;
}) {
  const { setCanvasState, file, setFile } = props;
  const [tool, setTool] = useState<Tool>('brush');
  const [lines, setLines] = useState<DrawingLine[]>([]);
  const [strokeId, setStrokeId] = useState<string>('');
  const [undoLines, setUndoLines] = useState<DrawingLine[]>([]); // manages lines for redo
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

  const [currentStroke, setCurrentStroke] = useState<number[]>([]);

  const fileUploadRef = useRef<HTMLInputElement>(null);

  const session = useDbSession();
  const userId = session.data?.dbUser?.id ?? '';
  const username = session.data?.dbUser?.displayName;

  const ws = useWebSocket();

  const [roomId, setRoomId] = useState<string>('default');
  const [roomIdInput, setRoomIdInput] = useState<string>('default');

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

    const randomId = randomBytes(20).toString('hex');
    setStrokeId(randomId);

    setLines([
      ...lines,
      {
        id: randomId,
        tool: tool,
        size: strokeWidth,
        colour: colour,
        points: [point.x, point.y],
        author: userId,
      },
    ]);

    setUndoLines([]);

    setCurrentStroke([point.x, point.y]);
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

    if (lines.length === 0) return;

    setLines((prevLines) => {
      const updatedLines = [...prevLines];
      const lastLine = { ...updatedLines[updatedLines.length - 1] };
      lastLine.points = lastLine.points.concat([point.x, point.y]);
      updatedLines[updatedLines.length - 1] = lastLine;

      return updatedLines;
    });

    setCurrentStroke([...currentStroke, point.x, point.y]);
  };

  // helper to send messages if the websocket is open
  const wsSend = useCallback(
    (roomId: string, action: Message['action'], content?: object) => {
      if (!ws) return;
      if (ws.readyState !== ws.OPEN) {
        return;
      }
      console.log('sending', roomId, action, content);
      ws?.send(
        JSON.stringify({
          userid: userId,
          username: username,
          roomId: roomId,
          action,
          content,
        })
      );
    },
    [ws, userId, username]
  );

  async function onMessage(event: MessageEvent) {
    const payload =
      typeof event.data === 'string' ? event.data : await event.data.text();
    const message = JSON.parse(payload) as Message;
    console.log('received', message);
    if (message.action === 'stroke' && message.content) {
      const stroke = message.content as unknown as DrawingLine; // wack type casting
      setLines((prevLines) => {
        const newLines = [...prevLines, stroke];
        return newLines;
      });
    } else if (message.action === 'clear') {
      setLines([]);
      setUndoLines([]);
    } else if (message.action === 'undo' && message.content) {
      console.log('UNDO', message.content);
      setLines((prevLines) => {
        console.log('LINES', prevLines);
        const content = message.content as unknown as { undoId: string }; // wack type casting again
        if (!content) return prevLines;
        const newLines = prevLines.filter((l) => l.id != content.undoId);
        console.log('newLines', newLines);
        return newLines;
      });
    } else if (message.action === 'redo' && message.content) {
      const stroke = message.content as unknown as DrawingLine;
      setLines((prevLines) => {
        const newLines = [...prevLines, stroke];
        return newLines;
      });
      console.log('UNDO', message.content);
    } else if (message.action === 'join-response' && message.content) {
      const strokes = JSON.parse(message.content);
      for (const stroke of strokes) {
        setLines((prevLines) => {
          const newLines = [...prevLines, stroke];
          return newLines;
        });
      }
      setLines(strokes);
      console.log('joined', strokes);
    }
  }

  useEffect(() => {
    ws?.addEventListener('message', onMessage);
    wsSend(roomId, 'join');

    // rerun when navigating away and coming back

    return () => {
      ws?.removeEventListener('message', onMessage);
      wsSend(roomId, 'leave');
    };
  }, [ws, roomId, wsSend]);

  const handleMouseUp = () => {
    isDrawing.current = false;
    if (currentStroke.length != 0) {
      wsSend(roomId, 'stroke', {
        id: strokeId,
        tool: tool,
        size: strokeWidth,
        colour: currentColour[0],
        points: currentStroke,
        author: userId,
      });
      setCurrentStroke([]);
    }
  };

  // This code below is for the cursor //////////////////////////////
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
  // end of cursor code //////////////////////////////

  // called when file is changed to null
  const resetEditor = useCallback(() => {
    console.log('resetting editor');
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

    wsSend(roomId, 'join');
  }, [wsSend, roomId]);

  // if file is changed to null, reset canvas
  useEffect(() => {
    if (file === null) {
      resetEditor();
    }
  }, [file, resetEditor]);

  useEffect(() => {
    const canvas: HTMLCanvasElement | null = document.querySelector(
      '#canvas-stage > div > canvas'
    );
    if (!canvas) {
      setCanvasState(null);
      return;
    }

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
        newCanvas.toBlob(setCanvasState);
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
  }, [lines, canvasSize, file]);

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

  const setBackgroundImage = (blob: Blob) => {
    const img = new Image();
    img.src = URL.createObjectURL(blob);
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

      const bg = document.querySelector('.konvajs-content') as HTMLDivElement;
      if (!bg) return;
      bg.style.backgroundImage = `url(${img.src})`;
    };
  };

  useEffect(() => {
    if (props.background) {
      setBackgroundImage(props.background);
      setCanvasState(props.background);
    }
  }, [props.background]);

  return (
    <div className="flex gap-2">
      <div className="flex flex-col place-items-center w-[500px] border border-background-300 rounded-md overflow-hidden shadow-lg">
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
            setBackgroundImage(e.target.files[0]);
          }}
        ></input>
        <div className="w-full h-10 flex place-items-center gap-1 p-1">
          <button
            disabled={lines.length === 0 && file === null}
            onClick={() => {
              setLines([]);
              setUndoLines([]);

              wsSend(roomId, 'clear');
            }}
          >
            <FontAwesomeIcon icon={faCancel} />
          </button>
          <button
            className={
              tool === 'brush' ? 'bg-background-300 text-text-900' : ''
            }
            onClick={() => setTool('brush')}
          >
            <FontAwesomeIcon icon={faPencil} />
          </button>
          <button
            className={
              tool === 'eraser' ? 'bg-background-300 text-text-900' : ''
            }
            onClick={() => setTool('eraser')}
          >
            <FontAwesomeIcon icon={faEraser} />
          </button>

          <div className="w-5"></div>

          <button
            className={`border-white !border disabled:border-white rounded-full p-0 min-w-0 w-[20px] min-h-0 h-[20px]`}
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
            disabled={!lines.find((l) => l.author === userId)}
            onClick={() => {
              if (lines.length === 0) return;
              // remove the last line author by the current user
              const toUndo = [...lines]
                .reverse()
                .find((l) => l.author === userId);
              if (!toUndo) return;

              setUndoLines([...undoLines, toUndo]);
              setLines(lines.filter((l) => l.id != toUndo.id));

              wsSend(roomId, 'undo', { undoId: toUndo.id });
            }}
          >
            <FontAwesomeIcon icon={faUndo} />
          </button>
          <button
            disabled={undoLines.length === 0}
            onClick={() => {
              if (undoLines.length === 0) return;
              const toRedo = undoLines[undoLines.length - 1];

              setLines([...lines, toRedo]);
              setUndoLines(undoLines.slice(0, -1));

              wsSend(roomId, 'redo', toRedo);
            }}
          >
            <FontAwesomeIcon icon={faRedo} />
          </button>

          <button onClick={() => fileUploadRef.current?.click()} disabled={!!props.background}>
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
      <div className="flex flex-col gap-2">
        <span>
          State:{' '}
          {ws?.readyState === 0
            ? 'Connecting'
            : ws?.readyState === 1
            ? 'Connected'
            : 'Disconnected'}
          {ws?.readyState === 1 && ` to ${roomId}`}
        </span>
        <input
          className="p-2 bg-background-50 border border-text-500 rounded"
          type="text"
          value={roomIdInput}
          onChange={(e) => setRoomIdInput(e.target.value)}
        ></input>
        <button
          className="bg-primary-600 text-text-900"
          onClick={() => {
            setRoomId(roomIdInput);
            wsSend(roomIdInput, 'join');
          }}
        >
          join room
        </button>
      </div>{' '}
      {/* <WebSocketComponent /> */}
    </div>
  );
}
