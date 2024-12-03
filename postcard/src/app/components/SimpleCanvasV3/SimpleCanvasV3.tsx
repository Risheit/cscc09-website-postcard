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
  faCircleNodes,
  faTimes,
  faCopy,
} from '@fortawesome/free-solid-svg-icons';
import { KonvaEventObject, Node, NodeConfig } from 'konva/lib/Node';
import { Message } from './message';
import useDbSession from '@/app/hooks/useDbSession';
import { randomBytes } from 'crypto';
import { Toast } from 'react-bootstrap';

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
  submitted: boolean;
}) {
  const { setCanvasState, file, setFile, submitted } = props;
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

  const [ws, setWs] = useState<WebSocket | null>(null);

  const [roomId, setRoomId] = useState<string>('default');
  const [roomStartLoading, setRoomStartLoading] = useState(false);

  const [wsRetries, setWsRetries] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const MAX_WS_RETRIES = 5;

  // toast for room link copy
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (!submitted) return;
    // console.log('submitted', submitted);
    wsSend(roomId, 'close');
  }, [submitted]);

  const handleMouseDown = (
    e:
      | KonvaEventObject<TouchEvent, Node<NodeConfig>>
      | KonvaEventObject<MouseEvent, Node<NodeConfig>>
  ) => {
    if (roomStartLoading) return;

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
    if (roomStartLoading) return;

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
      if (ws.readyState === ws.CONNECTING && action === 'join') {
        // set max retries to 5
        if (wsRetries < MAX_WS_RETRIES) {
          setWsRetries(wsRetries + 1);
          // console.log('retrying...', wsRetries + 1, retrying, roomId, action);
        } else {
          // console.log('max retries reached');
          return;
        }
        if (retrying) return;
        setRetrying(true);
        setTimeout(() => {
          wsSend(roomId, action, content);
          setRetrying(false);
        }, 2000);
        return;
      }
      if (ws.readyState != ws.OPEN) {
        return;
      }
      setWsRetries(0);
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
    [ws, wsRetries, retrying, userId, username]
  );

  const onMessage = useCallback(async (event: MessageEvent) => {
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
      setRoomStartLoading(false);
    }
  }, []);

  // manages websocket connection
  useEffect(() => {
    if (ws === null) return;
    // console.log('ws effect', ws, roomId);

    setWs((ws) => {
      if (ws === null) return ws;
      ws.addEventListener('message', onMessage);
      return ws;
    });
    wsSend(roomId, 'join');

    return () => {
      // close ws if it exists
      setWs((ws) => {
        if (ws === null) return null;
        ws.removeEventListener('message', onMessage);
        return ws;
      });
      wsSend(roomId, 'leave');
      // console.log('closing ws');
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
  const resetEditor = () => {
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
  };

  // if file is changed to null, reset canvas
  useEffect(() => {
    if (file === null) {
      resetEditor();
    } else {
      setBackground(file);
    }
  }, [file]);

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

  const setBackground = (image: File) => {
    const img = new Image();
    img.src = URL.createObjectURL(image);
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

  return (
    <>
      <div className="flex gap-2 mb-2">
        <button
          className={
            ws !== null || roomStartLoading
              ? 'inline bg-background-200 px-3'
              : 'inline bg-background-200 px-3 disabled:bg-transparent border !border-transparent disabled:!border-background-200'
          }
          disabled={!file || ws !== null || roomStartLoading}
          onClick={() => {
            if (ws !== null) return;
            setFile(null);
          }}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
        <button
          className="inline bg-background-200 py-2 px-4"
          disabled={ws !== null || roomStartLoading}
          onClick={() => {
            if (ws !== null) return;
            fileUploadRef.current?.click();
          }}
        >
          upload an image <FontAwesomeIcon className="pl-1" icon={faUpload} />
        </button>
        <button
          className={
            ws !== null || roomStartLoading || lines.length > 0
              ? 'inline bg-background-200 py-2 px-4'
              : 'inline bg-primary-600 py-2 px-4 disabled:bg-transparent border !border-transparent disabled:!border-background-200'
          }
          disabled={
            !file || ws !== null || roomStartLoading || lines.length > 0
          }
          onClick={async () => {
            if (!file || lines.length > 0) return;

            setRoomStartLoading(true);

            const formData = new FormData();

            formData.append('image', file);

            const res = await fetch('/api/room/create', {
              method: 'POST',
              body: formData,
            });

            const json = await res.json();

            console.log('Room created: ', json);

            setRoomId(json.roomId);

            setWs(
              new WebSocket(
                process.env.NODE_ENV === 'production'
                  ? `wss://${process.env.NEXT_PUBLIC_BASEURL}/api/ws`
                  : `ws://${process.env.NEXT_PUBLIC_BASEURL}/api/ws`
              )
            );

            fetch(`/api/images/${json.imageId}`).then((res) => {
              if (!res.ok) return;
              res.blob().then((blob) => {
                setFile(new File([blob], 'image.png'));
              });
            });
          }}
        >
          start a room <FontAwesomeIcon className="pl-1" icon={faCircleNodes} />
        </button>
      </div>

      <div className="flex flex-col gap-2 pb-2">
        <span>
          {ws === null
            ? ''
            : ws.readyState === ws.CONNECTING
            ? 'Connecting...'
            : ws.readyState === ws.OPEN
            ? 'Connected'
            : 'Disconnected'}
          {ws && ws.readyState === ws?.OPEN && ` to `}
          {ws && ws.readyState === ws?.OPEN && (
            <span
              className="italic text-primary-600 underline cursor-pointer"
              onClick={() => {
                // copy to clipboard
                navigator.clipboard.writeText(
                  process.env.NEXT_PUBLIC_BASEURL + '/room/' + roomId
                );
                // show bootstrap toast
                setShowToast(true);
              }}
            >
              {roomId}
              <FontAwesomeIcon className="pl-2" icon={faCopy} />
            </span>
          )}
          <Toast
            className="absolute top-16 right-2 bg-background-200 border !border-background-300 p-3"
            show={showToast}
            onClose={() => setShowToast(false)}
            autohide={true}
            delay={2000}
          >
            Copied link to clipboard!
          </Toast>
        </span>
      </div>

      <div className="flex gap-2">
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
              if (e.target.files === null || e.target.files.length === 0)
                return;
              setFile(e.target.files[0]);
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
      </div>
    </>
  );
}
