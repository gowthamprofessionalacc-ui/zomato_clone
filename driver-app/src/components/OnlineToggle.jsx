import './OnlineToggle.css';

const OnlineToggle = ({ isOnline, onChange, disabled }) => {
  return (
    <div 
      className={`online-toggle ${isOnline ? 'online' : 'offline'} ${disabled ? 'disabled' : ''}`}
      onClick={() => !disabled && onChange(!isOnline)}
    >
      <div className="toggle-track">
        <div className="toggle-thumb"></div>
      </div>
      <span className="toggle-text">
        {isOnline ? 'ONLINE' : 'OFFLINE'}
      </span>
    </div>
  );
};

export default OnlineToggle;
