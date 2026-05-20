import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  TextField,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import { makeStyles, alpha } from "@material-ui/core/styles";
import AddIcon from "@material-ui/icons/Add";
import SearchIcon from "@material-ui/icons/Search";
import InputAdornment from "@material-ui/core/InputAdornment";

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
import { canManageContactLabels } from "../../utils/canManageContactLabels";
import { AuthContext } from "../../context/Auth/AuthContext";
import { showSuccessToast } from "../../errors/feedbackToasts";

const useStyles = makeStyles((theme) => ({
  search: {
    marginBottom: theme.spacing(2),
  },
  labelGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    minHeight: 48,
  },
  colorRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    cursor: "pointer",
    border: `2px solid transparent`,
    transition: "transform 0.15s ease, border-color 0.15s ease",
    "&:hover": {
      transform: "scale(1.08)",
    },
  },
  colorSwatchSelected: {
    borderColor: theme.palette.text.primary,
    transform: "scale(1.1)",
  },
  preview: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(2),
  },
  createForm: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    borderRadius: 12,
    backgroundColor: alpha(
      theme.palette.primary.main,
      theme.palette.type === "dark" ? 0.08 : 0.04
    ),
  },
}));

export default function ContactLabelsModal({
  open,
  onClose,
  contactId,
  selectedLabels,
  onSaved,
}) {
  const classes = useStyles();
  const { user } = React.useContext(AuthContext);
  const canManage = canManageContactLabels(user);

  const [allLabels, setAllLabels] = useState([]);
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(getLastUsedContactLabelColor);
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const loadLabels = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/contact-labels", {
        params: search.trim() ? { searchParam: search.trim() } : {},
      });
      setAllLabels(Array.isArray(data) ? data : []);
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (!open) return;
    setSelected(Array.isArray(selectedLabels) ? [...selectedLabels] : []);
    setSearch("");
    setShowCreate(false);
    setNewName("");
    setNewColor(getLastUsedContactLabelColor());
    setNewDescription("");
  }, [open, selectedLabels]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(loadLabels, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [open, loadLabels, search]);

  const filteredLabels = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allLabels;
    return allLabels.filter((l) => l.name.toLowerCase().includes(q));
  }, [allLabels, search]);

  const toggleLabel = (label) => {
    setSelected((prev) => {
      const exists = prev.some((x) => x.id === label.id);
      if (exists) return prev.filter((x) => x.id !== label.id);
      return [...prev, label];
    });
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post("/contact-labels", {
        name: newName.trim(),
        color: newColor,
        description: newDescription.trim() || null,
      });
      setLastUsedContactLabelColor(newColor);
      setAllLabels((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setSelected((prev) => [...prev, data]);
      setShowCreate(false);
      setNewName("");
      setNewDescription("");
      showSuccessToast("contactLabels.toasts.created");
    } catch (err) {
      toastError(err);
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!contactId) return;
    setSaving(true);
    try {
      const { data } = await api.put(`/contacts/${contactId}/labels`, {
        labelIds: selected.map((l) => l.id),
      });
      const labels = Array.isArray(data) ? data : selected;
      onSaved(labels);
      showSuccessToast("contactLabels.toasts.saved");
      onClose();
    } catch (err) {
      toastError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{i18n.t("contactLabels.modal.title")}</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          size="small"
          variant="outlined"
          className={classes.search}
          placeholder={i18n.t("contactLabels.modal.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <Box className={classes.labelGrid}>
            {filteredLabels.length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                {i18n.t("contactLabels.modal.empty")}
              </Typography>
            ) : (
              filteredLabels.map((label) => {
                const isOn = selected.some((s) => s.id === label.id);
                return (
                  <Box
                    key={label.id}
                    component="button"
                    type="button"
                    onClick={() => toggleLabel(label)}
                    style={{
                      border: "none",
                      background: "none",
                      padding: 0,
                      cursor: "pointer",
                      opacity: isOn ? 1 : 0.55,
                    }}
                  >
                    <ContactLabelChip
                      label={label}
                      onDelete={isOn ? () => toggleLabel(label) : undefined}
                    />
                  </Box>
                );
              })
            )}
          </Box>
        )}

        {canManage ? (
          <>
            <Divider style={{ margin: "16px 0" }} />
            {!showCreate ? (
              <Button
                startIcon={<AddIcon />}
                color="primary"
                size="small"
                onClick={() => setShowCreate(true)}
              >
                {i18n.t("contactLabels.modal.newLabel")}
              </Button>
            ) : (
              <Box className={classes.createForm}>
                <Typography variant="subtitle2" gutterBottom>
                  {i18n.t("contactLabels.modal.createTitle")}
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label={i18n.t("contactLabels.modal.name")}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  margin="dense"
                />
                <Typography variant="caption" color="textSecondary">
                  {i18n.t("contactLabels.modal.color")}
                </Typography>
                <Box className={classes.colorRow}>
                  {CONTACT_LABEL_COLOR_KEYS.map((key) => {
                    const hex = SUGGESTED_CONTACT_LABEL_COLORS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`${classes.colorSwatch} ${
                          newColor === hex ? classes.colorSwatchSelected : ""
                        }`}
                        style={{ backgroundColor: hex }}
                        onClick={() => setNewColor(hex)}
                        aria-label={key}
                      />
                    );
                  })}
                </Box>
                <Box className={classes.preview}>
                  <ContactLabelChip
                    label={{ name: newName.trim() || i18n.t("contactLabels.modal.preview"), color: newColor }}
                  />
                </Box>
                <TextField
                  fullWidth
                  size="small"
                  variant="outlined"
                  label={i18n.t("contactLabels.modal.description")}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  margin="dense"
                  multiline
                  rows={2}
                />
                <Box display="flex" gap={1} mt={1}>
                  <Button size="small" onClick={() => setShowCreate(false)}>
                    {i18n.t("contactLabels.modal.cancel")}
                  </Button>
                  <Button
                    size="small"
                    color="primary"
                    variant="contained"
                    disabled={!newName.trim() || creating}
                    onClick={handleCreate}
                  >
                    {i18n.t("contactLabels.modal.saveLabel")}
                  </Button>
                </Box>
              </Box>
            )}
          </>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{i18n.t("contactLabels.modal.cancel")}</Button>
        <Button
          color="primary"
          variant="contained"
          onClick={handleSave}
          disabled={saving || !contactId}
        >
          {i18n.t("contactLabels.modal.apply")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ContactLabelsModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  contactId: PropTypes.number,
  selectedLabels: PropTypes.array,
  onSaved: PropTypes.func.isRequired,
};
