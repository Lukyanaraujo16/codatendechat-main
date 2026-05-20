import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
} from "@material-ui/core";

import api from "../../services/api";
import toastError from "../../errors/toastError";
import { i18n } from "../../translate/i18n";
import { showSuccessToast } from "../../errors/feedbackToasts";

export default function ContactLabelDeleteModal({
  open,
  onClose,
  label,
  otherLabels,
  onDeleted,
}) {
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState({ contacts: 0 });
  const [mode, setMode] = useState("remove");
  const [replaceWith, setReplaceWith] = useState("");

  useEffect(() => {
    if (!open || !label?.id) return;
    setMode("remove");
    setReplaceWith("");
    setLoading(true);
    api
      .get(`/contact-labels/${label.id}/usage`)
      .then(({ data }) => setUsage({ contacts: data?.contacts ?? 0 }))
      .catch(toastError)
      .finally(() => setLoading(false));
  }, [open, label?.id]);

  const hasContacts = usage.contacts > 0;
  const replaceOptions = (otherLabels || []).filter((l) => l.id !== label?.id);

  const handleDelete = async () => {
    if (!label?.id) return;
    if (hasContacts && mode === "replace" && !replaceWith) return;

    setLoading(true);
    try {
      const body = hasContacts
        ? mode === "replace"
          ? { mode: "replace", replaceWith: Number(replaceWith) }
          : { mode: "remove" }
        : { mode: "remove" };

      await api.delete(`/contact-labels/${label.id}`, { data: body });
      showSuccessToast("contactLabelsManage.toasts.deleted");
      onDeleted();
      onClose();
    } catch (err) {
      toastError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{i18n.t("contactLabelsManage.delete.title")}</DialogTitle>
      <DialogContent>
        {loading && !hasContacts ? (
          <Box display="flex" justifyContent="center" py={2}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Typography variant="body2" paragraph>
              {hasContacts
                ? i18n.t("contactLabelsManage.delete.usedBy", {
                    count: usage.contacts,
                    name: label?.name,
                  })
                : i18n.t("contactLabelsManage.delete.confirmUnused", {
                    name: label?.name,
                  })}
            </Typography>

            {hasContacts ? (
              <FormControl component="fieldset">
                <RadioGroup value={mode} onChange={(e) => setMode(e.target.value)}>
                  <FormControlLabel
                    value="remove"
                    control={<Radio color="primary" />}
                    label={i18n.t("contactLabelsManage.delete.modeRemove")}
                  />
                  <FormControlLabel
                    value="replace"
                    control={<Radio color="primary" />}
                    label={i18n.t("contactLabelsManage.delete.modeReplace")}
                    disabled={replaceOptions.length === 0}
                  />
                </RadioGroup>
              </FormControl>
            ) : null}

            {hasContacts && mode === "replace" ? (
              <TextField
                select
                fullWidth
                variant="outlined"
                size="small"
                label={i18n.t("contactLabelsManage.delete.replaceWith")}
                value={replaceWith}
                onChange={(e) => setReplaceWith(e.target.value)}
                margin="dense"
              >
                {replaceOptions.map((l) => (
                  <MenuItem key={l.id} value={String(l.id)}>
                    {l.name}
                  </MenuItem>
                ))}
              </TextField>
            ) : null}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {i18n.t("contactLabelsManage.form.cancel")}
        </Button>
        <Button
          color="secondary"
          variant="contained"
          onClick={handleDelete}
          disabled={
            loading ||
            (hasContacts && mode === "replace" && !replaceWith)
          }
        >
          {i18n.t("contactLabelsManage.delete.confirm")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ContactLabelDeleteModal.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  label: PropTypes.object,
  otherLabels: PropTypes.array,
  onDeleted: PropTypes.func.isRequired,
};
