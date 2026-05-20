import React from "react";
import PropTypes from "prop-types";
import Box from "@material-ui/core/Box";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Chip from "@material-ui/core/Chip";
import Typography from "@material-ui/core/Typography";
import Alert from "@material-ui/lab/Alert";
import { makeStyles } from "@material-ui/core/styles";
import { i18n } from "../../translate/i18n";

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
  },
  chips: {
    display: "flex",
    flexWrap: "wrap",
    gap: theme.spacing(0.5),
    marginTop: theme.spacing(1),
  },
}));

export default function WhatsappBehaviorConnectionBar({
  rows,
  selectedIds,
  onChange,
  loading,
  mixedValues,
}) {
  const classes = useStyles();

  if (!rows.length) {
    return null;
  }

  const allSelected = selectedIds.length === rows.length;
  const selectValue = allSelected ? ["__all__"] : selectedIds;

  const handleChange = (event) => {
    const value = event.target.value;
    if (!Array.isArray(value)) return;
    if (value.includes("__all__")) {
      onChange(rows.map((r) => r.id));
      return;
    }
    onChange(value.map(Number).filter((id) => id > 0));
  };

  return (
    <Box className={classes.root}>
      <FormControl fullWidth variant="outlined" size="small" disabled={loading}>
        <InputLabel id="whatsapp-behavior-connections-label">
          {i18n.t("settings.whatsappBehavior.applyToConnections")}
        </InputLabel>
        <Select
          labelId="whatsapp-behavior-connections-label"
          multiple
          value={selectValue}
          onChange={handleChange}
          renderValue={(selected) => {
            if (selected.includes("__all__")) {
              return i18n.t("settings.whatsappBehavior.allConnections");
            }
            return selected
              .map((id) => rows.find((r) => r.id === id)?.name || id)
              .join(", ");
          }}
          label={i18n.t("settings.whatsappBehavior.applyToConnections")}
        >
          <MenuItem value="__all__">
            {i18n.t("settings.whatsappBehavior.allConnections")}
          </MenuItem>
          {rows.map((row) => (
            <MenuItem key={row.id} value={row.id}>
              {row.name}
              {row.status ? ` (${row.status})` : ""}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div className={classes.chips}>
        {selectedIds.length === rows.length ? (
          <Chip
            size="small"
            label={i18n.t("settings.whatsappBehavior.allConnections")}
            color="primary"
          />
        ) : (
          selectedIds.map((id) => {
            const row = rows.find((r) => r.id === id);
            return (
              <Chip
                key={id}
                size="small"
                label={row?.name || id}
                onDelete={() => onChange(selectedIds.filter((x) => x !== id))}
              />
            );
          })
        )}
      </div>
      {mixedValues ? (
        <Box mt={1}>
          <Alert severity="info">
            {i18n.t("settings.whatsappBehavior.mixedValuesHint")}
          </Alert>
        </Box>
      ) : null}
      <Typography variant="caption" color="textSecondary" display="block" style={{ marginTop: 8 }}>
        {i18n.t("settings.whatsappBehavior.saveAppliesHint")}
      </Typography>
    </Box>
  );
}

WhatsappBehaviorConnectionBar.propTypes = {
  rows: PropTypes.array,
  selectedIds: PropTypes.array,
  onChange: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  mixedValues: PropTypes.bool,
};
