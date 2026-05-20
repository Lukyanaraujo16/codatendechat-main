import React, { useState } from "react";
import PropTypes from "prop-types";
import { Box, Button } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/Add";

import { i18n } from "../../translate/i18n";
import ContactLabelChip from "../ContactLabelChip";
import ContactLabelsModal from "../ContactLabelsModal";
import api from "../../services/api";
import toastError from "../../errors/toastError";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(0.75),
    maxWidth: "100%",
  },
  addBtn: {
    borderRadius: 999,
    textTransform: "none",
    fontSize: "0.72rem",
    fontWeight: 600,
    padding: theme.spacing(0.25, 1),
    minHeight: 24,
  },
}));

export default function ContactLabelsBar({
  contactId,
  labels,
  onLabelsChange,
  compact,
}) {
  const classes = useStyles();
  const [modalOpen, setModalOpen] = useState(false);
  const list = Array.isArray(labels) ? labels : [];

  const removeLabel = async (labelId) => {
    const next = list.filter((l) => l.id !== labelId);
    try {
      const { data } = await api.put(`/contacts/${contactId}/labels`, {
        labelIds: next.map((l) => l.id),
      });
      onLabelsChange(Array.isArray(data) ? data : next);
    } catch (err) {
      toastError(err);
    }
  };

  if (!contactId) return null;

  return (
    <>
      <Box className={classes.root}>
        {list.map((label) => (
          <ContactLabelChip
            key={label.id}
            label={label}
            size={compact ? "small" : "small"}
            onDelete={() => removeLabel(label.id)}
          />
        ))}
        <Button
          size="small"
          className={classes.addBtn}
          startIcon={<AddIcon style={{ fontSize: 16 }} />}
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
        >
          {i18n.t("contactLabels.addLabel")}
        </Button>
      </Box>

      <ContactLabelsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        contactId={contactId}
        selectedLabels={list}
        onSaved={onLabelsChange}
      />
    </>
  );
}

ContactLabelsBar.propTypes = {
  contactId: PropTypes.number,
  labels: PropTypes.array,
  onLabelsChange: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};
