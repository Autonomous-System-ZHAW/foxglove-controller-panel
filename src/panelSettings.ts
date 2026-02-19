import {
  Topic,
  SettingsTreeNodes,
  SettingsTreeFields,
  SettingsTreeAction,
} from "@foxglove/extension";
import { produce } from "immer";
import * as _ from "lodash-es";

export type Config = {
  subJoyTopic: string;
  publishMode: boolean;
  pubJoyTopic: string;
  layoutName: string;
};

export function settingsActionReducer(
  prevConfig: Config,
  action: SettingsTreeAction,
): Config {
  return produce(prevConfig, (draft) => {
    if (action.action === "update") {
      const { path, value } = action.payload;
      _.set(draft, path.slice(1), value);
    }
  });
}

export function buildSettingsTree(
  config: Config,
  topics?: readonly Topic[],
): SettingsTreeNodes {
  const subscriptionFields: SettingsTreeFields = {
    subJoyTopic: {
      label: "Subscribe Joy Topic",
      input: "select",
      value: config.subJoyTopic,
      options: (topics ?? [])
        .filter((topic) => topic.datatype === "sensor_msgs/msg/Joy")
        .map((topic) => ({
          label: topic.name,
          value: topic.name,
        })),
    },
  };

  const publishFields: SettingsTreeFields = {
    publishMode: {
      label: "Enable Publish",
      input: "boolean",
      value: config.publishMode,
    },
    pubJoyTopic: {
      label: "Publish Joy Topic",
      input: "string",
      value: config.pubJoyTopic,
      disabled: !config.publishMode,   
    },
  };


  const displayFields: SettingsTreeFields = {
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
  };

  return {
    subscription: {
      label: "Subscription",
      fields: subscriptionFields,
    },
    publish: {
      label: "Publish",
      fields: publishFields,
    },
    display: {
      label: "Display",
      fields: displayFields,
    },
  };
}
