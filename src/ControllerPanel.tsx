import { fromDate } from "@foxglove/rostime";
import {
  Immutable,
  MessageEvent,
  PanelExtensionContext,
} from "@foxglove/extension";
import { useEffect, useLayoutEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";

import { GamepadView } from "./components/GamepadView";
import kbmapping1 from "./components/kbmapping1.json";
import { Joy } from "./types";

type Config = {
  subJoyTopic: string;
  publishMode: boolean;
  pubJoyTopic: string;
  publishFrameId: string;
  keyboardEnabled: boolean;
};

type KbMap = {
  button: number;
  axis: number;
  direction: number;
  value: number;
};

function ControllerPanel({ context }: { context: PanelExtensionContext }) {
  const [messages, setMessages] =
    useState<Immutable<MessageEvent[]> | undefined>();
  const [joy, setJoy] = useState<Joy | undefined>();

  // ---------------- CONFIG ----------------

  const [config, setConfig] = useState<Config>(() => {
    const saved = context.initialState as Partial<Config>;
    return {
      subJoyTopic: saved.subJoyTopic ?? "/joy",
      publishMode: saved.publishMode ?? false,
      pubJoyTopic: saved.pubJoyTopic ?? "/joy_out",
      publishFrameId: saved.publishFrameId ?? "",
      keyboardEnabled: saved.keyboardEnabled ?? true,
    };
  });

  // ---------------- SETTINGS PANEL ----------------

useEffect(() => {
  context.updatePanelSettingsEditor({
    actionHandler: (action) => {
      if (action.action === "update") {
        const key = action.payload.path[1] as keyof Config;

        setConfig((prev) => ({
          ...prev,
          [key]: (action.payload as any).value,
        }));
      }
    },
    nodes: {
      controller: {
        label: "Controller Settings",
        fields: {
          subJoyTopic: {
            label: "Subscribe Topic",
            input: "string",
            value: config.subJoyTopic,
          },
          publishMode: {
            label: "Enable Publish",
            input: "boolean",
            value: config.publishMode,
          },
          pubJoyTopic: {
            label: "Publish Topic",
            input: "string",
            value: config.pubJoyTopic,
          },
          publishFrameId: {
            label: "Publish Frame ID",
            input: "string",
            value: config.publishFrameId,
          },
          keyboardEnabled: {
            label: "Enable Keyboard Override",
            input: "boolean",
            value: config.keyboardEnabled,
          },
        },
      },
    },
  });
}, [config, context]);


  useEffect(() => {
    context.saveState(config);
  }, [context, config]);

  // ---------------- RENDER HANDLER ----------------

  useLayoutEffect(() => {
    context.onRender = (renderState, done) => {
      setMessages(renderState.currentFrame);
      done();
    };
    context.watch("currentFrame");
  }, [context]);

  // ---------------- SUBSCRIBE ----------------

  useEffect(() => {
    context.unsubscribeAll();
    context.subscribe([config.subJoyTopic]);
  }, [context, config.subJoyTopic]);

  // ---------------- PROCESS INCOMING JOY ----------------

  useEffect(() => {
    const latestJoy =
      messages?.[messages.length - 1]?.message as Joy | undefined;

    if (latestJoy && !config.keyboardEnabled) {
      setJoy({
        header: latestJoy.header,
        axes: Array.from(latestJoy.axes),
        buttons: Array.from(latestJoy.buttons),
      });
    }
  }, [messages, config.keyboardEnabled]);

  // ---------------- KEYBOARD MODE ----------------

  const [trackedKeys, setTrackedKeys] = useState<Map<string, KbMap>>(() => {
    const map = new Map<string, KbMap>();
    for (const [key, value] of Object.entries(kbmapping1)) {
      map.set(key, {
        button: value.button,
        axis: value.axis,
        direction: value.direction === "+" ? 1 : -1,
        value: 0,
      });
    }
    return map;
  });

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    setTrackedKeys((old) => {
      const copy = new Map(old);
      const k = copy.get(event.key);
      if (k) k.value = 1;
      return copy;
    });
  }, []);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    setTrackedKeys((old) => {
      const copy = new Map(old);
      const k = copy.get(event.key);
      if (k) k.value = 0;
      return copy;
    });
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    if (!config.keyboardEnabled) return;

    const axes: number[] = [];
    const buttons: number[] = [];

    trackedKeys.forEach((value) => {
      if (value.button >= 0) {
        while (buttons.length <= value.button) buttons.push(0);
        buttons[value.button] = value.value;
      } else if (value.axis >= 0) {
        while (axes.length <= value.axis) axes.push(0);
        axes[value.axis] += value.direction * value.value;
      }
    });

    setJoy({
      header: {
        frame_id: config.publishFrameId,
        stamp: fromDate(new Date()),
      },
      axes,
      buttons,
    });
  }, [trackedKeys, config.keyboardEnabled, config.publishFrameId]);

  // ---------------- PUBLISH ----------------

  useEffect(() => {
    if (!config.publishMode) return;

    context.advertise?.(config.pubJoyTopic, "sensor_msgs/Joy");

    return () => {
      context.unadvertise?.(config.pubJoyTopic);
    };
  }, [context, config.publishMode, config.pubJoyTopic]);

  useEffect(() => {
    if (!config.publishMode || !joy) return;
    context.publish?.(config.pubJoyTopic, joy);
  }, [joy, config.publishMode, config.pubJoyTopic, context]);

  // ---------------- UI ----------------

  return (
    <GamepadView
      joy={joy}
      cbInteractChange={() => {}}
      layoutName="dualshock-ps5"
    />
  );
}

// ---------------- INIT ----------------

export function initControllerPanel(
  context: PanelExtensionContext,
): () => void {
  ReactDOM.render(<ControllerPanel context={context} />, context.panelElement);
  return () => {
    ReactDOM.unmountComponentAtNode(context.panelElement);
  };
}
