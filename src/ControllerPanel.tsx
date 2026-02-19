import {
  Immutable,
  MessageEvent,
  PanelExtensionContext,
} from "@foxglove/extension";
import { useEffect, useLayoutEffect, useState } from "react";
import ReactDOM from "react-dom";

import { GamepadView } from "./components/GamepadView";

type Joy = {
  header: {
    stamp: any;
    frame_id: string;
  };
  axes: number[];
  buttons: number[];
};

type Config = {
  subJoyTopic: string;
  publishMode: boolean;
  pubJoyTopic: string;
  layoutName: string;
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
      layoutName: saved.layoutName ?? "dualshock-ps5",
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
              disabled: !config.publishMode,
            },
            layoutName: {
              label: "Controller Layout",
              input: "select",
              value: config.layoutName,
              options: [
                {
                  label: "DualShock PS5",
                  value: "dualshock-ps5",
                },
              ],
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

    if (latestJoy) {
      setJoy({
        header: latestJoy.header,
        axes: Array.from(latestJoy.axes),
        buttons: Array.from(latestJoy.buttons),
      });
    }
  }, [messages]);

  // ---------------- PUBLISH ----------------

  useEffect(() => {
    if (!config.publishMode) return;

    // Schutz gegen Self-Republish
    if (config.subJoyTopic === config.pubJoyTopic) return;

    context.advertise?.(config.pubJoyTopic, "sensor_msgs/msg/Joy");

    return () => {
      context.unadvertise?.(config.pubJoyTopic);
    };
  }, [context, config.publishMode, config.pubJoyTopic, config.subJoyTopic]);

  useEffect(() => {
    if (!config.publishMode || !joy) return;
    if (config.subJoyTopic === config.pubJoyTopic) return;

    context.publish?.(config.pubJoyTopic, joy);
  }, [joy, config.publishMode, config.pubJoyTopic, config.subJoyTopic, context]);

  // ---------------- UI ----------------

  return (
    <GamepadView
      joy={joy}
      cbInteractChange={() => {}}
      layoutName={config.layoutName}
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
