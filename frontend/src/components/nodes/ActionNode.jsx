import { Handle, Position } from "@xyflow/react";
import styles from "../../styles/node.module.css";
import lightningIcon from "../../assets/images/icons/lightning.svg";

const actionTypes = [
  {
    id: "vibe",
    label: "Vibrate",
    params: ["type"],
  },
  {
    id: "zap",
    label: "Zap",
    params: ["type"],
  },
  {
    id: "beep",
    label: "Beep",
    params: ["type"],
  },
  {
    id: "wait",
    label: "Wait",
    params: ["seconds"],
  },
];

const stimulusTypes = [
  { id: "single", label: "Single" },
  { id: "double", label: "Double" },
  { id: "triple", label: "Triple" },
  { id: "long", label: "Long" },
  { id: "heartbeat", label: "Heartbeat" },
  { id: "breathing", label: "Breathing" },
];

export default function ActionNode({ data, id }) {
  const selectedType =
    actionTypes.find((t) => t.id === data.actionType) || actionTypes[0];

  return (
    <div className={`${styles.node} ${styles.action_node}`}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.node_header}>
        <span className={styles.node_icon}>
          <img src={lightningIcon} alt="lightning" />
        </span>
        <span className={styles.node_title}>Action</span>
      </div>
      <div className={styles.node_body}>
        <div className={styles.node_field}>
          <label>Type</label>
          <select
            value={data.actionType || "vibe"}
            onChange={(e) => data.onChange?.(id, "actionType", e.target.value)}
          >
            {actionTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        {selectedType.params.includes("type") && (
          <div className={styles.node_field}>
            <label>Stimulus Type</label>
            <select
              value={data.stimulusType || "single"}
              onChange={(e) =>
                data.onChange?.(id, "stimulusType", e.target.value)
              }
            >
              {stimulusTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        )}
        {selectedType.params.includes("seconds") && (
          <div className={styles.node_field}>
            <label>Seconds</label>
            <input
              type="number"
              min="1"
              value={data.seconds || 15}
              onChange={(e) =>
                data.onChange?.(id, "seconds", parseInt(e.target.value))
              }
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
