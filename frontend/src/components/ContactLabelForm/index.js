import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  TextField,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import ContactLabelChip from "../ContactLabelChip";
import {
  SUGGESTED_CONTACT_LABEL_COLORS,
  CONTACT_LABEL_COLOR_KEYS,
  getLastUsedContactLabelColor,
  setLastUsedContactLabelColor,
} from "../../utils/contactLabelColors";
import { showSuccessToast } from "../../errors/feedbackToasts";

const useStyles = makeStyles((theme) => ({
  drawerPaper: {
    width: "100%",
    maxWidth: 420,
    padding: theme.spacing(2.5),
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: theme.spacing(2),
  },
  colorRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
  },
  colorSwatch: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    cursor: "pointer",
    border: `2px solid transparent`,
    transition: "transform 0.15s ease",
    "&:hover": { transform: "scale(1.08)" },
  },
  colorSwatchSelected: {
    borderColor: theme.palette.text.primary,
    transform: "scale(1.1)",
  },
  customColorRow: {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
  },
  previewBox: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: 14,
    background: alpha(
      theme.palette.primary.main,
      theme.palette.type === "dark" ? 0.08 : 0.04
    ),
  },
  actions: {
    display: "flex",
    gap: theme.spacing(1),
    marginTop: theme.spacing(3),
  },
}));

export default function ContactLabelForm({ open, onClose, labelId, onSaved }) {
  const classes = useStyles();
  const isEdit = Boolean(labelId);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(getLastUsedContactLabelColor);
  const [description, setDescription] = useState("");
  const [customHex, setCustomHex] = useState("");

  useEffect(() => {
    if (!open) return;
    if (!labelId) {
      setName("");
      setColor(getLastUsedContactLabelColor());
      setDescription("");
      setCustomHex("");
      return;
    }
    setLoading(true);
    api
      .get("/contact-labels/manage")
      .then(({ data }) => {
        const row = (Array.isArray(data) ? data : []).find((l) => l.id === labelId);
        if (row) {
          setName(row.name || "");
          setColor(row.color || getLastUsedContactLabelColor());
          setDescription(row.description || "");
          const preset = Object.values(SUGGESTED_CONTACT_LABEL_COLORS);
          if (!preset.includes(row.color)) {
            setCustomHex(row.color || "");
          } else {
            setCustomHex("");
          }
        }
      })
      .catch(toastError)
      .finally(() => setLoading(false));
  }, [open, labelId]);

  const effectiveColor =
    customHex && /^#[0-9A-Fa-f]{6}$/.test(customHex.trim())
      ? customHex.trim()
      : color;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        color: effectiveColor,
        description: description.trim() || null,
      };
      if (isEdit) {
        await api.put(`/contact-labels/${labelId}`, payload);
        showSuccessToast("contactLabelsManage.toasts.updated");
      } else {
        await api.post("/contact-labels", payload);
        showSuccessToast("contactLabelsManage.toasts.created");
      }
      setLastUsedContactLabelColor(effectiveColor);
      onSaved();
      onClose();
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} classes={{ paper: classes.drawerPaper }}>
      <div className={classes.header}>
        <Typography variant="h6">
          {isEdit
            ? i18n.t("contactLabelsManage.form.editTitle")
            : i18n.t("contactLabelsManage.form.createTitle")}
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </div>

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress size={32} />
        </Box>
      ) : (
        <>
          <TextField
            fullWidth
            required
            variant="outlined"
            size="small"
            label={i18n.t("contactLabelsManage.form.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin="dense"
          />

          <Typography variant="subtitle2" style={{ marginTop: 16 }}>
            {i18n.t("contactLabelsManage.form.color")}
          </Typography>
          <div className={classes.colorRow}>
            {CONTACT_LABEL_COLOR_KEYS.map((key) => {
              const hex = SUGGESTED_CONTACT_LABEL_COLORS[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`${classes.colorSwatch} ${
                    !customHex && color === hex ? classes.colorSwatchSelected : ""
                  }`}
                  style={{ backgroundColor: hex }}
                  onClick={() => {
                    setColor(hex);
                    setCustomHex("");
                  }}
                  aria-label={key}
                />
              );
            })}
          </div>
          <div className={classes.customColorRow}>
            <TextField
              size="small"
              variant="outlined"
              label={i18n.t("contactLabelsManage.form.customColor")}
              placeholder="#1E88E5"
              value={customHex}
              onChange={(e) => setCustomHex(e.target.value)}
              fullWidth
            />
          </div>

          <div className={classes.previewBox}>
            <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
              {i18n.t("contactLabelsManage.form.preview")}
            </Typography>
            <ContactLabelChip
              label={{
                name: name.trim() || i18n.t("contactLabels.modal.preview"),
                color: effectiveColor,
              }}
            />
          </div>

          <TextField
            fullWidth
            variant="outlined"
            size="small"
            label={i18n.t("contactLabelsManage.form.description")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="dense"
            multiline
            rows={3}
          />

          <div className={classes.actions}>
            <Button onClick={onClose} disabled={saving}>
              {i18n.t("contactLabelsManage.form.cancel")}
            </Button>
            <Button
              color="primary"
              variant="contained"
              onClick={handleSave}
              disabled={saving || !name.trim()}
            >
              {saving ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                i18n.t("contactLabelsManage.form.save")
              )}
            </Button>
          </div>
        </>
      )}
    </Drawer>
  );
}

ContactLabelForm.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  labelId: PropTypes.number,
  onSaved: PropTypes.func.isRequired,
};
