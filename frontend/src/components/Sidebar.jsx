import styles from "../styles/sidebar.module.css";

export default function Sidebar({
  onAddNode,
  onReset,
  onStartSession,
  onStopSession,
  isSessionActive,
}) {
  const nodeTypes = [
    {
      type: "trigger",
      label: "Trigger",
      icon: "/src/assets/images/icons/flag.svg",
    },
    {
      type: "action",
      label: "Action",
      icon: "/src/assets/images/icons/lightning.svg",
    },
    {
      type: "conditional",
      label: "If / Else",
      icon: "/src/assets/images/icons/branch.svg",
    },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.app_header}>
        <h1 className={styles.app_title}>haptix</h1>
        <img src="/logo-white.svg" alt="logo" className={styles.app_logo} />
      </div>
      <button
        className={styles.sidebar_item}
        onClick={isSessionActive ? onStopSession : onStartSession}
      >
        <span className={styles.sidebar_icon}>
          <img
            src={
              isSessionActive
                ? "/src/assets/images/icons/stop.svg"
                : "/src/assets/images/icons/play.svg"
            }
            alt={isSessionActive ? "stop session" : "start session"}
          />
        </span>
        <span className={styles.sidebar_label}>
          {isSessionActive ? "Stop" : "Start Session"}
        </span>
      </button>
      <h3>automation</h3>
      <div className={styles.sidebar_items}>
        <button className={styles.sidebar_item}>
          <span className={styles.sidebar_icon}>
            <img src="/src/assets/images/icons/play.svg" alt="start" />
          </span>
          <span className={styles.sidebar_label}>Start</span>
        </button>
        <button className={styles.sidebar_item} onClick={onReset}>
          <span className={styles.sidebar_icon}>
            <img src="/src/assets/images/icons/reset.svg" alt="reset" />
          </span>
          <span className={styles.sidebar_label}>Reset</span>
        </button>
        <button
          className={`${styles.sidebar_item} ${styles.sidebar_item_disabled}`}
        >
          <span className={styles.sidebar_icon}>
            <img src="/src/assets/images/icons/share.svg" alt="share" />
          </span>
          <span className={styles.sidebar_label}>Share</span>
        </button>
      </div>
      <h3>nodes</h3>
      <div className={styles.sidebar_items}>
        {nodeTypes.map((node) => (
          <button
            key={node.type}
            className={styles.sidebar_item}
            onClick={() => onAddNode(node.type)}
          >
            <span className={styles.sidebar_icon}>
              <img src={node.icon} alt={node.label} />
            </span>
            <span className={styles.sidebar_label}>{node.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
