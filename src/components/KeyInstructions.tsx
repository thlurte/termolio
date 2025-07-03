import React from 'react';

interface KeyInstructionsProps {
  showKeyInstructions: boolean;
  onHide: () => void;
}

const KeyInstructions: React.FC<KeyInstructionsProps> = ({ showKeyInstructions, onHide }) => {
  if (!showKeyInstructions) return null;

  return (
    <div className="key-instructions-statusbar" onClick={onHide}>
      <span><b>Tab:</b> Autocomplete</span>
      <span className="separator"></span>
      <span><b>↑/↓:</b> Navigate History</span>
      <span className="separator"></span>
      <span><b>Ctrl+C:</b> Clear Input</span>
      <span className="separator"></span>
      <span><b>F1:</b> Toggle Help</span>
      <span className="separator"></span>
      <span style={{ fontSize: '0.8em', opacity: 0.7 }}>(Click to hide)</span>
    </div>
  );
};

export default KeyInstructions;
