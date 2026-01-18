import { Handle, Position } from '@xyflow/react';
import styles from '../../styles/node.module.css';

const triggerTypes = [
  { id: 'keyword', label: 'Key word or phrase', params: ['keyword'] },
  { id: 'prompt', label: 'Prompt', params: ['prompt'] },
];

export default function TriggerNode({ data, id }) {
  const selectedType = triggerTypes.find(t => t.id === data.triggerType) || triggerTypes[0];

  return (
    <div className={`${styles.node} ${styles.trigger_node} ${data.isStart ? styles.start_node : ''}`}>
      <Handle type="target" position={Position.Left} />
      <div className={styles.node_header}>
        <span className={styles.node_icon}>
          <img src="/src/assets/images/icons/flag.svg" alt="flag" />
        </span>
        <span className={styles.node_title}>
          {data.isStart ? 'Start Trigger' : 'Trigger'}
        </span>
      </div>
      <div className={styles.node_body}>
        <div className={styles.node_field}>
          <label>Type</label>
          <select 
            value={data.triggerType || 'keyword'}
            onChange={(e) => data.onChange?.(id, 'triggerType', e.target.value)}
          >
            {triggerTypes.map(type => (
              <option key={type.id} value={type.id}>{type.label}</option>
            ))}
          </select>
        </div>
        {selectedType.params.includes('keyword') && (
          <div className={styles.node_field}>
            <label>Key word</label>
            <textarea 
              className="nodrag"
              value={data.keyword || ''}
              onChange={(e) => data.onChange?.(id, 'keyword', e.target.value)}
              placeholder="e.g. 'Stop'"
              rows={2}
            />
          </div>
        )}
        {selectedType.params.includes('prompt') && (
          <div className={styles.node_field}>
            <label>Prompt</label>
            <textarea 
              className="nodrag"
              value={data.prompt || ''}
              onChange={(e) => data.onChange?.(id, 'prompt', e.target.value)}
              placeholder="Enter natural language prompt... e.g. 'when conversation goes off-topic'"
              rows={4}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}
