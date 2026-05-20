import React from "react";
import PropTypes from "prop-types";
import Chip from "@material-ui/core/Chip";
import { makeStyles } from "@material-ui/core/styles";
import { getLabelChipTextColor } from "../../utils/getLabelChipTextColor";

const useStyles = makeStyles(() => ({
  chip: {
    fontWeight: 600,
    borderRadius: 999,
    height: 22,
    fontSize: "0.68rem",
    letterSpacing: "0.02em",
    transition: "transform 0.15s ease, box-shadow 0.15s ease",
    "&:hover": {
      transform: "scale(1.03)",
    },
  },
}));

export default function ContactLabelChip({
  label,
  onDelete,
  size = "small",
  className,
}) {
  const classes = useStyles();
  if (!label) return null;

  const textColor = getLabelChipTextColor(label.color);

  return (
    <Chip
      size={size}
      label={label.name}
      onDelete={onDelete}
      className={`${classes.chip} ${className || ""}`}
      style={{
        backgroundColor: label.color,
        color: textColor,
      }}
    />
  );
}

ContactLabelChip.propTypes = {
  label: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    color: PropTypes.string,
  }),
  onDelete: PropTypes.func,
  size: PropTypes.string,
  className: PropTypes.string,
};
