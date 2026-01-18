import { Handle, Position } from '@xyflow/react';
import styles from '../../styles/node.module.css';

const actionTypes = [
  { 
    id: 'vibe', 
    label: 'Vibrate', 
    params: ['value'] 
  },
  { 
    id: 'zap', 
    label: 'Zap', 
    params: ['value'] 
  },
  { 
    id: 'beep', 
    label: 'Beep', 
    params: ['value'] 
  },
  { 
    id: 'wait', 
    label: 'Wait', 
    params: ['seconds'] 
  }
];

export default function ActionNode({ data, id }) {
  const selectedType = actionTypes.find(t => t.id === data.actionType) || actionTypes[0];

  return (
    <div className={`${styles.node} ${styles.action_node}`}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.node_header}>
        <span className={styles.node_icon}>
          <img src="/src/assets/images/icons/lightning.svg" alt="lightning" />
        </span>
        <span className={styles.node_title}>Action</span>
      </div>
      <div className={styles.node_body}>
        <div className={styles.node_field}>
          <label>Type</label>
          <select 
            value={data.actionType || 'vibe'}
            onChange={(e) => data.onChange?.(id, 'actionType', e.target.value)}
          >
            {actionTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>
        {selectedType.params.includes('value') && (
          <div className={styles.node_field}>
            <label>Value (1-100)</label>
            <input 
              type="number" 
              min="1" 
              max="100" 
              value={data.value || 50}
              onChange={(e) => data.onChange?.(id, 'value', parseInt(e.target.value))}
            />
          </div>
        )}
        {selectedType.params.includes('seconds') && (
          <div className={styles.node_field}>
            <label>Seconds</label>
            <input 
              type="number" 
              min="1" 
              value={data.seconds || 15}
              onChange={(e) => data.onChange?.(id, 'seconds', parseInt(e.target.value))}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
