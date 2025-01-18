import { useState } from "react";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import { FaQuestionCircle } from "react-icons/fa";

const NotAcceptedTooltip = () => {
  const [visible, setVisible] = useState(false);

  const toggleVisibility = () => setVisible(!visible);

  const tooltipText = `
  A transaction may appear unaccepted because miners 
  reward their parent blocks. When parallel blocks 
  are created with identical blue scores, only one 
  reward transaction is accepted. In rare cases, a 
  double-spend transaction may also be rejected.`;

  return (
    <OverlayTrigger
      show={visible}
      placement="top"
      overlay={
        <Tooltip id="not-accepted-tooltip">{tooltipText.trim()}</Tooltip>
      }
    >
      <span
        onClick={toggleVisibility}
        style={{ cursor: "pointer", marginLeft: "0.5rem" }}
      >
        <FaQuestionCircle />
      </span>
    </OverlayTrigger>
  );
};

export default NotAcceptedTooltip;
