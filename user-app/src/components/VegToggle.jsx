import './VegToggle.css';

const VegToggle = ({ checked, onChange }) => {
  return (
    <label className="veg-toggle">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="toggle-slider"></span>
      <span className="toggle-label">Veg Only</span>
    </label>
  );
};

export default VegToggle;
